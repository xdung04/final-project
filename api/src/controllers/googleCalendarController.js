import * as calendarService from "../services/googleCalendarService.js";

// Lấy URL liên kết Google (nhận returnUrl từ query)
export const initiateGoogleLink = async (req, res) => {
  try {
    const userId = req.user.idUser;
    const returnUrl = req.query.returnUrl || '/';
    const url = calendarService.getAuthUrl(userId, returnUrl);
    res.json({ url });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to generate link URL" });
  }
};

// Callback sau khi user đồng ý
export const googleCallback = async (req, res) => {
  const { code, state } = req.query;
  if (!code || !state) {
    return res.status(400).send("Thiếu code hoặc state");
  }
  let userId, returnUrl;
  try {
    const parsed = JSON.parse(state);
    userId = parsed.userId;
    returnUrl = parsed.returnUrl || '/';
  } catch (e) {
    userId = state;
    returnUrl = '/';
  }
  try {
    await calendarService.saveTokensFromCode(parseInt(userId), code);
    const redirectUrl = `${process.env.FRONTEND_URL}${returnUrl}${returnUrl.includes('?') ? '&' : '?'}calendar=linked`;
    res.redirect(redirectUrl);
  } catch (err) {
    console.error(err);
    const redirectUrl = `${process.env.FRONTEND_URL}${returnUrl}${returnUrl.includes('?') ? '&' : '?'}calendar=error&message=${encodeURIComponent(err.message)}`;
    res.redirect(redirectUrl);
  }
};

// Kiểm tra trạng thái liên kết
export const getLinkStatus = async (req, res) => {
  try {
    const userId = req.user.idUser;
    const status = await calendarService.getLinkStatus(userId);
    res.json(status);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Hủy liên kết
export const unlinkCalendar = async (req, res) => {
  try {
    const userId = req.user.idUser;
    await calendarService.unlinkCalendar(userId);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Thêm sự kiện test (tuỳ chọn)
export const addTestEvent = async (req, res) => {
  try {
    const userId = req.user.idUser;
    const eventDetails = {
      summary: "Test event",
      description: "This is a test event from Barber system",
      startDateTime: new Date().toISOString(),
      endDateTime: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
    };
    const result = await calendarService.addEventToCalendar(userId, eventDetails);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};