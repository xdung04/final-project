// src/services/bookingTools.js

import db from "../models/index.js";
import {
  getBookedSlotsByBarber,
  createBookingService,
} from "./bookingService.js";

export async function getBranches() {
  try {
    const branches = await db.Branch.findAll({
      where: { status: "Active" },
      attributes: ["idBranch", "name", "address", "openTime", "closeTime"],
    });
    return branches.map((b) => ({
      idBranch: b.idBranch,
      name: b.name,
      address: b.address,
      openTime: b.openTime,
      closeTime: b.closeTime,
    }));
  } catch (err) {
    return { success: false, error: err.message };
  }
}

export async function getBarbers({ idBranch }) {
  try {
    const barbers = await db.Barber.findAll({
      where: { idBranch, isLocked: false },
      include: [{ model: db.User, as: "user", attributes: ["fullName"] }],
    });
    return barbers.map((b, index) => ({
      stt: index + 1,
      idBarber: b.idBarber,
      name: b.user?.fullName || "Không rõ tên",
    }));
  } catch (err) {
    return { success: false, error: err.message };
  }
}

export async function getSlots({ idBranch, idBarber, bookingDate }) {
  try {
    const result = await getBookedSlotsByBarber(idBranch, idBarber, bookingDate);

    let availableSlots = result.availableSlots || [];

    const todayStr = new Date().toLocaleDateString("sv-SE", { timeZone: "Asia/Ho_Chi_Minh" });
    if (bookingDate === todayStr) {
      const nowHour = new Date().toLocaleTimeString("vi-VN", {
        timeZone: "Asia/Ho_Chi_Minh", hour: "2-digit", minute: "2-digit", hour12: false,
      });
      availableSlots = availableSlots.filter((slot) => slot > nowHour);
    }

    return {
      availableSlots,
      isUnavailable: result.isUnavailable || false,
      reason: result.reason || null,
    };
  } catch (err) {
    return {
      success: false,
      error: err.message,
      hint: "idBarber hoặc idBranch không hợp lệ. Hãy gọi lại getBarbers để lấy đúng idBarber thật từ DB, không dùng số thứ tự.",
    };
  }
}

export async function getServices({ idBranch }) {
  try {
    const assignments = await db.ServiceAssignment.findAll({
      where: { idBranch },
      include: [{
        model: db.Service,
        as: "service",
        where: { status: "Active" },
        attributes: ["idService", "name", "price", "duration"],
      }],
    });
    return assignments
      .map((a) => a.service)
      .filter(Boolean)
      .map((s) => ({
        idService: s.idService,
        name: s.name,
        price: Number(s.price),
        duration: s.duration,
      }));
  } catch (err) {
    return { success: false, error: err.message };
  }
}

