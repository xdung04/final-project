import Groq from "groq-sdk";
import {
  getBranches, getBarbers, getSlots, getServices,
  createBooking, transferToReceptionist, updateBookingState,
  matchBranch, matchBarber, matchServices,
  parseDateFromText, parseTimeFromText,
} from "./bookingTools.js";
import { searchKnowledge } from "./knowledgeTools.js";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// ─────────────────────────────────────────────────────────────
// 2 MODEL RIÊNG BIỆT:
//   - MODEL_CLASSIFY: model nhỏ/rẻ/nhanh, CHỈ dùng để phân loại ý định
//     (output vài chục token JSON, không cần "thông minh" nhiều — chỉ
//     chọn đúng 1 trong vài nhãn cố định theo scope).
//   - MODEL_MAIN: model lớn hơn, dùng khi cần hiểu ngữ cảnh + viết câu
//     trả lời tự do (tư vấn kiến thức, tóm tắt hội thoại).
// ─────────────────────────────────────────────────────────────
const MODEL_MAIN = process.env.GROQ_MODEL_MAIN || process.env.GROQ_MODEL || "llama-3.3-70b-versatile";
const MODEL_CLASSIFY = process.env.GROQ_MODEL_CLASSIFY || "llama-3.1-8b-instant";

// ─────────────────────────────────────────────────────────────
// KIẾN TRÚC (giữ nguyên triết lý tiết kiệm token của bản trước, chỉ
// nâng cấp phần PHÂN LOẠI Ý ĐỊNH):
//
// Booking flow vẫn là state machine cố định do CODE điều khiển. Việc
// match câu trả lời của khách vào 1 bước cụ thể (chọn chi nhánh/thợ/
// ngày/giờ/dịch vụ) vẫn dùng regex + fuzzy-match cục bộ (matchBranch,
// matchBarber, matchServices, parseDateFromText, parseTimeFromText) —
// đây là bài toán so khớp vào MỘT DANH SÁCH ĐÓNG lấy từ DB, quá phù hợp
// để xử lý bằng code, không cần LLM và regex/fuzzy đang làm tốt.
//
// Cái THỰC SỰ yếu ở bản trước là các quyết định "ngôn ngữ tự do, không
// giới hạn" như: khách đồng ý/từ chối nói kiểu gì cũng được, khách muốn
// đổi ý giữa chừng nói kiểu gì cũng được, khách chào xen giữa lúc đang
// hỏi cái khác... Regex liệt kê cứng không bao giờ đủ cho tiếng Việt tự
// nhiên. Đây chính là chỗ nên dùng 1 MODEL NHỎ để phân loại thay vì cố
// vá thêm regex.
//
// => classifyIntent() thay thế detectIntent/CONFIRM_YES/CONFIRM_NO/
//    PURE_GREETING/CHANGE_VERB+FIELD_NOUNS của bản cũ. Được gọi CÓ CHỌN
//    LỌC (không phải mọi tin nhắn):
//    1. Tin nhắn ĐẦU vào flow (chưa xác định ý định) — cần phân biệt
//       đặt lịch / hỏi kiến thức / gặp lễ tân.
//    2. Đang ở bước XÁC NHẬN cuối — cần hiểu đồng ý/từ chối đa dạng.
//    3. Đang chờ 1 bước cụ thể nhưng local resolve (fuzzy match DB)
//       THẤT BẠI — cần phân biệt "khách muốn đổi ý"/"chỉ chào xã giao"/
///      "trả lời không hợp lệ" thay vì suy luận mù bằng regex.
//
// Mỗi lần gọi classifyIntent CHỈ đưa ra tập nhãn phù hợp với scope hiện
// tại (không đưa hết mọi nhãn mọi lúc) — prompt ngắn hơn, model ít
// nhầm lẫn hơn, JSON output chỉ vài token.
// ─────────────────────────────────────────────────────────────

// Regex fast-path DUY NHẤT còn giữ lại: từ khoá gặp lễ tân rất tường
// minh, gần như không có false positive, nên xử lý ngay không cần tốn
// 1 lượt gọi model. Nếu khách diễn đạt khác đi (không match regex này),
// classifyIntent ở các scope khác vẫn có nhãn "receptionist" để bắt lại.
const RECEPTIONIST_KEYWORDS = /(gặp lễ tân|gặp người thật|nhân viên tư vấn|nói chuyện với người|gặp nhân viên)/i;

// Vẫn dùng làm shortcut RẺ bên trong handleGeneral (không phải để
// routing tầng trên) — tránh tốn thêm 1 lượt gọi model cho câu chào
// thuần tuý khi đã xác định intent = "other".
const PURE_GREETING = /^(xin chào|chào( bạn| shop| ạ)?|hi|hello|alo)[\s!.]*$/i;

