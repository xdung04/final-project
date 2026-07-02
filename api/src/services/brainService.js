import Groq from "groq-sdk";
import {
  getBranches, getBarbers, getSlots, getServices,
  createBooking, resetBooking, transferToReceptionist, updateBookingState,
} from "./bookingTools.js";
import { searchKnowledge } from "./knowledgeTools.js";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const MODEL = "meta-llama/llama-4-scout-17b-16e-instruct";

// ─────────────────────────────────────────────────────────────
// Tool Definitions
// ─────────────────────────────────────────────────────────────
const toolDefinitions = [
  {
    type: "function",
    function: {
      name: "getBranches",
      description: "Lấy danh sách chi nhánh đang hoạt động.",
      parameters: { type: "object", properties: {}, required: [] },
    },
  },
  {
    type: "function",
    function: {
      name: "getBarbers",
      description: "Lấy danh sách thợ của một chi nhánh. Phải gọi sau khi khách chọn chi nhánh.",
      parameters: {
        type: "object",
        properties: {
          idBranch: { type: ["number", "string"], description: "ID chi nhánh (integer)." },
        },
        required: ["idBranch"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "getSlots",
      description: "Lấy danh sách khung giờ trống. Chỉ gọi sau khi updateBookingState đã lưu bookingDate thành công.",
      parameters: {
        type: "object",
        properties: {
          idBranch:    { type: ["number", "string"], description: "ID chi nhánh (integer)." },
          idBarber:    { type: ["number", "string"], description: "ID thợ (integer)." },
          bookingDate: { type: "string", description: "Ngày đặt định dạng YYYY-MM-DD." },
        },
        required: ["idBranch", "idBarber", "bookingDate"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "getServices",
      description: "Lấy danh sách dịch vụ của chi nhánh. Chỉ gọi sau khi updateBookingState đã lưu slotTime thành công.",
      parameters: {
        type: "object",
        properties: {
          idBranch: { type: ["number", "string"], description: "ID chi nhánh (integer)." },
        },
        required: ["idBranch"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "updateBookingState",
      description: `Lưu thông tin khách vừa xác nhận vào booking state. 
PHẢI gọi tool này NGAY SAU KHI khách xác nhận mỗi thông tin, TRƯỚC KHI gọi bất kỳ tool nào tiếp theo.
KHÔNG được bỏ qua bước này dù bất kỳ lý do gì.`,
      parameters: {
        type: "object",
        properties: {
          fields: {
            type: "object",
            description: "Các trường cần cập nhật.",
            properties: {
              idBranch:     { type: ["number", "string"], description: "ID chi nhánh (integer)." },
              branchName:   { type: "string" },
              idBarber:     { type: ["number", "string"], description: "ID thợ (integer)." },
              barberName:   { type: "string" },
              bookingDate:  { type: "string", description: "Định dạng YYYY-MM-DD." },
              slotTime:     { type: "string", description: "Định dạng HH:MM." },
              // Không khai báo type: "array" — Groq validate phía server sẽ reject
              // nếu LLM truyền vào dạng string "[1]". coerceIds() sẽ normalize sau.
              idServices:   { description: "Mảng số ID dịch vụ, ví dụ: [1, 2]. PHẢI là JSON array, KHÔNG phải string." },
              serviceNames: { description: "Mảng tên dịch vụ, ví dụ: [\"Cắt tóc Classic\"]. PHẢI là JSON array, KHÔNG phải string." },
            },
          },
        },
        required: ["fields"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "createBooking",
      description: "Tạo lịch hẹn chính thức. Chỉ gọi sau khi khách đã xác nhận toàn bộ thông tin.",
      parameters: {
        type: "object",
        properties: {
          state: { type: "object", description: "Toàn bộ bookingState hiện tại." },
        },
        required: ["state"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "resetBooking",
      description: "Xóa một phần hoặc toàn bộ booking state.",
      parameters: {
        type: "object",
        properties: {
          fields: {
            type: "array",
            items: { type: "string" },
            description: "Danh sách field cần xóa. Để trống để xóa toàn bộ.",
          },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "transferToReceptionist",
      description: "Chuyển cuộc trò chuyện sang lễ tân khi khách yêu cầu gặp người thật.",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function",
    function: {
      name: "searchKnowledge",
      description: "Tra cứu kiến thức về tóc, dịch vụ, bảng giá của Nam Barbershop.",
      parameters: {
        type: "object",
        properties: {
          query:     { type: "string" },
          namespace: {
            type: "string",
            enum: ["hairstyles", "colors", "products", "haircare"],
          },
        },
        required: ["query", "namespace"],
      },
    },
  },
];

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────
function toNumber(val) {
  if (val === null || val === undefined) return val;
  const n = Number(val);
  return isNaN(n) ? val : n;
}

function coerceIds(args) {
  if (!args || typeof args !== "object") return args || {};
  const result = JSON.parse(JSON.stringify(args));

  if (typeof result.state === "string") {
    try {
      result.state = JSON.parse(result.state);
    } catch {
      result.state = {};
    }
  }

  if (result.state && typeof result.state === "object") {
    const s = result.state;
    if (s.idBranch !== undefined) s.idBranch = toNumber(s.idBranch);
    if (s.idBarber !== undefined) s.idBarber = toNumber(s.idBarber);

    if (typeof s.idServices === "string") {
      try { s.idServices = JSON.parse(s.idServices); } catch { s.idServices = []; }
    }
    if (!Array.isArray(s.idServices)) s.idServices = [];
    s.idServices = s.idServices.map(toNumber);

    if (typeof s.serviceNames === "string") {
      try { s.serviceNames = JSON.parse(s.serviceNames); } catch { s.serviceNames = []; }
    }
    if (!Array.isArray(s.serviceNames)) s.serviceNames = [];
  }

  if (result.idBranch !== undefined) result.idBranch = toNumber(result.idBranch);
  if (result.idBarber !== undefined) result.idBarber = toNumber(result.idBarber);

  if (result.fields && typeof result.fields === "object") {
    const f = result.fields;
    if (f.idBranch !== undefined) f.idBranch = toNumber(f.idBranch);
    if (f.idBarber !== undefined) f.idBarber = toNumber(f.idBarber);

    if (typeof f.idServices === "string") {
      try { f.idServices = JSON.parse(f.idServices); } catch { f.idServices = []; }
    }
    if (!Array.isArray(f.idServices)) f.idServices = [];
    f.idServices = f.idServices.map(toNumber);

    if (typeof f.serviceNames === "string") {
      try { f.serviceNames = JSON.parse(f.serviceNames); } catch { f.serviceNames = []; }
    }
    if (!Array.isArray(f.serviceNames)) f.serviceNames = [];
  }

  return result;
}

function getVietnamDate(offsetDays = 0) {
  const d = new Date(Date.now() + offsetDays * 86400000);
  return d.toLocaleDateString("sv-SE", { timeZone: "Asia/Ho_Chi_Minh" });
}

function getVietnamDateLabel(offsetDays = 0) {
  const d = new Date(Date.now() + offsetDays * 86400000);
  return d.toLocaleDateString("vi-VN", {
    timeZone: "Asia/Ho_Chi_Minh",
    weekday: "long", day: "2-digit", month: "2-digit", year: "numeric",
  });
}

function getMissingStepHint(state) {
  if (!state.idBranch)            return "CHI_NHÁNH";
  if (!state.idBarber)            return "THỢ";
  if (!state.bookingDate)         return "NGÀY";
  if (!state.slotTime)            return "GIỜ";
  if (!state.idServices?.length)  return "DỊCH_VỤ";
  return "XÁC_NHẬN";
}

// ─────────────────────────────────────────────────────────────
// FIX 1 — Pre-extract ngày/giờ từ message, không phụ thuộc LLM
// ─────────────────────────────────────────────────────────────
function preExtractFields(message, missingStep, today, tomorrow) {
  const msg = message.trim();

  if (missingStep === "NGÀY") {
    // "hôm nay"
    if (/hôm nay/i.test(msg)) return { bookingDate: today };
    // "ngày mai"
    if (/ngày mai/i.test(msg)) return { bookingDate: tomorrow };
    // "thứ 2/3/.../7" hoặc "chủ nhật" trong tuần tới / tuần này
    const weekdayMap = {
      "thứ 2": 1, "thứ hai": 1,
      "thứ 3": 2, "thứ ba": 2,
      "thứ 4": 3, "thứ tư": 3,
      "thứ 5": 4, "thứ năm": 4,
      "thứ 6": 5, "thứ sáu": 5,
      "thứ 7": 6, "thứ bảy": 6,
      "chủ nhật": 0, "chủ nhât": 0,
    };
    for (const [keyword, targetDay] of Object.entries(weekdayMap)) {
      if (msg.toLowerCase().includes(keyword)) {
        const now = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Ho_Chi_Minh" }));
        const currentDay = now.getDay();
        let diff = targetDay - currentDay;
        if (diff <= 0) diff += 7; // luôn lấy ngày tới
        const target = new Date(now.getTime() + diff * 86400000);
        const bookingDate = target.toLocaleDateString("sv-SE", { timeZone: "Asia/Ho_Chi_Minh" });
        return { bookingDate };
      }
    }
    // "23/6" hoặc "23-6" hoặc "23/06/2026"
    const dmMatch = msg.match(/(\d{1,2})[\/\-](\d{1,2})(?:[\/\-](\d{4}))?/);
    if (dmMatch) {
      const year = dmMatch[3] || new Date().getFullYear();
      const month = String(dmMatch[2]).padStart(2, "0");
      const day   = String(dmMatch[1]).padStart(2, "0");
      return { bookingDate: `${year}-${month}-${day}` };
    }
    return null;
  }

  if (missingStep === "GIỜ") {
    // "12 giờ", "12h", "12:30", "12h30", "8 giờ sáng", "3 giờ chiều"
    const timeMatch = msg.match(/(\d{1,2})\s*(?:[:h](\d{2}))?\s*(?:giờ)?\s*(sáng|chiều|tối)?/i);
    if (timeMatch) {
      let h = parseInt(timeMatch[1], 10);
      const min = timeMatch[2] ? String(timeMatch[2]).padStart(2, "0") : "00";
      const period = timeMatch[3]?.toLowerCase();
      if (period === "chiều" || period === "tối") {
        if (h < 12) h += 12;
      }
      if (period === "sáng" && h === 12) h = 0;
      return { slotTime: `${String(h).padStart(2, "0")}:${min}` };
    }
    return null;
  }

  return null;
}

// ─────────────────────────────────────────────────────────────
// FIX 2 — Validation dùng pendingState (không phải currentState 2 lần)
// ─────────────────────────────────────────────────────────────
function validateToolCall(toolName, pendingState) {
  const checks = {
    getSlots: () => {
      if (!pendingState.bookingDate) {
        return {
          valid: false,
          error: "Bạn phải gọi updateBookingState để lưu bookingDate trước khi gọi getSlots. Hãy retry.",
        };
      }
      return { valid: true };
    },
    getServices: () => {
      if (!pendingState.slotTime) {
        return {
          valid: false,
          error: "Bạn phải gọi updateBookingState để lưu slotTime trước khi gọi getServices. Hãy retry.",
        };
      }
      return { valid: true };
    },
    createBooking: () => {
      if (
        !pendingState.idBranch || !pendingState.idBarber ||
        !pendingState.bookingDate || !pendingState.slotTime ||
        !pendingState.idServices?.length
      ) {
        return {
          valid: false,
          error: "Khách chưa xác nhận đủ thông tin. Không thể tạo booking.",
        };
      }
      return { valid: true };
    },
    default: () => ({ valid: true }),
  };

  const check = checks[toolName] || checks.default;
  return check();
}

// ─────────────────────────────────────────────────────────────
// Dynamic Action Rules
// ─────────────────────────────────────────────────────────────
function getDynamicActionRules(state) {
  const nextStep = getMissingStepHint(state);

  const actionRules = {
    "CHI_NHÁNH": `
[HÀNH ĐỘNG TIẾP THEO] Khách cần chọn chi nhánh:
  1️⃣ CALL: getBranches()
  2️⃣ Chờ danh sách
  3️⃣ CALL: updateBookingState({ fields: { idBranch: NUMBER, branchName: "Tên chi nhánh" } })
  4️⃣ Chờ { success: true }
  5️⃣ Hiển thị danh sách thợ
⚠️ CÁCH BIỆT: Không được gọi tool khác!`,

    "THỢ": `
[HÀNH ĐỘNG TIẾP THEO] Khách cần chọn thợ:
  1️⃣ CALL: getBarbers({ idBranch: ${state.idBranch} })
  2️⃣ Chờ danh sách
  3️⃣ Khách chọn → CALL: updateBookingState({ fields: { idBarber: NUMBER, barberName: "Tên thợ" } })
  4️⃣ Chờ { success: true }
  5️⃣ Hỏi khách chọn ngày nào
⚠️ CÁCH BIỆT: Không được gọi getSlots, getServices, hay tool khác!`,

    "NGÀY": `
[HÀNH ĐỘNG TIẾP THEO] Khách cần chọn ngày:
  1️⃣ Khách chọn ngày → CALL: updateBookingState({ fields: { bookingDate: "YYYY-MM-DD" } })
  2️⃣ Chờ { success: true }
  3️⃣ CALL: getSlots({ idBranch: ${state.idBranch}, idBarber: ${state.idBarber}, bookingDate: "YYYY-MM-DD" })
  4️⃣ Hiển thị danh sách giờ
⚠️ CÁCH BIỆT: Không được gọi getServices hay updateBookingState 2 lần!
⚠️ LỖI THƯỜNG GẶP: Quên updateBookingState trước getSlots → HỆ THỐNG SẼ REJECT!`,

    "GIỜ": `
[HÀNH ĐỘNG TIẾP THEO] Khách cần chọn giờ:
  1️⃣ Khách chọn giờ → CALL: updateBookingState({ fields: { slotTime: "HH:MM" } })
  2️⃣ Chờ { success: true }
  3️⃣ CALL: getServices({ idBranch: ${state.idBranch} })
  4️⃣ Hiển thị danh sách dịch vụ
⚠️ CÁCH BIỆT: Không được gọi getServices trước updateBookingState!`,

    "DỊCH_VỤ": `
[HÀNH ĐỘNG TIẾP THEO] Khách cần chọn dịch vụ:
  1️⃣ Khách chọn dịch vụ từ danh sách → CALL: updateBookingState({ fields: { idServices: [NUMBER, ...], serviceNames: ["Tên", ...] } })
  2️⃣ Chờ { success: true }
  3️⃣ Hiển thị tóm tắt đặt lịch
  4️⃣ Hỏi khách có chắc chứ
⚠️ CÁCH BIỆT: Không được gọi createBooking hay tool khác!`,

    "XÁC_NHẬN": `
[HÀNH ĐỘNG TIẾP THEO] Khách xác nhận tất cả:
  1️⃣ Hiển thị tóm tắt đầy đủ
  2️⃣ Khách đồng ý → CALL: createBooking({ state: currentBookingState })
  3️⃣ Thông báo tạo lịch thành công
⚠️ CÁCH BIỆT: Không được gọi updateBookingState hay tool khác!`,
  };

  return actionRules[nextStep] || "";
}

// ─────────────────────────────────────────────────────────────
// Execute Tool
// ─────────────────────────────────────────────────────────────
async function executeTool(toolName, toolArgs, context) {
  const args = coerceIds(toolArgs);
  console.log(`🔧 [brainService] Executing ${toolName}:`, JSON.stringify(args));

  switch (toolName) {
    case "getBranches":            return await getBranches();
    case "getBarbers":             return await getBarbers(args);
    case "getSlots":               return await getSlots(args);
    case "getServices":            return await getServices(args);
    case "updateBookingState":     return updateBookingState(args);
    case "createBooking":          return await createBooking({ state: args.state || args, customerId: context.customerId });
    case "resetBooking":           return resetBooking({ fields: args.fields || [] });
    case "transferToReceptionist": return await transferToReceptionist({ customerId: context.customerId });
    case "searchKnowledge":        return await searchKnowledge(args);
    default:
      return { success: false, error: `Tool không tồn tại: ${toolName}` };
  }
}

// ─────────────────────────────────────────────────────────────
// Update local state after tool
// ─────────────────────────────────────────────────────────────
function updateStateFromTool(toolName, toolResult, currentState) {
  if (toolResult?.success === false) return currentState;
  const next = { ...currentState };

  switch (toolName) {
    case "updateBookingState":
      if (toolResult.success && toolResult.updatedFields) {
        return { ...next, ...toolResult.updatedFields };
      }
      break;
    case "resetBooking":
      if (toolResult.clearedState) return { ...toolResult.clearedState, bookingCompleted: false };
      if (toolResult.clearedFields) return { ...next, ...toolResult.clearedFields };
      break;
    case "createBooking":
      if (toolResult.success) {
        next.bookingCompleted = true;
        next.idBooking = toolResult.idBooking;
      }
      break;
  }
  return next;
}

// ─────────────────────────────────────────────────────────────
// Build System Prompt
// ─────────────────────────────────────────────────────────────
function buildSystemPrompt({ isLoggedIn, customerId, currentState }) {
  const timeContext = new Date().toLocaleString("vi-VN", {
    timeZone: "Asia/Ho_Chi_Minh",
    dateStyle: "full",
    timeStyle: "short",
  });

  const today     = getVietnamDate(0);
  const tomorrow  = getVietnamDate(1);
  const todayLabel    = getVietnamDateLabel(0);
  const tomorrowLabel = getVietnamDateLabel(1);

  const missingStep  = getMissingStepHint(currentState);
  const dynamicRules = getDynamicActionRules(currentState);

  const stateDisplay = `
Chi nhánh  : ${currentState.branchName  || "chưa chọn"} ${currentState.idBranch ? `(id: ${currentState.idBranch})` : ""}
Thợ        : ${currentState.barberName  || "chưa chọn"} ${currentState.idBarber ? `(id: ${currentState.idBarber})` : ""}
Ngày       : ${currentState.bookingDate || "chưa chọn"}
Giờ        : ${currentState.slotTime    || "chưa chọn"}
Dịch vụ   : ${currentState.serviceNames?.length ? currentState.serviceNames.join(", ") : "chưa chọn"}
`.trim();

  return `Bạn là trợ lý AI của Nam Barbershop — tiệm tóc nam cao cấp.

━━━ THÔNG TIN PHIÊN ━━━
Thời gian hiện tại : ${timeContext}
"hôm nay"          = ${today} (${todayLabel})
"ngày mai"         = ${tomorrow} (${tomorrowLabel})
Trạng thái đăng nhập: ${isLoggedIn ? "Đã đăng nhập (customerId: " + customerId + ")" : "Chưa đăng nhập"}

━━━ BOOKING STATE HIỆN TẠI ━━━
${stateDisplay}
⚡ BƯỚC CẦN XỬ LÝ TIẾP THEO: ${missingStep}

━━━ VAI TRÒ ━━━
Chỉ làm 2 việc:
1. Hỗ trợ đặt lịch tại Nam Barbershop.
2. Tư vấn kiến thức về tóc/dịch vụ (qua searchKnowledge).
Từ chối lịch sự mọi yêu cầu ngoài phạm vi.

━━━ QUY TẮC BẮT BUỘC — ĐỌC KỸ ━━━

[RULE 1] TOOL LÀ NGUỒN SỰ THẬT DUY NHẤT
- Mọi dữ liệu (chi nhánh, thợ, giờ, dịch vụ, giá) PHẢI lấy từ tool.
- TUYỆT ĐỐI KHÔNG tự bịa, không dùng trí nhớ hội thoại thay dữ liệu tool.
- TUYỆT ĐỐI KHÔNG nhúng JSON raw vào tin nhắn trả lời khách.
  ✗ SAI: liệt kê {"idService": 1, "serviceName": "Cắt tóc"} ra chat
  ✓ ĐÚNG: "Em có 4 dịch vụ: 1. Cắt tóc nam  2. Tẩy tóc  3. Nhuộm tóc  4. Chăm sóc tóc"

[RULE 2] AUTH GATE (isLoggedIn = ${isLoggedIn})
${!isLoggedIn ? `- Khách CHƯA đăng nhập.
- KHÔNG gọi bất kỳ booking tool nào (getBranches, getBarbers, getSlots, getServices, createBooking, resetBooking, transferToReceptionist, updateBookingState).
- Yêu cầu đặt lịch → thông báo cần đăng nhập trước.
- Hỏi kiến thức tóc → vẫn được phép gọi searchKnowledge.`
: `- Khách đã đăng nhập. Được phép gọi tất cả tool.`}

[RULE 3] BOOKING FLOW — ĐÚNG THỨ TỰ, KHÔNG BỎ BƯỚC
Bước 1: Chi nhánh  → getBranches() → khách chọn → updateBookingState(idBranch, branchName) → getBarbers()
Bước 2: Thợ        → khách chọn từ danh sách → updateBookingState(idBarber, barberName) → hỏi ngày
Bước 3: Ngày       → khách cung cấp → updateBookingState(bookingDate:"YYYY-MM-DD") → getSlots()
Bước 4: Giờ        → khách chọn slot có trong kết quả getSlots → updateBookingState(slotTime:"HH:MM") → getServices()
Bước 5: Dịch vụ   → khách chọn từ danh sách getServices → updateBookingState(idServices:[], serviceNames:[]) → hiển thị tóm tắt
Bước 6: Xác nhận  → tóm tắt đầy đủ → khách đồng ý → createBooking(state)

[RULE 4] updateBookingState — BẮT BUỘC TUYỆT ĐỐI
Mỗi khi khách xác nhận thông tin, PHẢI:
  (a) Gọi updateBookingState NGAY LẬP TỨC — TRƯỚC MỌI TOOL KHÁC.
  (b) Chờ tool trả { success: true } rồi mới gọi tool tiếp theo.
  (c) KHÔNG được text reply khi vẫn còn tool cần gọi trong cùng lượt.

⚠️ LỖI NGUY HIỂM — HỆ THỐNG SẼ REJECT:
  ✗ getSlots gọi trước updateBookingState(bookingDate)
  ✗ getServices gọi trước updateBookingState(slotTime)
  ✗ createBooking gọi khi chưa updateBookingState(idServices)

✓ ĐÚNG khi khách nói "hôm nay":
  1. updateBookingState({ fields: { bookingDate: "${today}" } })
  2. getSlots({ idBranch: X, idBarber: Y, bookingDate: "${today}" })
  3. Trả lời text hiển thị danh sách slot

✓ ĐÚNG khi khách nói "12 giờ":
  1. updateBookingState({ fields: { slotTime: "12:00" } })
  2. getServices({ idBranch: 1 })
  3. Trả lời text hiển thị danh sách dịch vụ

✓ ĐÚNG khi khách nói "cắt tóc classic":
  1. updateBookingState({ fields: { idServices: [1], serviceNames: ["Cắt tóc classic"] } })
  2. Chờ { success: true }
  3. Trả lời text tóm tắt và xác nhận

[RULE 5] ENTITY SAFETY
- idBarber, idBranch, idService PHẢI lấy từ kết quả tool, KHÔNG được tự đặt.
- Tin nhắn vô nghĩa ("???", "wtf", "ngu vc") → lịch sự hỏi lại, không gọi tool.

[RULE 6] CHUYỂN LỄ TÂN
- Khách yêu cầu gặp người thật → gọi transferToReceptionist.
- Chỉ thông báo chuyển thành công khi tool trả { success: true }.

[RULE 7] KNOWLEDGE
- Câu hỏi về kiến thức tóc → gọi searchKnowledge với namespace đúng:
  hairstyles: kiểu tóc, tư vấn theo khuôn mặt
  colors    : màu nhuộm, tẩy tóc
  products  : sáp, pomade, gel, gôm, tinh dầu
  haircare  : rụng tóc, gàu, tóc khô xơ
- Bảng giá, thông tin salon → searchKnowledge namespace phù hợp.

━━━ 🎯 HÀNH ĐỘNG TIẾP THEO (BƯỚC ${missingStep}) ━━━
${dynamicRules}

━━━ PHONG CÁCH ━━━
- Xưng em, gọi khách là anh/chị. Lịch sự, thân thiện, ngắn gọn.
- Mỗi lượt chỉ hỏi đúng một thông tin cần thiết tiếp theo.
- KHÔNG hiển thị ID kỹ thuật (idBranch, idBarber, idService...) ra chat.
- KHÔNG dùng từ kỹ thuật: "bookingState", "state", "lưu vào bộ nhớ", "hệ thống đã lưu".
  ✗ SAI: "Em đã lưu Quận 1 vào bookingState"
  ✓ ĐÚNG: "Dạ em ghi nhận anh chọn chi nhánh Quận 1 rồi ạ"`;
}

// ─────────────────────────────────────────────────────────────
// processBrainLoop
// ─────────────────────────────────────────────────────────────
export async function processBrainLoop({
  message,
  bookingState,
  history = [],
  isLoggedIn,
  customerId,
}) {
  console.log(`\n===== 🧠 BRAIN LOOP =====`);
  console.log(`[Message]: "${message}"`);
  console.log(`[BookingState]:`, JSON.stringify(bookingState, null, 2));

  let currentState = { ...bookingState };
  let needLogin = false;
  let needReceptionist = false;

  const today    = getVietnamDate(0);
  const tomorrow = getVietnamDate(1);

  const BOOKING_TOOLS = [
    "getBranches", "getBarbers", "getSlots", "getServices",
    "createBooking", "resetBooking", "transferToReceptionist", "updateBookingState",
  ];

  // ── FIX 1: Pre-extract ngày/giờ từ message trước khi gọi LLM ────────────
  const missingStepBeforeLoop = getMissingStepHint(currentState);
  const extractedFields = isLoggedIn
    ? preExtractFields(message, missingStepBeforeLoop, today, tomorrow)
    : null;

  const messages = [
    {
      role: "system",
      content: buildSystemPrompt({ isLoggedIn, customerId, currentState }),
    },
    ...history.map((h) => ({
      role: h.role === "user" ? "user" : "assistant",
      content: h.content,
    })),
    { role: "user", content: message },
  ];

  // Nếu pre-extract thành công → chèn tool call giả vào messages
  // để LLM biết state đã được cập nhật và tiếp tục gọi tool tiếp theo
  if (extractedFields) {
    console.log(`⚡ [PreExtract] Detected ${missingStepBeforeLoop}:`, extractedFields);

    const fakeArgs = { fields: extractedFields };
    const fakeId   = `pre_${Date.now()}`;

    // Gọi thật updateBookingState
    const preResult = updateBookingState(coerceIds(fakeArgs));
    if (preResult.success) {
      currentState = updateStateFromTool("updateBookingState", preResult, currentState);
      console.log(`⚡ [PreExtract] State updated:`, currentState);

      // Inject vào message history để LLM thấy và tiếp tục flow
      messages.push({
        role: "assistant",
        content: null,
        tool_calls: [{
          id: fakeId,
          type: "function",
          function: {
            name: "updateBookingState",
            arguments: JSON.stringify(fakeArgs),
          },
        }],
      });
      messages.push({
        role: "tool",
        tool_call_id: fakeId,
        content: JSON.stringify(preResult),
      });
    }
  }
  // ────────────────────────────────────────────────────────────────────────

  const MAX_ITERATIONS = 12;
  let iterations = 0;

  while (iterations < MAX_ITERATIONS) {
    iterations++;

    let response;
    try {
      response = await groq.chat.completions.create({
        model: MODEL,
        messages,
        tools: toolDefinitions,
        tool_choice: "auto",
        temperature: 0.05,
        max_tokens: 1024, // FIX 3: tăng từ 512 → 1024
      });
    } catch (err) {
      console.error(`❌ [brainService] Groq API error (iter ${iterations}):`, err.message);

      if (err.status === 400 && err.message?.includes("tool_use_failed")) {
        // Thử parse failed_generation từ error body để tự fix args và execute
        try {
          // err.message có dạng: "400 { \"error\": { ..., \"failed_generation\": \"...\" } }"
          const bodyStr = err.message.replace(/^400\s*/, "");
          const body    = JSON.parse(bodyStr);
          const rawGen  = body?.error?.failed_generation;

          if (rawGen) {
            const failedCalls = JSON.parse(rawGen); // array of { name, parameters }
            console.warn(`🔧 [ErrorRecovery] Fixing ${failedCalls.length} failed tool call(s)...`);

            const fakeToolCalls = failedCalls.map((fc, i) => ({
              id: `fix_${Date.now()}_${i}`,
              type: "function",
              function: {
                name: fc.name,
                arguments: JSON.stringify(fc.parameters ?? fc.arguments ?? {}),
              },
            }));

            // Inject assistant message với tool_calls đã fix
            messages.push({
              role: "assistant",
              content: null,
              tool_calls: fakeToolCalls,
            });

            let pendingStateRecovery = { ...currentState };

            for (const tc of fakeToolCalls) {
              const toolName = tc.function.name;
              let toolArgs   = {};
              try { toolArgs = JSON.parse(tc.function.arguments || "{}"); } catch { toolArgs = {}; }

              // Auth gate
              if (!isLoggedIn && BOOKING_TOOLS.includes(toolName)) {
                needLogin = true;
                messages.push({ role: "tool", tool_call_id: tc.id, content: JSON.stringify({ success: false, error: "Chưa đăng nhập." }) });
                continue;
              }

              // Validate
              const validation = validateToolCall(toolName, pendingStateRecovery);
              if (!validation.valid) {
                messages.push({ role: "tool", tool_call_id: tc.id, content: JSON.stringify({ success: false, error: validation.error }) });
                continue;
              }

              // coerceIds sẽ tự normalize string "[1]" → array [1]
              const toolResult = await executeTool(toolName, toolArgs, { customerId });
              currentState        = updateStateFromTool(toolName, toolResult, currentState);
              pendingStateRecovery = updateStateFromTool(toolName, toolResult, pendingStateRecovery);

              if (toolName === "transferToReceptionist" && toolResult?.success) needReceptionist = true;
              console.log(`[State sau ${toolName} (recovery)]:`, JSON.stringify(currentState, null, 2));

              messages.push({ role: "tool", tool_call_id: tc.id, content: JSON.stringify(toolResult) });
            }

            continue; // tiếp tục vòng loop để LLM generate reply text
          }
        } catch (parseErr) {
          console.error(`❌ [ErrorRecovery] Không parse được failed_generation:`, parseErr.message);
        }

        // Fallback cuối: xoá assistant msg lỗi, yêu cầu LLM reply text
        const lastAssistant = messages.findLastIndex(m => m.role === "assistant");
        if (lastAssistant !== -1) messages.splice(lastAssistant, 1);
        messages.push({
          role: "user",
          content: "[SYSTEM] Hãy trả lời bằng text thuần túy, không gọi tool trong lượt này.",
        });
        continue;
      }
      throw err;
    }

    const choice       = response.choices[0];
    const assistantMsg = choice.message;
    messages.push(assistantMsg);

    // Không có tool call → trả về text
    if (!assistantMsg.tool_calls || assistantMsg.tool_calls.length === 0) {
      const reply = assistantMsg.content || "";
      console.log(`[BookingState sau loop]:`, JSON.stringify(currentState, null, 2));
      return { reply, newBookingState: currentState, needLogin, needReceptionist };
    }

    // ── FIX 2: pendingState tích lũy trong batch tool calls ─────────────
    let pendingState = { ...currentState };

    for (const toolCall of assistantMsg.tool_calls) {
      const toolName = toolCall.function.name;
      let toolArgs   = {};

      try {
        toolArgs = JSON.parse(toolCall.function.arguments || "{}");
      } catch {
        toolArgs = {};
      }

      // Auth Gate
      if (!isLoggedIn && BOOKING_TOOLS.includes(toolName)) {
        needLogin = true;
        messages.push({
          role: "tool",
          tool_call_id: toolCall.id,
          content: JSON.stringify({
            success: false,
            error: "Khách chưa đăng nhập. Yêu cầu khách đăng nhập trước khi đặt lịch.",
          }),
        });
        continue;
      }

      // Validation dùng pendingState (đã tích lũy kết quả tool trước trong cùng batch)
      const validation = validateToolCall(toolName, pendingState);
      if (!validation.valid) {
        console.warn(`⚠️ [Validation Failed] ${toolName}:`, validation.error);
        messages.push({
          role: "tool",
          tool_call_id: toolCall.id,
          content: JSON.stringify({ success: false, error: validation.error }),
        });
        continue;
      }

      const toolResult = await executeTool(toolName, toolArgs, { customerId });

      // Cập nhật cả currentState lẫn pendingState
      currentState = updateStateFromTool(toolName, toolResult, currentState);
      pendingState = updateStateFromTool(toolName, toolResult, pendingState);

      if (toolName === "transferToReceptionist" && toolResult?.success) {
        needReceptionist = true;
      }

      console.log(`[State sau ${toolName}]:`, JSON.stringify(currentState, null, 2));

      messages.push({
        role: "tool",
        tool_call_id: toolCall.id,
        content: JSON.stringify(toolResult),
      });
    }
    // ────────────────────────────────────────────────────────────────────
  }

  console.warn("⚠️ [brainService] Vượt quá MAX_ITERATIONS.");
  return {
    reply: "Dạ hệ thống đang bận, anh vui lòng thử lại sau ít phút nha ạ.",
    newBookingState: currentState,
    needLogin,
    needReceptionist,
  };
}

// ─────────────────────────────────────────────────────────────
// generateChatSummary
// ─────────────────────────────────────────────────────────────
export async function generateChatSummary(historyText) {
  try {
    const response = await groq.chat.completions.create({
      model: MODEL,
      temperature: 0.2,
      max_tokens: 512,
      messages: [
        {
          role: "system",
          content: `Bạn là trợ lý tóm tắt hội thoại nội bộ của Nam Barbershop.
Nhiệm vụ: đọc đoạn hội thoại giữa Khách và AI rồi viết một đoạn tóm tắt ngắn gọn bằng tiếng Việt dành cho lễ tân, gồm:
1. Khách hỏi / yêu cầu gì.
2. Thông tin đặt lịch đã xác nhận (nếu có): chi nhánh, thợ, ngày, giờ, dịch vụ.
3. Vấn đề còn dở hoặc lý do khách cần gặp lễ tân.
Viết súc tích, không dùng markdown, không quá 5 câu.`,
        },
        {
          role: "user",
          content: `Đây là lịch sử hội thoại hôm nay:\n\n${historyText}`,
        },
      ],
    });

    return (
      response.choices[0]?.message?.content?.trim() ||
      "Không thể tóm tắt hội thoại."
    );
  } catch (err) {
    console.error("❌ generateChatSummary lỗi:", err.message);
    return "Gặp lỗi trong quá trình tự động tóm tắt tin nhắn.";
  }
}