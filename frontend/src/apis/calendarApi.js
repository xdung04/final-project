import * as request from "~/apis/configs/httpRequest";

const CALENDAR_URL = "/calendar";

// Không còn cần token — cookie tự gửi kèm. Lưu ý res trả về đã bóc .data sẵn
// (xem httpRequest.js), đọc thẳng res.xxx ở nơi gọi.
const calendarApi = {
  getAuthUrl: (returnUrl) =>
    request.get(`${CALENDAR_URL}/google/link`, { params: { returnUrl } }),

  getStatus: () => request.get(`${CALENDAR_URL}/status`),

  unlink: () => request.del(`${CALENDAR_URL}/unlink`),
};

export default calendarApi;