const STEP_LABEL_VI = {
  CHI_NHANH: "chọn chi nhánh",
  THO: "chọn thợ",
  NGAY: "chọn ngày",
  GIO: "chọn giờ",
  DICH_VU: "chọn dịch vụ",
  XAC_NHAN: "xác nhận thông tin đặt lịch",
};

// ✅ Đổi field: dictionary field -> field cần reset kèm theo (cascade),
// giữ nguyên từ bản trước — chỉ khác là "field muốn đổi" giờ do
// classifyIntent() trả về (change_field) thay vì suy ra từ regex.
const FIELD_LABEL_VI = {
  idBranch: "chi nhánh", idBarber: "thợ", bookingDate: "ngày", slotTime: "giờ", idServices: "dịch vụ",
};

const FIELD_RESET_MAP = {
  idBranch:    { idBranch: null, branchName: null, idBarber: null, barberName: null, bookingDate: null, slotTime: null, idServices: [], serviceNames: [] },
  idBarber:    { idBarber: null, barberName: null, bookingDate: null, slotTime: null, idServices: [], serviceNames: [] },
  bookingDate: { bookingDate: null, slotTime: null, idServices: [], serviceNames: [] },
  slotTime:    { slotTime: null, idServices: [], serviceNames: [] },
  idServices:  { idServices: [], serviceNames: [] },
};

const CACHE_CLEAR_ON_RESET = {
  idBranch: ["_barbers", "_slots", "_services"],
  idBarber: ["_slots", "_services"],
  bookingDate: ["_slots", "_services"],
  slotTime: ["_services"],
  idServices: [],
};

function clearFieldAndCascade(field, state) {
  const next = { ...state, ...FIELD_RESET_MAP[field], _pendingStep: null };
  CACHE_CLEAR_ON_RESET[field].forEach((k) => delete next[k]);
  return next;
}

// ── Helpers ngày giờ ──────────────────────────────────────────
function getVietnamDate(offset = 0) {
  return new Date(Date.now() + offset * 86400000).toLocaleDateString("sv-SE", { timeZone: "Asia/Ho_Chi_Minh" });
}

function getMissingStepHint(state) {
  if (!state.idBranch) return "CHI_NHANH";
  if (!state.idBarber) return "THO";
  if (!state.bookingDate) return "NGAY";
  if (!state.slotTime) return "GIO";
  if (!state.idServices?.length) return "DICH_VU";
  return "XAC_NHAN";
}

function freshState() {
  return {
    idBranch: null, branchName: null,
    idBarber: null, barberName: null,
    bookingDate: null, slotTime: null,
    idServices: [], serviceNames: [],
    bookingCompleted: false, bookingFlowStarted: false,
    _pendingStep: null,
  };
}

const CACHE_CASCADE = {
  idBranch: ["_barbers", "_slots", "_services"],
  idBarber: ["_slots", "_services"],
  bookingDate: ["_slots", "_services"],
  slotTime: ["_services"],
};

function applyCascadeCacheClear(field, state) {
  const toClear = CACHE_CASCADE[field];
  if (toClear) toClear.forEach((k) => delete state[k]);
}

// ── Fetch + cache list cho từng bước (không tốn token — chỉ query DB) ──
async function ensureListForStep(step, state) {
  switch (step) {
    case "CHI_NHANH": {
      if (!state._branches) state._branches = await getBranches();
      return state._branches;
    }
    case "THO": {
      if (!state._barbers) state._barbers = await getBarbers({ idBranch: state.idBranch });
      return state._barbers;
    }
    case "GIO": {
      const result = await getSlots({ idBranch: state.idBranch, idBarber: state.idBarber, bookingDate: state.bookingDate });
      state._slots = result.availableSlots || [];
      return state._slots;
    }
    case "DICH_VU": {
      if (!state._services) state._services = await getServices({ idBranch: state.idBranch });
      return state._services;
    }
    default:
      return null;
  }
}

// ── Render text hiển thị (template, không cần LLM viết) ──────────
function money(n) {
  return Number(n || 0).toLocaleString("vi-VN") + "đ";
}

