import calendarApi from "~/apis/calendarApi";

// Không còn cần truyền token — cookie tự gửi kèm.
// LƯU Ý: calendarApi giờ trả thẳng data (đã bóc .data sẵn ở httpRequest.js),
// nên bỏ hết .data ở dưới.

export const getCalendarLinkStatus = async () => {
  try {
    const res = await calendarApi.getStatus();
    return res;
  } catch (error) {
    console.error("Lỗi lấy trạng thái calendar:", error);
    throw error;
  }
};

export const getGoogleAuthUrl = async (returnUrl = "/") => {
  try {
    const res = await calendarApi.getAuthUrl(returnUrl);
    return res.url;
  } catch (error) {
    console.error("Lỗi lấy auth url:", error);
    throw error;
  }
};

export const unlinkCalendar = async () => {
  try {
    const res = await calendarApi.unlink();
    return res;
  } catch (error) {
    console.error("Lỗi hủy liên kết calendar:", error);
    throw error;
  }
};