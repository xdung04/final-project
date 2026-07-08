import Groq from "groq-sdk";
import { ChatGroq } from "@langchain/groq";
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { HumanMessage, AIMessage, SystemMessage } from "@langchain/core/messages";
import {
  getBranches, getBarbers, getSlots, getServices,
  createBooking, transferToReceptionist, updateBookingState,
  matchBranch, matchBarber, matchServices,
  parseDateFromText, parseTimeFromText,
} from "./bookingTools.js";
import { searchKnowledgeTool } from "./knowledgeTools.js";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
// ─────────────────────────────────────────────────────────────
const MODEL_MAIN = process.env.GROQ_MODEL_MAIN || process.env.GROQ_MODEL || "llama-3.3-70b-versatile";
const MODEL_CLASSIFY = process.env.GROQ_MODEL_CLASSIFY || "llama-3.1-8b-instant";

const RECEPTIONIST_KEYWORDS = /(gặp lễ tân|gặp người thật|nhân viên tư vấn|nói chuyện với người|gặp nhân viên)/i;
const PURE_GREETING = /^(xin chào|chào( bạn| shop| ạ)?|hi|hello|alo)[\s!.]*$/i;

const STEP_LABEL_VI = {
  CHI_NHANH: "chọn chi nhánh",
  THO: "chọn thợ",
  NGAY: "chọn ngày",
  GIO: "chọn giờ",
  DICH_VU: "chọn dịch vụ",
  XAC_NHAN: "xác nhận thông tin đặt lịch",
};

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

const QUESTION_SIGNAL_REGEX =
  /\?|mấy giờ|bao nhiêu|ở đâu|địa chỉ|là gì|như thế nào|có những|có gì|thế nào|sao vậy|tại sao|khi nào|mở cửa|đóng cửa|giá(\s|$)/i;

function isWeakMatch(step, message, resolved) {
  if (!["CHI_NHANH", "THO", "DICH_VU"].includes(step)) return false;

  const msg = message.trim();
  const words = msg.split(/\s+/).filter(Boolean);
  if (words.length <= 4) return false;

  // Có tín hiệu câu hỏi rõ ràng → nghi ngờ, cần model xác nhận lại.
  if (QUESTION_SIGNAL_REGEX.test(msg)) return true;

  // Câu dài hơn hẳn so với chính tên vừa match được → khả năng tên đó
  // chỉ là một phần nhỏ trong câu có ý khác.
  const labelValue = Array.isArray(resolved.labelValue)
    ? resolved.labelValue.join(" ")
    : resolved.labelValue || "";
  const labelWordCount = labelValue.split(/\s+/).filter(Boolean).length || 1;
  if (words.length > labelWordCount + 3) return true;

  return false;
}

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
// classifyIntent — KHÔNG đổi, vẫn raw Groq SDK. Lý do (nhắc lại cho rõ
// trong khoá luận): đây là 1 lệnh gọi single-shot trả JSON, không có
// bước "gọi tool nhiều vòng" nào để LangChain Agent phát huy giá trị.
// Đổi sang LangChain ở đây (vd ChatGroq.withStructuredOutput) chỉ đổi
// CÚ PHÁP gọi API, không thay đổi bản chất bài toán — nên KHÔNG đưa vào
// phạm vi so sánh "điểm mạnh của Agent/tool-calling".
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
- "cancel_flow": khách muốn HUỶ/DỪNG việc đặt lịch (vd "thôi", "không đặt nữa", "huỷ"), KHÔNG phải muốn gặp người thật
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

// ─────────────────────────────────────────────────────────────
// handleGeneral — PHẦN THAY ĐỔI CHÍNH sang LangChain.
//
// So với bản gốc (vòng `for` tự viết + tự parse tool_calls + tự push
// message tool), giờ dùng `createReactAgent` của LangGraph:
//   - Agent tự lặp: gọi model → model quyết định có cần gọi
//     searchKnowledgeTool không → nếu có, tự thực thi tool, tự đẩy kết
//     quả (ToolMessage) vào lịch sử → gọi lại model → lặp tới khi model
//     trả lời bằng text thuần.
//   - Không cần tự quản lý MAX_TOOL_ROUNDS / tool_choice thủ công —
//     LangGraph có cơ chế recursionLimit riêng để tránh loop vô hạn.
//   - Không cần tự try/catch JSON.parse(tc.function.arguments) — Agent
//     validate input tool qua Zod schema đã khai báo trong
//     knowledgeTools.js.
//
// agentModel được khởi tạo 1 LẦN bên ngoài hàm (module scope) để tránh
// tạo lại client mỗi lần gọi — tương tự việc `groq` client cũ chỉ khởi
// tạo 1 lần ở đầu file.
// ─────────────────────────────────────────────────────────────
const agentModel = new ChatGroq({
  apiKey: process.env.GROQ_API_KEY,
  model: MODEL_MAIN,
  temperature: 0.3,
  maxTokens: 400,
});