function renderList(step, list) {
  switch (step) {
    case "CHI_NHANH":
      return (
        "Dạ Nam Barbershop hiện có các chi nhánh:\n" +
        list.map((b, i) => `${i + 1}. ${b.name} - ${b.address}`).join("\n") +
        "\n\nAnh/chị muốn đặt lịch ở chi nhánh nào ạ?"
      );
    case "THO":
      if (!list.length) return "Dạ chi nhánh này hiện chưa có thợ nhận lịch, anh/chị vui lòng chọn chi nhánh khác giúp em ạ.";
      return (
        "Dạ chi nhánh này có các thợ:\n" +
        list.map((b, i) => `${i + 1}. ${b.name}`).join("\n") +
        "\n\nAnh/chị muốn chọn thợ nào ạ?"
      );
    case "GIO":
      if (!list.length) return "Dạ ngày này thợ đã kín lịch rồi, anh/chị chọn ngày khác giúp em nhé.";
      return `Dạ các khung giờ còn trống: ${list.join(", ")}.\n\nAnh/chị muốn đặt giờ nào ạ?`;
    case "DICH_VU":
      return (
        "Dạ các dịch vụ hiện có:\n" +
        list.map((s, i) => `${i + 1}. ${s.name} - ${money(s.price)}`).join("\n") +
        "\n\nAnh/chị muốn chọn dịch vụ nào ạ? (có thể chọn nhiều, cách nhau bằng dấu phẩy)"
      );
    default:
      return "";
  }
}

function renderSummary(state) {
  return `Dạ em xin xác nhận lại thông tin đặt lịch:
- Chi nhánh: ${state.branchName}
- Thợ: ${state.barberName}
- Ngày: ${state.bookingDate}
- Giờ: ${state.slotTime}
- Dịch vụ: ${state.serviceNames?.join(", ")}

Anh/chị xác nhận đặt lịch chứ ạ?`;
}

function stripInternal(state) {
  const { _branches, _barbers, _slots, _services, ...rest } = state;
  return rest;
}

// ── Local resolver cho từng bước (fuzzy-match DB — không tốn token) ──
async function tryResolveStep(step, message, state) {
  switch (step) {
    case "CHI_NHANH": {
      const list = await ensureListForStep(step, state);
      const b = matchBranch(message, list);
      return b ? { field: "idBranch", value: b.idBranch, label: "branchName", labelValue: b.name } : null;
    }
    case "THO": {
      const list = await ensureListForStep(step, state);
      const b = matchBarber(message, list);
      return b ? { field: "idBarber", value: b.idBarber, label: "barberName", labelValue: b.name } : null;
    }
    case "NGAY": {
      const d = parseDateFromText(message, getVietnamDate(0), getVietnamDate(1));
      return d ? { field: "bookingDate", value: d } : null;
    }
    case "GIO": {
      const t = parseTimeFromText(message);
      if (!t) return null;
      const available = await ensureListForStep(step, state);
      if (!available.includes(t)) return { invalidTime: true, available };
      return { field: "slotTime", value: t };
    }
    case "DICH_VU": {
      const list = await ensureListForStep(step, state);
      const matched = matchServices(message, list);
      if (!matched.length) return null;
      return {
        field: "idServices",
        value: matched.map((s) => s.idService),
        label: "serviceNames",
        labelValue: matched.map((s) => s.name),
      };
    }
    default:
      return null;
  }
}

async function saveResolvedField(resolved, state) {
  const fields = { [resolved.field]: resolved.value };
  if (resolved.label) fields[resolved.label] = resolved.labelValue;

  const result = await updateBookingState({ fields }, state);
  if (!result.success) return { ok: false, error: result.error };

  const next = { ...state, ...result.updatedFields };
  applyCascadeCacheClear(resolved.field, next);
  next._pendingStep = null;
  return { ok: true, state: next };
}

async function presentStep(step, state) {
  if (step === "NGAY") {
    state._pendingStep = "NGAY";
    return { reply: "Dạ anh/chị muốn đặt lịch vào ngày nào ạ? (vd: hôm nay, ngày mai, 20/7...)", state };
  }
  if (step === "XAC_NHAN") {
    state._pendingStep = "XAC_NHAN";
    return { reply: renderSummary(state), state };
  }

  const list = await ensureListForStep(step, state);

  if (step === "GIO" && (!list || list.length === 0)) {
    const reset = clearFieldAndCascade("bookingDate", state);
    reset._pendingStep = "NGAY";
    return {
      reply: "Dạ ngày này thợ đã kín lịch rồi, anh/chị chọn ngày khác giúp em nhé ạ. (vd: ngày mai, 20/7...)",
      state: reset,
    };
  }

  state._pendingStep = step;
  return { reply: renderList(step, list), state };
}

