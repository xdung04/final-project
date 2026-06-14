// src/services/brainService.js
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
      description: "Lấy danh sách chi nhánh đang hoạt động của Nam Barbershop.",
      parameters: { type: "object", properties: {}, required: [] },
    },
  },
  {
    type: "function",
    function: {
      name: "getBarbers",
      description: "Lấy danh sách thợ cắt của một chi nhánh. Trả về stt, idBarber (số nguyên thật), name. KHÔNG được dùng stt làm idBarber.",
      parameters: {
        type: "object",
        properties: {
          idBranch: { type: "number", description: "ID chi nhánh." },
        },
        required: ["idBranch"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "getSlots",
      description: "Lấy khung giờ trống. idBranch và idBarber PHẢI là số nguyên thật từ tool, KHÔNG dùng số thứ tự. bookingDate định dạng YYYY-MM-DD.",
      parameters: {
        type: "object",
        properties: {
          idBranch:    { type: "number" },
          idBarber:    { type: "number" },
          bookingDate: { type: "string", description: "YYYY-MM-DD" },
        },
        required: ["idBranch", "idBarber", "bookingDate"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "getServices",
      description: "Lấy danh sách dịch vụ kèm giá và thời lượng tại một chi nhánh.",
      parameters: {
        type: "object",
        properties: {
          idBranch: { type: "number" },
        },
        required: ["idBranch"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "updateBookingState",
      description: `Lưu thông tin khách vừa xác nhận vào bookingState. 
PHẢI gọi tool này ngay sau mỗi bước khách xác nhận. Không được bỏ qua.

Ví dụ luồng bắt buộc:
1. Khách chọn chi nhánh "Quận 1"
   → gọi getBranches() để lấy idBranch
   → gọi updateBookingState({ fields: { idBranch: 1, branchName: "Chi nhánh Quận 1" } })
   → gọi getBarbers(idBranch: 1)

2. Khách chọn thợ "văn phong"
   → tra danh sách getBarbers → idBarber = 36
   → gọi updateBookingState({ fields: { idBarber: 36, barberName: "Nguyen Van Phong" } })
   → hỏi ngày

3. Khách chọn "hôm nay 12h"
   → gọi getSlots(idBranch, idBarber, bookingDate)
   → slot hợp lệ → gọi updateBookingState({ fields: { bookingDate: "2026-06-11", slotTime: "12:00" } })
   → gọi getServices()

4. Khách chọn dịch vụ "cắt tóc classic"
   → tra danh sách getServices → idService = 1
   → gọi updateBookingState({ fields: { idServices: [1], serviceNames: ["Cắt tóc Classic"] } })
   → hiển thị tóm tắt`,
      parameters: {
        type: "object",
        properties: {
          fields: {
            type: "object",
            description: "Các trường cần lưu vào bookingState.",
            properties: {
              idBranch:     { type: "number" },
              branchName:   { type: "string" },
              idBarber:     { type: "number" },
              barberName:   { type: "string" },
              bookingDate:  { type: "string", description: "YYYY-MM-DD" },
              slotTime:     { type: "string", description: "HH:MM" },
              idServices:   { type: "array", items: { type: "number" } },
              serviceNames: { type: "array", items: { type: "string" } },
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
      description: "Tạo lịch hẹn chính thức. Chỉ gọi khi khách xác nhận bằng từ khoá: xác nhận, đồng ý, ok, oke, chốt, đặt đi, đặt giúp anh.",
      parameters: {
        type: "object",
        properties: {
          state: {
            type: "object",
            description: "Toàn bộ bookingState gồm: idBranch, branchName, idBarber, barberName, bookingDate, slotTime, idServices, serviceNames.",
          },
        },
        required: ["state"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "resetBooking",
      description: "Xóa một hoặc toàn bộ thông tin bookingState khi khách muốn thay đổi.",
      parameters: {
        type: "object",
        properties: {
          fields: {
            type: "array",
            items: { type: "string" },
            description: "Danh sách trường cần xóa. [] = reset toàn bộ.",
          },
        },
        required: [],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "transferToReceptionist",
      description: "Chuyển khách sang lễ tân khi khách yêu cầu gặp người thật hoặc nhân viên hỗ trợ.",
      parameters: { type: "object", properties: {}, required: [] },
    },
  },
  {
    type: "function",
    function: {
      name: "searchKnowledge",
      description: `Tra cứu kiến thức chuyên môn từ cơ sở dữ liệu Nam Barbershop.
Bắt buộc dùng cho mọi câu hỏi về: kiểu tóc, màu nhuộm, sản phẩm, chăm sóc tóc, bảng giá, thông tin salon.
Namespace:
- hairstyles: kiểu tóc, tư vấn kiểu tóc theo khuôn mặt
- colors: màu nhuộm, tẩy tóc, độ tôn da
- products: sáp, pomade, gel, gôm, tinh dầu
- haircare: rụng tóc, gàu, tóc khô xơ, phục hồi`,
      parameters: {
        type: "object",
        properties: {
          query:     { type: "string" },
          namespace: { type: "string", enum: ["hairstyles", "colors", "products", "haircare"] },
        },
        required: ["query", "namespace"],
      },
    },
  },
];

// ─────────────────────────────────────────────────────────────
// coerceIds
// ─────────────────────────────────────────────────────────────
function coerceIds(args) {
  const result = { ...args };
  ["idBranch", "idBarber", "idService"].forEach((key) => {
    if (result[key] !== undefined) {
      const n = Number(result[key]);
      result[key] = isNaN(n) ? result[key] : n;
    }
  });
  if (Array.isArray(result.idServices)) {
    result.idServices = result.idServices.map(Number).filter((n) => !isNaN(n));
  }
  if (result.fields && typeof result.fields === "object") {
    ["idBranch", "idBarber"].forEach((key) => {
      if (result.fields[key] !== undefined) {
        const n = Number(result.fields[key]);
        result.fields[key] = isNaN(n) ? result.fields[key] : n;
      }
    });
    if (Array.isArray(result.fields.idServices)) {
      result.fields.idServices = result.fields.idServices.map(Number).filter((n) => !isNaN(n));
    }
  }
  return result;
}

// ─────────────────────────────────────────────────────────────
// executeTool
// ─────────────────────────────────────────────────────────────
async function executeTool(toolName, toolArgs, context) {
  const args = coerceIds(toolArgs);
  console.log(`🔧 [brainService] Executing tool: ${toolName}`, JSON.stringify(args));

  switch (toolName) {
    case "getBranches":            return await getBranches();
    case "getBarbers":             return await getBarbers(args);
    case "getSlots":               return await getSlots(args);
    case "getServices":            return await getServices(args);
    case "updateBookingState":     return updateBookingState(args);
    case "resetBooking":           return resetBooking({ fields: args.fields || [] });
    case "transferToReceptionist": return await transferToReceptionist({ customerId: context.customerId });
    case "searchKnowledge":        return await searchKnowledge(args);
    case "createBooking": {
      let stateArg = args.state;
      if (typeof stateArg === "string") {
        try { stateArg = JSON.parse(stateArg); } catch { stateArg = {}; }
      }
      return await createBooking({ state: stateArg, customerId: context.customerId });
    }
    default:
      return { success: false, error: `Tool không tồn tại: ${toolName}` };
  }
}

// ─────────────────────────────────────────────────────────────
// updateStateFromTool
// ─────────────────────────────────────────────────────────────
function updateStateFromTool(toolName, toolArgs, toolResult, currentState) {
  if (toolResult?.success === false) return currentState;
  const next = { ...currentState };

  switch (toolName) {
    case "updateBookingState": {
      if (toolResult.success && toolResult.updatedFields) {
        return { ...next, ...toolResult.updatedFields };
      }
      break;
    }
    case "resetBooking": {
      if (toolResult.clearedState) return { ...toolResult.clearedState, bookingCompleted: false };
      if (toolResult.clearedFields) return { ...next, ...toolResult.clearedFields };
      break;
    }
    case "createBooking": {
      if (toolResult.success) {
        next.bookingCompleted = true;
        next.idBooking = toolResult.idBooking;
      }
      break;
    }
    default:
      break;
  }
  return next;
}

// ─────────────────────────────────────────────────────────────
// buildSystemPrompt
// ─────────────────────────────────────────────────────────────
function buildSystemPrompt({ isLoggedIn, customerId, currentState }) {
  const timeContext = new Date().toLocaleString("vi-VN", {
    timeZone: "Asia/Ho_Chi_Minh",
    dateStyle: "full",
    timeStyle: "short",
  });

  return `Bạn là Trợ lý AI chính thức của Nam Barbershop chuyên dành cho nam.

VAI TRÒ
Chỉ được thực hiện 2 nhóm nhiệm vụ:
1. Hỗ trợ đặt lịch tại Nam Barbershop.
2. Tư vấn kiến thức về tóc, kiểu tóc, màu tóc, chăm sóc tóc và dịch vụ của Nam Barbershop.
Mọi nội dung ngoài phạm vi trên phải từ chối lịch sự.

THÔNG TIN NGỮ CẢNH
isLoggedIn: ${isLoggedIn}
customerId: ${customerId ?? "null"}
bookingState hiện tại:
${JSON.stringify(currentState, null, 2)}
Thời gian hiện tại: ${timeContext}

NGUYÊN TẮC QUAN TRỌNG NHẤT — TOOL RESULT IS SOURCE OF TRUTH
- Mọi dữ liệu hiển thị cho khách phải lấy từ tool.
- Tuyệt đối không tự bịa: chi nhánh, thợ, dịch vụ, giá, khung giờ, trạng thái booking.
- Chưa có dữ liệu từ tool → phải gọi tool trước.
- Không dùng trí nhớ hội thoại thay thế dữ liệu tool.

AUTH GATE
isLoggedIn = false:
- Đặt lịch / book / hẹn / đổi / hủy lịch → KHÔNG gọi booking tool. Yêu cầu đăng nhập.
- Gặp lễ tân / gặp người thật / nhân viên → KHÔNG gọi transferToReceptionist. Yêu cầu đăng nhập.
- Hỏi kiến thức tóc → cho phép, gọi searchKnowledge bình thường.

BOOKING FLOW — TUÂN THỦ TUYỆT ĐỐI
Chọn chi nhánh → Chọn thợ → Chọn ngày → Chọn khung giờ → Chọn dịch vụ → Tóm tắt → Xác nhận → Tạo booking.
Không được bỏ bước. Không được nhảy bước.

QUY TẮC UPDATEBOOKINGSTATE — BẮT BUỘC
Sau mỗi bước khách xác nhận thông tin, PHẢI gọi updateBookingState NGAY LẬP TỨC trước khi làm bất cứ điều gì tiếp theo.
Không gọi updateBookingState = không được chuyển bước tiếp theo.

Luồng chuẩn:
Bước 1 — Chi nhánh:
  → getBranches() → khách chọn
  → updateBookingState({ fields: { idBranch: <số>, branchName: "<tên>" } })
  → getBarbers(idBranch)

Bước 2 — Thợ:
  → getBarbers() trả về danh sách có idBarber thật
  → khách chọn → tra idBarber thật từ danh sách (KHÔNG dùng số thứ tự)
  → updateBookingState({ fields: { idBarber: <số thật>, barberName: "<tên>" } })
  → hỏi ngày

Bước 3 — Ngày:
  → khách cung cấp ngày
  → updateBookingState({ fields: { bookingDate: "YYYY-MM-DD" } })
  → getSlots(idBranch, idBarber, bookingDate)

Bước 4 — Giờ:
  → getSlots() trả về danh sách slot trống
  → khách chọn slot có trong danh sách
  → updateBookingState({ fields: { slotTime: "HH:MM" } })
  → getServices(idBranch)

Bước 5 — Dịch vụ:
  → getServices() trả về danh sách
  → khách chọn → tra idService thật từ danh sách
  → updateBookingState({ fields: { idServices: [<số>], serviceNames: ["<tên>"] } })
  → hiển thị tóm tắt

Bước 6 — Xác nhận & Tạo booking:
  → hiển thị tóm tắt đầy đủ
  → chờ khách xác nhận (xác nhận / đồng ý / ok / oke / chốt / đặt đi / đặt giúp anh)
  → gọi createBooking({ state: <toàn bộ bookingState> })
  → chỉ thông báo thành công khi tool trả { success: true }

EARLIEST MISSING STEP RULE
Luôn xử lý bước còn thiếu đầu tiên trong bookingState.
Khách cung cấp nhiều thông tin cùng lúc → lưu tạm, xử lý theo đúng thứ tự flow.

STATE SAFETY
- Không tự cập nhật bookingState. Mọi thay đổi phải qua tool.
- Không tự nói "em đã xóa / đã lưu" khi tool chưa trả success.

ENTITY SAFETY
- Không fuzzy match từ câu vô nghĩa ("ngu vc", "???", "wtf"...) ra tên thợ/chi nhánh.
- Tin nhắn vô nghĩa → phản hồi lịch sự, không gọi tool, không update state.

RECEPTIONIST
- Khách yêu cầu gặp người thật → gọi transferToReceptionist.
- Chỉ thông báo đã chuyển khi tool trả { success: true }.

KNOWLEDGE MAPPING
Mọi câu hỏi kiến thức → gọi searchKnowledge với namespace đúng:
- hairstyles: kiểu tóc, tư vấn theo khuôn mặt
- colors: màu nhuộm, tẩy tóc
- products: sáp, pomade, gel, gôm, tinh dầu
- haircare: rụng tóc, gàu, tóc khô xơ
Bảng giá và thông tin salon cũng phải qua searchKnowledge.

PHONG CÁCH TRẢ LỜI
- TUYỆT ĐỐI không hiển thị ID kỹ thuật (idBranch, idBarber, idService, idBooking).
- Xưng em. Gọi khách là anh/chị. Lịch sự. Thân thiện. Ngắn gọn.
- Mỗi lượt chỉ hỏi đúng một thông tin cần thiết tiếp theo.`;
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
  let needReceptionist = false; // ← THÊM: flag báo frontend hiện banner kết nối lễ tân

  const BOOKING_TOOLS = [
    "getBranches", "getBarbers", "getSlots", "getServices",
    "createBooking", "resetBooking", "transferToReceptionist", "updateBookingState",
  ];

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

  const MAX_ITERATIONS = 10;
  let iterations = 0;

  while (iterations < MAX_ITERATIONS) {
    iterations++;

    const response = await groq.chat.completions.create({
      model: MODEL,
      messages,
      tools: toolDefinitions,
      tool_choice: "auto",
      temperature: 0.2,
      max_tokens: 1024,
    });

    const choice = response.choices[0];
    const assistantMsg = choice.message;

    messages.push(assistantMsg);

    // Không có tool call → trả về text
    if (!assistantMsg.tool_calls || assistantMsg.tool_calls.length === 0) {
      const reply = assistantMsg.content || "";
      console.log(`[BookingState sau loop]:`, JSON.stringify(currentState, null, 2));
      // ← THÊM: trả về needReceptionist cùng với các flag khác
      return { reply, newBookingState: currentState, needLogin, needReceptionist };
    }

    // Có tool call → thực thi
    for (const toolCall of assistantMsg.tool_calls) {
      const toolName = toolCall.function.name;
      let toolArgs = {};

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
            error: "Khách chưa đăng nhập. Không thể thực hiện thao tác này.",
          }),
        });
        continue;
      }

      const toolResult = await executeTool(toolName, toolArgs, { customerId });
      currentState = updateStateFromTool(toolName, toolArgs, toolResult, currentState);

      // ← THÊM: bật flag nếu transferToReceptionist thành công
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
  }

  console.warn("⚠️ [brainService] Vượt quá MAX_ITERATIONS.");
  return {
    reply: "Dạ hệ thống đang bận, anh vui lòng thử lại sau ít phút nha ạ.",
    newBookingState: currentState,
    needLogin,
    needReceptionist, // ← THÊM
  };
}
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
 
    return response.choices[0]?.message?.content?.trim()
      || "Không thể tóm tắt hội thoại.";
  } catch (err) {
    console.error("❌ generateChatSummary lỗi:", err.message);
    return "Gặp lỗi trong quá trình tự động tóm tắt tin nhắn.";
  }
}
 