const knowledgeAgent = createReactAgent({
  llm: agentModel,
  tools: [searchKnowledgeTool],
});

const GENERAL_SYSTEM_PROMPT = `Bạn là trợ lý Nam Barbershop. Dùng tool searchKnowledge để tra cứu thông tin, không tự bịa.
searchKnowledge có 4 loại namespace:
- "hairstyles"/"colors"/"products"/"haircare": kiến thức chung về kiểu tóc, màu tóc, sản phẩm, chăm sóc tóc.
- "barbers": thông tin từng thợ (chuyên môn, phong cách, kinh nghiệm, đánh giá, chứng chỉ). Dùng namespace này khi khách hỏi về tay nghề/chuyên môn/phong cách của thợ, hoặc hỏi "ai cắt đẹp kiểu X". Nếu khách có nhắc tên chi nhánh cụ thể, LUÔN truyền kèm branchName đúng như tên chi nhánh (vd "Chi nhánh Quận 1") để lọc đúng chi nhánh — không lọc sẽ trả về cả thợ chi nhánh khác.
- "branches": thông tin chi nhánh (địa chỉ, giờ mở cửa). Dùng khi khách hỏi địa chỉ/giờ hoạt động của chi nhánh.
- "services": thông tin các dịch vụ, giá, thời lượng...
Xưng em, gọi khách là anh/chị, trả lời ngắn gọn, không dùng markdown thô, không nhúng JSON.`;

async function handleGeneral(message, history, isLoggedIn) {
  if (PURE_GREETING.test(message.trim())) {
    return {
      reply: "Dạ em chào anh/chị! Nam Barbershop có thể giúp anh/chị đặt lịch cắt tóc hoặc tư vấn về tóc/dịch vụ. Anh/chị cần hỗ trợ gì ạ?",
    };
  }

  // Chuyển lịch sử hội thoại từ format { role, content } cũ sang
  // BaseMessage của LangChain — Agent cần đúng kiểu message này để
  // duyệt lịch sử + phân biệt lượt user/assistant/tool.
  const historyMessages = history.slice(-6).map((h) =>
    h.role === "user" ? new HumanMessage(h.content) : new AIMessage(h.content)
  );

  try {
    const result = await knowledgeAgent.invoke(
      {
        messages: [
          new SystemMessage(GENERAL_SYSTEM_PROMPT),
          ...historyMessages,
          new HumanMessage(message),
        ],
      },
      {
        // Tương đương MAX_TOOL_ROUNDS cũ (3 vòng gọi tool) — LangGraph
        // tính recursion theo số bước (model call + tool call đều tính
        // là 1 bước), nên đặt dư ra một chút để không cắt oan lượt trả
        // lời cuối cùng.
        recursionLimit: 8,
      }
    );

    // messages cuối cùng trong state của Agent chính là câu trả lời text
    // sau khi đã đi hết các vòng gọi tool (nếu có).
    const last = result.messages[result.messages.length - 1];
    const reply = typeof last?.content === "string" ? last.content : "";

    return { reply: reply || "Dạ anh/chị cần em tư vấn thêm gì không ạ?" };
  } catch (err) {
    if (err.status === 429 || err.message?.includes("429")) {
      return { reply: "Dạ hệ thống đang tạm thời quá tải, anh/chị vui lòng nhắn lại giúp em sau ít phút nha ạ 🙏" };
    }
    console.error("❌ [handleGeneral] lỗi:", err.message);
    return { reply: "Dạ hiện em chưa xử lý được câu hỏi này, anh/chị thử lại giúp em ạ." };
  }
}