function resolveByIndex(step, index, state) {
  const idx = index - 1;
  switch (step) {
    case "CHI_NHANH": {
      const b = state._branches?.[idx];
      return b ? { field: "idBranch", value: b.idBranch, label: "branchName", labelValue: b.name } : null;
    }
    case "THO": {
      const b = state._barbers?.[idx];
      return b ? { field: "idBarber", value: b.idBarber, label: "barberName", labelValue: b.name } : null;
    }
    case "GIO": {
      const t = state._slots?.[idx];
      return t ? { field: "slotTime", value: t } : null;
    }
    case "DICH_VU": {
      const s = state._services?.[idx];
      return s ? { field: "idServices", value: [s.idService], label: "serviceNames", labelValue: [s.name] } : null;
    }
    default:
      return null;
  }
}

// ─────────────────────────────────────────────────────────────
// classifyIntent — 1 lệnh gọi model NHỎ (MODEL_CLASSIFY), output JSON
// vài token, nhãn giới hạn theo scope để giảm nhầm lẫn.
//
// scope:
//   "entry"   → chưa có flow đặt lịch nào đang chạy. Cần phân biệt
//               receptionist / booking_start / other.
//   "confirm" → đang ở bước XÁC NHẬN cuối. Cần hiểu đồng ý/từ chối/
//               đổi ý/chào giữa chừng/gặp lễ tân.
//   "midflow" → đang chờ khách trả lời 1 bước cụ thể NHƯNG local
//               resolve (fuzzy-match DB) đã thất bại. Cần phân biệt
//               đổi ý / chào giữa chừng / gặp lễ tân / hay chỉ là câu
//               trả lời không hợp lệ (booking_answer → cho retry).
// ─────────────────────────────────────────────────────────────
const SCOPE_LABELS = {
  entry: {
    labels: `- "receptionist": khách muốn gặp lễ tân / nhân viên thật
- "booking_start": khách muốn đặt lịch cắt tóc
- "other": hỏi kiến thức (tóc, giá, dịch vụ...), chào hỏi, hoặc không liên quan đặt lịch`,
    fallback: (flowInProgress) => ({ intent: "other", change_field: null }),
  },
  confirm: {
    labels: `- "receptionist": khách muốn gặp lễ tân / nhân viên thật
- "confirm_yes": khách đồng ý / xác nhận đặt lịch như tóm tắt
- "confirm_no": khách không đồng ý với tóm tắt, muốn sửa lại
- "change": khách muốn đổi 1 thông tin ĐÃ chọn (chi nhánh/thợ/ngày/giờ/dịch vụ) thay vì trả lời có/không
- "greeting_midflow": khách chỉ chào hỏi/nói chuyện xã giao, không phải trả lời xác nhận
- "other": câu hỏi khác không liên quan tới việc xác nhận`,
    fallback: () => ({ intent: "other", change_field: null }),
  },
  midflow: {
    labels: `- "receptionist": khách muốn gặp lễ tân / nhân viên thật
- "change": khách muốn quay lại đổi 1 thông tin ĐÃ chọn trước đó (không phải bước đang chờ)
- "greeting_midflow": khách chỉ chào hỏi/nói chuyện xã giao, không phải câu trả lời cho bước đang chờ
- "booking_answer": khách CÓ ý định trả lời cho bước đang chờ nhưng nội dung không khớp lựa chọn nào / không rõ ràng
- "other": câu hỏi kiến thức không liên quan tới bước đang chờ`,
    fallback: () => ({ intent: "booking_answer", change_field: null }),
  },
};

async function classifyIntent(message, state, scope, currentStep) {
  const msg = (message || "").trim();
  if (!msg) return { intent: scope === "midflow" ? "booking_answer" : "other", change_field: null };

  const { labels, fallback } = SCOPE_LABELS[scope];
  const stepLabel = currentStep ? (STEP_LABEL_VI[currentStep] || currentStep) : "chưa bắt đầu";

  const sys = `Bạn là bộ phân loại ý định tin nhắn cho chatbot đặt lịch cắt tóc (Nam Barbershop).

Ngữ cảnh hiện tại:
- Bước đang chờ khách trả lời: ${stepLabel}
- Đã chọn trước đó: chi nhánh=${state.branchName || "chưa"}, thợ=${state.barberName || "chưa"}, ngày=${state.bookingDate || "chưa"}, giờ=${state.slotTime || "chưa"}, dịch vụ=${(state.serviceNames || []).join(", ") || "chưa"}

Phân loại tin nhắn khách vào ĐÚNG MỘT nhãn "intent" trong các nhãn sau (không tự bịa nhãn khác):
${labels}

Nếu intent là "change", xác định thêm "change_field" là một trong: idBranch, idBarber, bookingDate, slotTime, idServices — dựa vào thứ khách nhắc tới (chi nhánh/thợ/ngày/giờ/dịch vụ). Nếu khách chưa nói rõ đổi cái gì, để null.
Nếu intent khác "change", change_field luôn là null.

CHỈ trả lời JSON thuần, không thêm chữ nào khác, không markdown, đúng format:
{"intent":"...","change_field":null}`;

  try {
    const resp = await groq.chat.completions.create({
      model: MODEL_CLASSIFY,
      temperature: 0,
      max_tokens: 40,
      messages: [
        { role: "system", content: sys },
        { role: "user", content: msg },
      ],
    });
    const raw = resp.choices[0]?.message?.content?.trim() || "{}";
    const parsed = JSON.parse(raw.replace(/```json|```/g, "").trim());
    if (!parsed.intent) throw new Error("missing intent field");
    return { intent: parsed.intent, change_field: parsed.change_field || null };
  } catch (err) {
    console.warn(`⚠️ [classifyIntent:${scope}] lỗi hoặc rate limit, dùng fallback an toàn:`, err.message);
    if (RECEPTIONIST_KEYWORDS.test(msg)) return { intent: "receptionist", change_field: null };
    return fallback(msg);
  }
}

