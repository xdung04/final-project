import nodemailer from "nodemailer";

// Tạo transporter
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true, // SSL
  auth: {
    user: "nvh11103@gmail.com",
    pass: "xfcpmdydityxlwef", // App Password không dấu cách
  },
});


/**
 * Gửi OTP qua email
 * @param {string} email - Email người nhận
 * @param {string} otp - Mã OTP
 */
export async function sendOtpEmail(email, otp) {
  try {
    await transporter.sendMail({
      from: '"Shop Online" <nvh11103@gmail.com>',
      to: email,
      subject: "Mã OTP xác thực đăng ký",
      text: `Mã OTP của bạn là: ${otp}. OTP có hiệu lực trong 5 phút.`,
    });
    console.log(`OTP đã gửi đến ${email}: ${otp}`);
  } catch (error) {
    console.error(`Gửi OTP thất bại đến ${email}:`, error.message);
    throw new Error("Gửi OTP thất bại, vui lòng thử lại sau.");
  }
}


/**
 * Gửi mail xác nhận booking
 * @param {string} email - email khách
 * @param {object} booking - thông tin booking
 */
export async function sendBookingEmail(email, booking) {
  const { branch, branchAddress, barber, bookingDate, bookingTime, services, total } = booking;

  const serviceList = services.map((s) => `- ${s.name}: ${s.price.toLocaleString()}đ`).join("\n");

  const text = `
Chào bạn,

Lịch hẹn của bạn đã được xác nhận:

Cơ sở: ${branch}
Địa chỉ: ${branchAddress}
Thợ: ${barber}
Ngày: ${bookingDate}
Giờ: ${bookingTime}
Dịch vụ:
${serviceList}
Tổng tiền: ${total.toLocaleString()}đ

Cảm ơn bạn đã đặt lịch!
`;

  try {
    await transporter.sendMail({
      from: '"Barber Shop" <nvh11103@gmail.com>',
      to: email,
      subject: "Xác nhận đặt lịch thành công",
      text,
    });
    console.log(`Mail xác nhận đã gửi tới ${email}`);
  } catch (err) {
    console.error("Gửi mail xác nhận thất bại:", err.message);
  }
}

