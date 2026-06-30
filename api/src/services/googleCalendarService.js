import { google } from "googleapis";
import jwt from "jsonwebtoken";
import db from "../models/index.js";

const { UserGoogleCalendar } = db;

const baseOAuth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

export const getAuthUrl = (userId, returnUrl = '/') => {
  return baseOAuth2Client.generateAuthUrl({
    access_type: "offline",
    scope: [
      "https://www.googleapis.com/auth/calendar.events",
      "https://www.googleapis.com/auth/userinfo.email",
      "https://www.googleapis.com/auth/userinfo.profile",
    ],
    prompt: "consent",
    state: JSON.stringify({ userId, returnUrl }),
  });
};

const isEmailAlreadyLinkedToOtherUser = async (email, currentUserId) => {
  const existing = await UserGoogleCalendar.findOne({
    where: { googleEmail: email, userId: { [db.Sequelize.Op.ne]: currentUserId } },
  });
  return existing !== null;
};

export const saveTokensFromCode = async (userId, code) => {
  const { tokens } = await baseOAuth2Client.getToken(code);
  const { access_token, refresh_token, expiry_date, id_token } = tokens;

  let googleEmail = null;
  if (id_token) {
    try {
      const decoded = jwt.decode(id_token);
      googleEmail = decoded?.email || null;
    } catch (err) {
      console.warn("Decode id_token thất bại:", err.message);
    }
  }

  if (!googleEmail && access_token) {
    const tempClient = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );
    tempClient.setCredentials({ access_token });
    const oauth2 = google.oauth2({ version: "v2", auth: tempClient });
    try {
      const res = await oauth2.userinfo.get();
      googleEmail = res.data.email;
    } catch (err) {
      console.error("Lỗi gọi userinfo:", err.message);
      throw new Error("Không thể lấy email từ Google API: " + err.message);
    }
  }

  if (!googleEmail) {
    throw new Error("Không thể lấy email từ token Google. Vui lòng thử lại.");
  }

  // ✅ Kiểm tra email đã được liên kết với user khác chưa
  const isLinkedToOther = await isEmailAlreadyLinkedToOtherUser(googleEmail, userId);
  if (isLinkedToOther) {
    throw new Error("Tài khoản Google này đã được liên kết với một người dùng khác. Vui lòng sử dụng tài khoản Google khác.");
  }

  // Upsert cho user hiện tại
  const [record, created] = await UserGoogleCalendar.findOrCreate({
    where: { userId },
    defaults: {
      userId,
      googleEmail,
      accessToken: access_token,
      refreshToken: refresh_token,
      expiry: expiry_date ? new Date(expiry_date) : null,
    },
  });

  if (!created) {
    await record.update({
      googleEmail,
      accessToken: access_token,
      refreshToken: refresh_token,
      expiry: expiry_date ? new Date(expiry_date) : null,
    });
  }

  return record;
};

export const getAuthenticatedClient = async (userId) => {
  const record = await UserGoogleCalendar.findOne({ where: { userId } });
  if (!record) throw new Error("User not linked with Google Calendar");

  const client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );

  client.setCredentials({
    access_token: record.accessToken,
    refresh_token: record.refreshToken,
    expiry_date: record.expiry ? record.expiry.getTime() : null,
  });

  client.on("tokens", async (tokens) => {
    if (tokens.refresh_token) await record.update({ refreshToken: tokens.refresh_token });
    if (tokens.access_token) await record.update({ accessToken: tokens.access_token });
    if (tokens.expiry_date) await record.update({ expiry: new Date(tokens.expiry_date) });
  });

  return client;
};

export const addEventToCalendar = async (userId, eventDetails) => {
  const auth = await getAuthenticatedClient(userId);
  const calendar = google.calendar({ version: "v3", auth });

  const event = {
    summary: eventDetails.summary,
    description: eventDetails.description,
    start: {
      dateTime: eventDetails.startDateTime,
      timeZone: "Asia/Ho_Chi_Minh",
    },
    end: {
      dateTime: eventDetails.endDateTime,
      timeZone: "Asia/Ho_Chi_Minh",
    },
    // ❌ Đã xóa attendees – chỉ là nhắc hẹn cho khách, không gửi thư mời
    reminders: {
      useDefault: false,
      overrides: [
        { method: "email", minutes: 24 * 60 },
        { method: "popup", minutes: 30 },
      ],
    },
  };

  const response = await calendar.events.insert({
    calendarId: "primary",
    resource: event,
    sendUpdates: "all",
  });
  return response.data;
};