// ── Fallback: chỉ khi local parse thất bại VÀ classify xác nhận đây
// đúng là 1 câu trả lời cho bước hiện tại (booking_answer) — gọi model
// nhỏ lần 2, RẤT NHỎ, chỉ để map về đúng 1 mục trong danh sách theo số
// thứ tự (không phải phân loại ý định nữa, mà là "chọn mục nào") ──
async function resolveIndexWithLLM(step, message, state) {
  const listMap = {
    CHI_NHANH: state._branches?.map((b, i) => `${i + 1}. ${b.name}`).join("\n"),
    THO: state._barbers?.map((b, i) => `${i + 1}. ${b.name}`).join("\n"),
    GIO: state._slots?.join(", "),
    DICH_VU: state._services?.map((s, i) => `${i + 1}. ${s.name}`).join("\n"),
    NGAY: "(khách cần nhập một ngày cụ thể, vd: hôm nay / ngày mai / 20/7)",
  };

  const sys = `Khách đang ở bước "${step}" trong quy trình đặt lịch cắt tóc. Danh sách lựa chọn:
${listMap[step] || "(không có danh sách, khách cần nhập tự do)"}

Xác định khách chọn mục số mấy (theo số thứ tự 1-based) trong danh sách trên. Nếu không xác định được, trả về index null.

CHỈ trả lời JSON thuần: {"index": <số hoặc null>}`;

  try {
    const resp = await groq.chat.completions.create({
      model: MODEL_CLASSIFY,
      temperature: 0,
      max_tokens: 20,
      messages: [
        { role: "system", content: sys },
        { role: "user", content: message },
      ],
    });
    const raw = resp.choices[0]?.message?.content?.trim() || "{}";
    const parsed = JSON.parse(raw.replace(/```json|```/g, "").trim());
    return Number.isInteger(parsed.index) ? parsed.index : null;
  } catch (err) {
    console.warn("⚠️ [resolveIndexWithLLM] lỗi hoặc rate limit:", err.message);
    return null;
  }
}

// ── Nhánh câu hỏi kiến thức / chào hỏi ngoài booking flow ─────────
// Dùng vòng lặp tool-calling thực sự (không giả định chỉ gọi tool đúng 1
// lần) — model có thể cần tra cứu nhiều lượt (vd hỏi kiểu tóc rồi hỏi tiếp
// độ tuổi phù hợp). Luôn truyền `tools` ở MỌI lượt gọi, kể cả các lượt sau
// khi đã có tool_result — nếu bỏ `tools` ở lượt sau mà model vẫn cố gọi
// tool tiếp, Groq sẽ trả lỗi 400 "Tool choice is none, but model called a
// tool" (đúng lỗi đã gặp). Giới hạn số vòng để tránh loop vô hạn nếu model
// cứ liên tục đòi gọi tool.
const MAX_TOOL_ROUNDS = 3;