// ─────────────────────────────────────────────────────────────
// processBrainLoop — entrypoint chính. KHÔNG đổi logic so với bản gốc,
// chỉ đổi cách handleGeneral() vận hành bên trong.
// ─────────────────────────────────────────────────────────────
export async function processBrainLoop({ message, bookingState, history = [], isLoggedIn, customerId }) {
  console.log(`\n===== 🧠 BRAIN LOOP (LangChain Agent) =====`);
  console.log(`[Message]: "${message}"`);

  let state = { ...bookingState };
  let needLogin = false;
  let needReceptionist = false;

  const respond = (reply) => ({ reply, newBookingState: stripInternal(state), needLogin, needReceptionist });

  const flowInProgress = !!(
    state.idBranch || state.idBarber || state.bookingDate ||
    state.slotTime || state.idServices?.length || state.bookingFlowStarted
  );

  if (RECEPTIONIST_KEYWORDS.test(message)) {
    if (!isLoggedIn) { needLogin = true; return respond("Dạ anh/chị vui lòng đăng nhập để em chuyển máy cho lễ tân ạ."); }
    const r = await transferToReceptionist({ customerId });
    needReceptionist = !!r.success;
    return respond(needReceptionist
      ? "Dạ em đã chuyển cuộc trò chuyện cho lễ tân, anh/chị vui lòng chờ trong giây lát ạ."
      : "Dạ hiện chưa thể chuyển máy, anh/chị thử lại sau ít phút giúp em ạ.");
  }

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

  if (!isLoggedIn) {
    return respond("Dạ để đặt lịch, anh/chị vui lòng đăng nhập trước giúp em ạ.");
  }

  const step = getMissingStepHint(state);

  if (state._pendingStep !== step) {
    const { reply, state: next } = await presentStep(step, state);
    state = next;
    return respond(reply);
  }

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

    return respond(renderSummary(state));
  }

  const resolved = await tryResolveStep(step, message, state);

  if (resolved?.invalidTime) {
    return respond(`Dạ giờ đó không còn trống. Các giờ còn trống: ${resolved.available.join(", ") || "không còn giờ nào trong ngày này"}.`);
  }

  // ✅ Match MẠNH (câu ngắn gọn, không có tín hiệu câu hỏi khác) → nhận
  // ngay như bản gốc, không tốn thêm lượt gọi model nào. Đây vẫn là
  // đường đi rẻ nhất cho đa số trường hợp (khách trả lời gọn).
  if (resolved && !isWeakMatch(step, message, resolved)) {
    const saved = await saveResolvedField(resolved, state);
    if (!saved.ok) return respond(`Dạ ${saved.error}`);
    state = saved.state;
    const nextStep = getMissingStepHint(state);
    const { reply, state: next } = await presentStep(nextStep, state);
    state = next;
    return respond(reply);
  }

  // ── Local resolve THẤT BẠI, hoặc match YẾU (nghi ngờ đây là câu hỏi
  // khác chứ không phải câu trả lời, vd "chi nhánh quận 1 mở cửa mấy
  // giờ" bị matchBranch nuốt nhầm thành chọn chi nhánh Quận 1) → gọi
  // classify scope "midflow" để model xác nhận đúng ý khách trước khi
  // quyết định. ──
  const classified = await classifyIntent(message, state, "midflow", step);

  // Model xác nhận đây đúng là câu trả lời cho bước đang chờ, và local
  // đã match được (dù yếu) → dùng luôn kết quả match đó, không cần tốn
  // thêm 1 lượt gọi resolveIndexWithLLM nữa.
  if (classified.intent === "booking_answer" && resolved) {
    const saved = await saveResolvedField(resolved, state);
    if (!saved.ok) return respond(`Dạ ${saved.error}`);
    state = saved.state;
    const nextStep = getMissingStepHint(state);
    const { reply, state: next } = await presentStep(nextStep, state);
    state = next;
    return respond(reply);
  }

  if (classified.intent === "receptionist") {
    const r = await transferToReceptionist({ customerId });
    needReceptionist = !!r.success;
    return respond(needReceptionist
      ? "Dạ em đã chuyển cuộc trò chuyện cho lễ tân, anh/chị vui lòng chờ trong giây lát ạ."
      : "Dạ hiện chưa thể chuyển máy, anh/chị thử lại sau ít phút giúp em ạ.");
  }

  if (classified.intent === "cancel_flow") {
    state = freshState();
    return respond("Dạ em đã huỷ tiến trình đặt lịch. Anh/chị cần em hỗ trợ gì thêm không ạ?");
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