export const getLinkStatus = async (userId) => {
  const record = await UserGoogleCalendar.findOne({ where: { userId } });
  return {
    linked: !!record,
    email: record?.googleEmail || null,
  };
};

export const unlinkCalendar = async (userId) => {
  await UserGoogleCalendar.destroy({ where: { userId } });
};

export const addBookingEventToCalendar = async (userId, bookingInfo) => {
  try {
    // 1. Kiểm tra user đã liên kết calendar chưa
    const record = await UserGoogleCalendar.findOne({ where: { userId } });
    if (!record) {
      console.log(`User ${userId} chưa liên kết Google Calendar`);
      return { success: false, message: "User not linked" };
    }

    // 2. Lấy danh sách dịch vụ (tên, thời gian)
    const serviceIds = bookingInfo.services.map(s => s.idService);
    const serviceItems = await db.Service.findAll({
      where: { idService: serviceIds },
      attributes: ['duration', 'name']
    });
    const totalDuration = serviceItems.reduce((sum, s) => sum + (s.duration || 30), 0);
    const serviceNames = serviceItems.map(s => s.name).join(", ");

    // 3. Tính thời gian bắt đầu và kết thúc
    const startDateTime = `${bookingInfo.bookingDate}T${bookingInfo.bookingTime}:00`;
    const endDateTime = new Date(startDateTime);
    endDateTime.setMinutes(endDateTime.getMinutes() + totalDuration);

    // 4. Lấy thông tin chi nhánh (tên, địa chỉ, receptionist phone)
    const branch = await db.Branch.findByPk(bookingInfo.branchId, {
      include: [{
        model: db.Receptionist,
        as: 'receptionist',
        include: [{ model: db.User, as: 'user', attributes: ['phoneNumber', 'fullName'] }]
      }],
      attributes: ['name', 'address']
    });
    const branchName = branch?.name || 'Chưa xác định';
    const branchAddress = branch?.address || '';
    const receptionistName = branch?.receptionist?.user?.fullName || 'Chưa có';
    const receptionistPhone = branch?.receptionist?.user?.phoneNumber || 'Chưa có';

    // 5. Lấy số điện thoại của thợ
    const barber = await db.Barber.findByPk(bookingInfo.barberId, {
      include: [{ model: db.User, as: 'user', attributes: ['phoneNumber', 'fullName'] }]
    });
    const barberPhone = barber?.user?.phoneNumber || 'Chưa có';
    const barberName = barber?.user?.fullName || bookingInfo.barberName;

    // 6. Xây dựng nội dung mô tả
    const description = [
      `📅 Dịch vụ: ${serviceNames}`,
      `🏪 Cơ sở: ${branchName} – ${branchAddress}`,
      `📞 Liên hệ cơ sở: ${receptionistName} - ${receptionistPhone}`,
      `💇 Thợ cắt tóc: ${barberName} - ${barberPhone}`,
      `👤 Khách hàng: ${bookingInfo.customerName} - ${bookingInfo.customerPhone}`,
      ...(bookingInfo.description && bookingInfo.description !== serviceNames 
        ? [`📝 Ghi chú: ${bookingInfo.description}`] 
        : [])
    ].join('\n');

    const eventDetails = {
      summary: `💈 ${serviceNames} - ${branchName}`,
      description: description,
      startDateTime: startDateTime,
      endDateTime: endDateTime.toISOString(),
      // ❌ Không gửi attendees – chỉ nhắc hẹn cá nhân
      location: `${branchName}, ${branchAddress}`,
    };

    const result = await addEventToCalendar(userId, eventDetails);
    return { success: true, event: result };
  } catch (error) {
    console.error("❌ Lỗi thêm booking event vào Google Calendar:", error);
    return { success: false, error: error.message };
  }
};