async function handleGeneral(message, history, isLoggedIn) {
  if (PURE_GREETING.test(message.trim())) {
    return {
      reply: "Dạ em chào anh/chị! Nam Barbershop có thể giúp anh/chị đặt lịch cắt tóc hoặc tư vấn về tóc/dịch vụ. Anh/chị cần hỗ trợ gì ạ?",
    };
  }

  const sys = `Bạn là trợ lý Nam Barbershop. Dùng tool searchKnowledge để tra cứu thông tin, không tự bịa.
searchKnowledge có 4 loại namespace:
- "hairstyles"/"colors"/"products"/"haircare": kiến thức chung về kiểu tóc, màu tóc, sản phẩm, chăm sóc tóc.
- "barbers": thông tin từng thợ (chuyên môn, phong cách, kinh nghiệm, đánh giá, chứng chỉ). Dùng namespace này khi khách hỏi về tay nghề/chuyên môn/phong cách của thợ, hoặc hỏi "ai cắt đẹp kiểu X". Nếu khách có nhắc tên chi nhánh cụ thể, LUÔN truyền kèm branchName đúng như tên chi nhánh (vd "Chi nhánh Quận 1") để lọc đúng chi nhánh — không lọc sẽ trả về cả thợ chi nhánh khác.
- "branches": thông tin chi nhánh (địa chỉ, giờ mở cửa). Dùng khi khách hỏi địa chỉ/giờ hoạt động của chi nhánh.
- "services": thông tin các dịch vụ, giá, thời lượng...
Xưng em, gọi khách là anh/chị, trả lời ngắn gọn, không dùng markdown thô, không nhúng JSON.`;

  const tools = [
    {
      type: "function",
      function: {
        name: "searchKnowledge",
        description: "Tra cứu kiến thức về tóc/dịch vụ, thông tin thợ, hoặc thông tin chi nhánh của Nam Barbershop.",
        parameters: {
          type: "object",
          properties: {
            query: { type: "string", description: "Nội dung cần tra cứu, viết tự nhiên bằng tiếng Việt" },
            namespace: { type: "string", enum: ["hairstyles", "colors", "products", "haircare", "barbers", "branches", "services"] },
            branchName: {
              type: "string",
              description: "CHỈ dùng khi namespace là 'barbers' và khách có nhắc tên chi nhánh cụ thể — truyền đúng tên chi nhánh (vd 'Chi nhánh Quận 1') để lọc thợ đúng chi nhánh đó. Bỏ trống nếu khách không chỉ định chi nhánh hoặc namespace khác.",
            },
          },
          required: ["query", "namespace"],
        },
      },
    },
  ];

  const messages = [
    { role: "system", content: sys },
    ...history.slice(-6).map((h) => ({ role: h.role === "user" ? "user" : "assistant", content: h.content })),
    { role: "user", content: message },
  ];

  try {
    let choice;
    for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
      const isLastAllowedRound = round === MAX_TOOL_ROUNDS - 1;
      const resp = await groq.chat.completions.create({
        model: MODEL_MAIN,
        messages,
        // Ở vòng cuối cùng, ép model PHẢI trả lời bằng lời chứ không được
        // gọi tool thêm nữa — tránh lặp vô hạn hoặc lỗi tool_choice.
        tools: isLastAllowedRound ? undefined : tools,
        tool_choice: isLastAllowedRound ? undefined : "auto",
        temperature: 0.3,
        max_tokens: 400,
      });
      choice = resp.choices[0].message;

      if (!choice.tool_calls?.length) break;

      messages.push(choice);
      for (const tc of choice.tool_calls) {
        let args = {};
        try { args = JSON.parse(tc.function.arguments || "{}"); } catch {}
        const result = await searchKnowledge(args);
        messages.push({ role: "tool", tool_call_id: tc.id, content: JSON.stringify(result) });
      }
    }

    return { reply: choice?.content || "Dạ anh/chị cần em tư vấn thêm gì không ạ?" };
  } catch (err) {
    if (err.status === 429) {
      return { reply: "Dạ hệ thống đang tạm thời quá tải, anh/chị vui lòng nhắn lại giúp em sau ít phút nha ạ 🙏" };
    }
    console.error("❌ [handleGeneral] lỗi:", err.message);
    return { reply: "Dạ hiện em chưa xử lý được câu hỏi này, anh/chị thử lại giúp em ạ." };
  }
}