export async function createBooking({ state, customerId }) {
  try {
    const { idBranch, idBarber, bookingDate, slotTime, idServices, serviceNames } = state;

    const services = await Promise.all(
      idServices.map(async (id, idx) => {
        const svc = await db.Service.findByPk(id, {
          attributes: ["idService", "price", "name"],
        });
        return {
          idService: id,
          name: serviceNames[idx] || svc?.name,
          price: Number(svc?.price || 0),
          quantity: 1,
        };
      })
    );

    const booking = await createBookingService({
      idCustomer: customerId,
      idBranch,
      idBarber,
      bookingDate,
      bookingTime: slotTime,
      services,
      syncToCalendar: true,
    });

    return { success: true, idBooking: booking.idBooking };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

// ─────────────────────────────────────────────────────────────
// updateBookingState — state machine cứng ở tầng code (1 bước/lần gọi,
// chặn nhảy bước, validate idBarber thuộc idBranch, validate slotTime
// còn trống, cascade reset khi đổi field gốc).
// ─────────────────────────────────────────────────────────────

const STEP_ORDER = ["idBranch", "idBarber", "bookingDate", "slotTime", "idServices"];
const LABEL_FIELDS = ["branchName", "barberName", "serviceNames"];

export async function updateBookingState({ fields }, currentState = {}) {
  try {
    if (!fields || typeof fields !== "object") {
      return { success: false, error: "Thiếu fields cần cập nhật." };
    }

    const stepKeys = Object.keys(fields).filter((k) => !LABEL_FIELDS.includes(k));

    if (stepKeys.length === 0) {
      return { success: false, error: "Không có trường hợp lệ nào để cập nhật." };
    }
    if (stepKeys.length > 1) {
      return {
        success: false,
        error: `Chỉ được cập nhật MỘT bước mỗi lần gọi (nhận được cùng lúc: ${stepKeys.join(", ")}).`,
      };
    }

    const field = stepKeys[0];
    const stepIndex = STEP_ORDER.indexOf(field);

    if (stepIndex > 0) {
      const prevField = STEP_ORDER[stepIndex - 1];
      const prevMissing =
        prevField === "idServices"
          ? !currentState.idServices?.length
          : !currentState[prevField];

      if (prevMissing) {
        return {
          success: false,
          error: `Chưa xác nhận bước "${prevField}" — không thể lưu "${field}" trước khi hoàn tất bước đó.`,
        };
      }
    }

    const updatedFields = { ...fields };

    if (updatedFields.idBarber !== undefined && updatedFields.idBarber !== null) {
      const barber = await db.Barber.findOne({
        where: {
          idBarber: updatedFields.idBarber,
          idBranch: currentState.idBranch,
          isLocked: false,
        },
        include: [{ model: db.User, as: "user", attributes: ["fullName"] }],
      });
      if (!barber) {
        return {
          success: false,
          error: `idBarber ${updatedFields.idBarber} không tồn tại, đã bị khoá, hoặc không thuộc chi nhánh đã chọn.`,
        };
      }
      updatedFields.barberName = barber.user?.fullName || updatedFields.barberName;
    }

    if (updatedFields.idBranch !== undefined && updatedFields.idBranch !== null) {
      const branch = await db.Branch.findOne({
        where: { idBranch: updatedFields.idBranch, status: "Active" },
      });
      if (!branch) {
        return {
          success: false,
          error: `idBranch ${updatedFields.idBranch} không tồn tại hoặc không hoạt động.`,
        };
      }
      updatedFields.branchName = branch.name;
    }

    if (updatedFields.bookingDate !== undefined && updatedFields.bookingDate !== null) {
      const todayStr = new Date().toLocaleDateString("sv-SE", { timeZone: "Asia/Ho_Chi_Minh" });
      if (updatedFields.bookingDate < todayStr) {
        return {
          success: false,
          error: `Ngày ${updatedFields.bookingDate} đã qua. Vui lòng chọn từ ngày ${todayStr} trở đi.`,
        };
      }
    }

    if (updatedFields.slotTime !== undefined && updatedFields.slotTime !== null) {
      const slotResult = await getBookedSlotsByBarber(
        currentState.idBranch,
        currentState.idBarber,
        currentState.bookingDate
      );
      const available = slotResult.availableSlots || [];
      if (!available.includes(updatedFields.slotTime)) {
        return {
          success: false,
          error: `Giờ ${updatedFields.slotTime} không khả dụng. Các giờ còn trống: ${available.join(", ") || "không còn giờ nào trong ngày này"}.`,
        };
      }
    }

    if (Array.isArray(updatedFields.idServices) && updatedFields.idServices.length > 0) {
      const services = await db.Service.findAll({
        where: { idService: updatedFields.idServices, status: "Active" },
        attributes: ["idService", "name"],
      });
      if (services.length !== updatedFields.idServices.length) {
        const foundIds = services.map((s) => s.idService);
        const missing = updatedFields.idServices.filter((id) => !foundIds.includes(id));
        return {
          success: false,
          error: `idService không hợp lệ: ${missing.join(", ")}.`,
        };
      }
      updatedFields.serviceNames = updatedFields.idServices.map(
        (id) => services.find((s) => s.idService === id)?.name
      );
    }

    const CASCADE_MAP = {
      idBranch:    { idBarber: null, barberName: null, bookingDate: null, slotTime: null, idServices: [], serviceNames: [] },
      idBarber:    { bookingDate: null, slotTime: null, idServices: [], serviceNames: [] },
      bookingDate: { slotTime: null, idServices: [], serviceNames: [] },
      slotTime:    { idServices: [], serviceNames: [] },
    };

    if (CASCADE_MAP[field] !== undefined) {
      const oldValue = currentState[field];
      const newValue = updatedFields[field];
      const changed = Array.isArray(newValue)
        ? JSON.stringify(newValue) !== JSON.stringify(oldValue)
        : newValue !== oldValue;

      if (changed && oldValue !== undefined && oldValue !== null) {
        Object.assign(updatedFields, CASCADE_MAP[field]);
      }
    }

    return { success: true, updatedFields };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

export function resetBooking({ fields = [] } = {}) {
  try {
    const defaultState = {
      idBranch: null,
      branchName: null,
      idBarber: null,
      barberName: null,
      bookingDate: null,
      slotTime: null,
      idServices: [],
      serviceNames: [],
      bookingFlowStarted: false,
    };

    if (fields.length === 0) {
      return { success: true, clearedState: defaultState };
    }

    const clearedFields = {};
    fields.forEach((f) => {
      if (f in defaultState) clearedFields[f] = defaultState[f];
    });

    return { success: true, clearedFields };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

export async function transferToReceptionist({ customerId }) {
  try {
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

// ─────────────────────────────────────────────────────────────
// Local matchers — nhận diện lựa chọn của khách bằng regex/fuzzy-match,
// KHÔNG cần gọi LLM.
// ─────────────────────────────────────────────────────────────

function normalize(s) {
  return (s || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // bỏ dấu tiếng Việt để so khớp linh hoạt hơn
    .trim();
}

const FILLER_WORDS = new Set([
  "di", "nha", "nhe", "giup", "anh", "chi", "em", "a", "oi", "la",
  "ok", "oke", "cho", "minh", "toi", "dc", "duoc", "voi", "nay", "gium",
]);

function tokenize(text) {
  return normalize(text)
    .split(/[\s,]+/)
    .filter(Boolean)
    .filter((w) => !FILLER_WORDS.has(w));
}

function levenshtein(a, b) {
  const m = a.length, n = b.length;
  const dp = Array.from({ length: m + 1 }, (_, i) => [i, ...new Array(n).fill(0)]);
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return dp[m][n];
}

// Số PHẢI khớp chính xác (không fuzzy số, tránh "1" khớp nhầm "2").
// Chữ cho phép sai lệch tối đa 1 ký tự (thiếu/thừa/gõ nhầm 1 chữ).
function fuzzyTokenMatch(a, b) {
  if (a === b) return true;
  if (/^\d+$/.test(a) || /^\d+$/.test(b)) return false;
  if (a.length >= 3 && b.length >= 3) return levenshtein(a, b) <= 1;
  return false;
}

function scoreNameMatch(messageTokens, nameTokens) {
  if (!nameTokens.length) return 0;
  const matched = nameTokens.filter((nt) => messageTokens.some((mt) => fuzzyTokenMatch(mt, nt)));
  return matched.length / nameTokens.length;
}

// Yêu cầu khớp >= 50% số từ trong tên VÀ không bị hoà điểm với ứng viên khác
// (tránh chọn nhầm khi khách chỉ gõ 1 từ chung chung như "văn").
function bestFuzzyMatch(text, items, getName) {
  const msgTokens = tokenize(text);
  if (!msgTokens.length) return null;

  let best = null, bestScore = 0, tie = false;
  for (const item of items) {
    const nameTokens = tokenize(getName(item));
    const score = scoreNameMatch(msgTokens, nameTokens);
    if (score > bestScore) { best = item; bestScore = score; tie = false; }
    else if (score === bestScore && score > 0) { tie = true; }
  }
  return bestScore >= 0.5 && !tie ? best : null;
}

// ✅ FIX: chỉ coi là "chọn theo số thứ tự trong danh sách" khi cả tin nhắn
// CHỈ chứa số (có thể kèm "số"/"mục" phía trước, hoặc dấu chấm/đóng ngoặc
// phía sau — vd "3", "số 2", "2."). Nếu số xuất hiện CÙNG với chữ khác
// (vd "quận 3", "chi nhánh 1", "thợ số 5 đẹp trai") thì đó là một phần của
// TÊN/ĐỊA CHỈ cần fuzzy-match, không phải lựa chọn theo vị trí — nếu vẫn
// bắt số bừa bãi như bản cũ, "quận 3" (mục thứ 2 trong danh sách) sẽ bị
// hiểu nhầm thành "chọn mục thứ 3" (vd Bình Thạnh), sai hoàn toàn ý khách.
const PURE_INDEX_PATTERN = /^\s*(?:số|mục)?\s*(\d+)\s*[.)]?\s*$/i;

export function matchBranch(text, branches = []) {
  const raw = (text || "").trim();
  if (!raw) return null;

  const pureIndex = raw.match(PURE_INDEX_PATTERN);
  if (pureIndex) {
    const n = parseInt(pureIndex[1], 10);
    if (branches[n - 1]) return branches[n - 1]; // theo số thứ tự hiển thị (1-based)
    const byId = branches.find((b) => b.idBranch === n);
    if (byId) return byId;
  }

  return (
    bestFuzzyMatch(raw, branches, (b) => b.name) ||
    bestFuzzyMatch(raw, branches, (b) => b.address)
  );
}

export function matchBarber(text, barbers = []) {
  const raw = (text || "").trim();
  if (!raw) return null;

  const pureIndex = raw.match(PURE_INDEX_PATTERN);
  if (pureIndex) {
    const n = parseInt(pureIndex[1], 10);
    if (barbers[n - 1]) return barbers[n - 1];
  }

  return bestFuzzyMatch(raw, barbers, (b) => b.name);
}

export function matchServices(text, services = []) {
  const raw = (text || "").trim();
  if (!raw) return [];
  const parts = raw
    .split(/,|\bvà\b|\+/i)
    .map((p) => p.trim())
    .filter(Boolean);

  const matched = [];
  for (const part of parts) {
    const numOnly = part.match(/^\d+$/);
    if (numOnly) {
      const n = parseInt(numOnly[0], 10);
      if (services[n - 1]) {
        matched.push(services[n - 1]);
        continue;
      }
    }
    const found = bestFuzzyMatch(part, services, (s) => s.name);
    if (found) matched.push(found);
  }

  return [...new Map(matched.map((s) => [s.idService, s])).values()];
}

export function parseDateFromText(text, todayStr, tomorrowStr) {
  const t = normalize(text);
  if (!t) return null;

  if (/\bhom nay\b/.test(t)) return todayStr;
  if (/\bngay mai\b/.test(t)) return tomorrowStr;

  const weekdayMap = {
    "thu 2": 1, "thu hai": 1,
    "thu 3": 2, "thu ba": 2,
    "thu 4": 3, "thu tu": 3,
    "thu 5": 4, "thu nam": 4,
    "thu 6": 5, "thu sau": 5,
    "thu 7": 6, "thu bay": 6,
    "chu nhat": 0, "chu nhât": 0,
  };
  for (const [keyword, targetDay] of Object.entries(weekdayMap)) {
    if (t.includes(keyword)) {
      const now = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Ho_Chi_Minh" }));
      let diff = targetDay - now.getDay();
      if (diff <= 0) diff += 7;
      const target = new Date(now.getTime() + diff * 86400000);
      return target.toLocaleDateString("sv-SE", { timeZone: "Asia/Ho_Chi_Minh" });
    }
  }

  const dmMatch = text.match(/(\d{1,2})[\/\-](\d{1,2})(?:[\/\-](\d{4}))?/);
  if (dmMatch) {
    const year = dmMatch[3] || new Date().getFullYear();
    const month = String(dmMatch[2]).padStart(2, "0");
    const day = String(dmMatch[1]).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  return null;
}

export function parseTimeFromText(text) {
  const timeMatch = text.match(/(\d{1,2})\s*(?:[:h](\d{2}))?\s*(?:giờ)?\s*(sáng|chiều|tối)?/i);
  if (!timeMatch) return null;
  let h = parseInt(timeMatch[1], 10);
  if (isNaN(h) || h > 23) return null;
  const min = timeMatch[2] ? String(timeMatch[2]).padStart(2, "0") : "00";
  const period = timeMatch[3]?.toLowerCase();
  if ((period === "chiều" || period === "tối") && h < 12) h += 12;
  if (period === "sáng" && h === 12) h = 0;
  return `${String(h).padStart(2, "0")}:${min}`;
}