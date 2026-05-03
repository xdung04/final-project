import calendarApi from "~/apis/calendarApi";

export const getCalendarLinkStatus = async (token) => {
  try {
    const res = await calendarApi.getStatus(token);
    return res.data;
  } catch (error) {
    console.error("Lỗi lấy trạng thái calendar:", error);
    throw error;
  }
};

export const getGoogleAuthUrl = async (token, returnUrl = '/') => {
  try {
    const res = await calendarApi.getAuthUrl(token, returnUrl);
    return res.data.url;
  } catch (error) {
    console.error("Lỗi lấy auth url:", error);
    throw error;
  }
};

export const unlinkCalendar = async (token) => {
  try {
    const res = await calendarApi.unlink(token);
    return res.data;
  } catch (error) {
    console.error("Lỗi hủy liên kết calendar:", error);
    throw error;
  }
};