// ─────────────────────────────────────────────────────────────
// processBrainLoop — entrypoint chính
// ─────────────────────────────────────────────────────────────
export async function processBrainLoop({ message, bookingState, history = [], isLoggedIn, customerId }) {
  console.log(`\n===== 🧠 BRAIN LOOP (classify-scoped) =====`);
  console.log(`[Message]: "${message}"`);

  let state = { ...bookingState };
  let needLogin = false;
  let needReceptionist = false;

  const respond = (reply) => ({ reply, newBookingState: stripInternal(state), needLogin, needReceptionist });

  const flowInProgress = !!(
    state.idBranch || state.idBarber || state.bookingDate ||
    state.slotTime || state.idServices?.length || state.bookingFlowStarted
  );

  // ── Fast-path rẻ, không tốn token: từ khoá gặp lễ tân quá tường minh ──
  if (RECEPTIONIST_KEYWORDS.test(message)) {
    if (!isLoggedIn) { needLogin = true; return respond("Dạ anh/chị vui lòng đăng nhập để em chuyển máy cho lễ tân ạ."); }
    const r = await transferToReceptionist({ customerId });
    needReceptionist = !!r.success;
    return respond(needReceptionist
      ? "Dạ em đã chuyển cuộc trò chuyện cho lễ tân, anh/chị vui lòng chờ trong giây lát ạ."
      : "Dạ hiện chưa thể chuyển máy, anh/chị thử lại sau ít phút giúp em ạ.");
  }

  // ── CHƯA có flow đặt lịch nào đang chạy → cần phân biệt ý định đầu vào ──
  if (!flowInProgress) {
    const classified = await classifyIntent(message, state, "entry", null);

    if (classified.intent === "receptionist") {
      if (!isLoggedIn) { needLogin = true; return respond("Dạ anh/chị vui lòng đăng nhập để em chuyển máy cho lễ tân ạ."); }
      const r = await transferToReceptionist({ customerId });
      needReceptionist = !!r.success;
      return respond(needReceptionist
        ? "Dạ em đã chuyển cuộc trò chuyện cho lễ tân, anh/chị vui lòng chờ trong giây lát ạ."
        : "Dạ hiện chưa thể chuyển máy, anh/chị thử lại sau ít phút giúp em ạ.");
    }

    if (classified.intent !== "booking_start") {
      const { reply } = await handleGeneral(message, history, isLoggedIn);
      return respond(reply);
    }

    if (!isLoggedIn) {
      return respond("Dạ để đặt lịch, anh/chị vui lòng đăng nhập trước giúp em ạ.");
    }

    state.bookingFlowStarted = true;
    const step = getMissingStepHint(state);
    const { reply, state: next } = await presentStep(step, state);
    state = next;
    return respond(reply);
  }

  // ── Từ đây trở đi: đang dở flow đặt lịch, bắt buộc đã đăng nhập ──
  if (!isLoggedIn) {
    return respond("Dạ để đặt lịch, anh/chị vui lòng đăng nhập trước giúp em ạ.");
  }

  const step = getMissingStepHint(state);

  // ── Bước hiện tại CHƯA từng được hiển thị cho khách trong lượt trước
  // → hiển thị list/câu hỏi, chưa cố hiểu tin nhắn hiện tại (nó có thể
  // chỉ là câu "tôi muốn đặt lịch" kích hoạt flow) ──
  if (state._pendingStep !== step) {
    const { reply, state: next } = await presentStep(step, state);
    state = next;
    return respond(reply);
  }

  // ── Bước XÁC NHẬN cuối: dùng scope "confirm" ──
  if (step === "XAC_NHAN") {
    const classified = await classifyIntent(message, state, "confirm", step);

    if (classified.intent === "receptionist") {
      const r = await transferToReceptionist({ customerId });
      needReceptionist = !!r.success;
      return respond(needReceptionist
        ? "Dạ em đã chuyển cuộc trò chuyện cho lễ tân, anh/chị vui lòng chờ trong giây lát ạ."
        : "Dạ hiện chưa thể chuyển máy, anh/chị thử lại sau ít phút giúp em ạ.");
    }

    if (classified.intent === "confirm_yes") {
      const result = await createBooking({ state, customerId });
      if (!result.success) {
        return respond(`Dạ có lỗi xảy ra khi tạo lịch: ${result.error}. Anh/chị thử lại giúp em ạ.`);
      }
      state = freshState();
      return respond(`Dạ em đã đặt lịch thành công cho anh/chị! Mã lịch hẹn: #${result.idBooking}. Hẹn gặp anh/chị tại Nam Barbershop ạ 🎉`);
    }

    if (classified.intent === "confirm_no") {
      return respond("Dạ vâng, anh/chị muốn thay đổi thông tin nào ạ? (chi nhánh, thợ, ngày, giờ hay dịch vụ)");
    }

    if (classified.intent === "change") {
      const changed = await applyChange(classified.change_field, state);
      state = changed.state;
      return respond(changed.reply);
    }

    if (classified.intent === "greeting_midflow") {
      return respond(`Dạ em chào anh/chị! Mình tiếp tục nha ạ 🙂\n\n${renderSummary(state)}`);
    }

    // other / không xác định → nhắc lại tóm tắt
    return respond(renderSummary(state));
  }

  // ── Đang chờ khách trả lời đúng 1 bước cụ thể → thử resolve cục bộ trước ──
  const resolved = await tryResolveStep(step, message, state);

  if (resolved?.invalidTime) {
    return respond(`Dạ giờ đó không còn trống. Các giờ còn trống: ${resolved.available.join(", ") || "không còn giờ nào trong ngày này"}.`);
  }

  if (resolved) {
    const saved = await saveResolvedField(resolved, state);
    if (!saved.ok) return respond(`Dạ ${saved.error}`);
    state = saved.state;
    const nextStep = getMissingStepHint(state);
    const { reply, state: next } = await presentStep(nextStep, state);
    state = next;
    return respond(reply);
  }

  // ── Local resolve thất bại → gọi classify scope "midflow" để hiểu
  // đúng ý khách (đổi ý / chào giữa chừng / gặp lễ tân / hay chỉ là câu
  // trả lời chưa khớp) thay vì đoán mù bằng regex như bản cũ ──
  const classified = await classifyIntent(message, state, "midflow", step);

  if (classified.intent === "receptionist") {
    const r = await transferToReceptionist({ customerId });
    needReceptionist = !!r.success;
    return respond(needReceptionist
      ? "Dạ em đã chuyển cuộc trò chuyện cho lễ tân, anh/chị vui lòng chờ trong giây lát ạ."
      : "Dạ hiện chưa thể chuyển máy, anh/chị thử lại sau ít phút giúp em ạ.");
  }

  if (classified.intent === "change") {
    const changed = await applyChange(classified.change_field, state);
    state = changed.state;
    return respond(changed.reply);
  }

  if (classified.intent === "greeting_midflow") {
    const { reply } = await presentStep(step, { ...state });
    return respond(`Dạ em nghe rồi ạ 🙂\n\n${reply}`);
  }

  if (classified.intent === "other") {
    const { reply } = await handleGeneral(message, history, isLoggedIn);
    return respond(reply);
  }

  // classified.intent === "booking_answer" (hoặc fallback) → khách có vẻ
  // đang cố trả lời nhưng không khớp gì → thử map theo số thứ tự bằng 1
  // lệnh gọi model RẤT NHỎ, nếu vẫn không được thì yêu cầu chọn lại.
  const idx = await resolveIndexWithLLM(step, message, state);
  const resolvedByIdx = idx ? resolveByIndex(step, idx, state) : null;

  if (resolvedByIdx) {
    const saved = await saveResolvedField(resolvedByIdx, state);
    if (!saved.ok) return respond(`Dạ ${saved.error}`);
    state = saved.state;
    const nextStep = getMissingStepHint(state);
    const { reply, state: next } = await presentStep(nextStep, state);
    state = next;
    return respond(reply);
  }

  const { reply } = await presentStep(step, { ...state, _pendingStep: null });
  return respond(`Dạ em chưa rõ ý anh/chị lắm, anh/chị chọn lại giúp em nhé ạ.\n\n${reply}`);
}

// ── Áp dụng yêu cầu "đổi 1 field đã chọn" — dùng chung cho scope confirm &
// midflow. QUAN TRỌNG: hàm này PHẢI trả về state mới qua return value, KHÔNG
// được tự gọi respond() ở đây — vì respond() được định nghĩa trong
// processBrainLoop và đóng gói (closure) biến `state` của processBrainLoop,
// không phải tham số `state` cục bộ trong hàm này. Nếu gọi respond() ngay
// tại đây, nó sẽ dùng state CŨ (trước khi reset field), khiến state lưu vào
// DB không được cập nhật dù reply hiển thị đúng — gây đứng hình toàn bộ flow
// ở các lượt sau.
async function applyChange(field, state) {
  if (!field) {
    const chosen = ["idBranch", "idBarber", "bookingDate", "slotTime", "idServices"]
      .filter((f) => f === "idServices" ? state.idServices?.length : state[f]);
    const options = chosen.map((f) => FIELD_LABEL_VI[f]).join(", ") || "chi nhánh, thợ, ngày, giờ, dịch vụ";
    return { reply: `Dạ anh/chị muốn đổi thông tin nào ạ? (${options})`, state };
  }

  const hasValue = field === "idServices" ? state.idServices?.length : state[field];
  if (!hasValue) {
    return { reply: `Dạ anh/chị chưa chọn ${FIELD_LABEL_VI[field]} nên chưa có gì để đổi ạ.`, state };
  }

  const reset = clearFieldAndCascade(field, state);
  const nextStep = getMissingStepHint(reset);
  const { reply, state: next } = await presentStep(nextStep, reset);
  return { reply, state: next };
}

// ─────────────────────────────────────────────────────────────
// generateChatSummary — giữ nguyên, dùng model chính
// ─────────────────────────────────────────────────────────────
export async function generateChatSummary(historyText) {
  try {
    const response = await groq.chat.completions.create({
      model: MODEL_MAIN,
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