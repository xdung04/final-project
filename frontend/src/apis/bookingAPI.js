import * as request from "~/apis/configs/httpRequest";

const BOOKING_URL = "/bookings";

// Không còn cần getAuthHeader() — cookie tự gửi kèm nhờ withCredentials: true
// ở httpRequest.js. LƯU Ý: res trả về đã bóc .data sẵn, đọc thẳng res.xxx ở
// nơi gọi thay vì res.data.xxx.
const bookingApi = {
  getMyBranch: () => request.get(`/receptionist/my-branch`),

  getBookingsByBranch: (idBranch, date) =>
    request.get(`${BOOKING_URL}/branch/${idBranch}`, { params: { date } }),

  checkInBooking: (id) => request.put(`${BOOKING_URL}/${id}/checkin`, {}),

  cancelBooking: (id) => request.put(`${BOOKING_URL}/${id}/cancel`, {}),

  getBooking: () => request.get(BOOKING_URL),

  getForBarber: (idBarber, start, end) =>
    request.get(`${BOOKING_URL}/barber`, { params: { idBarber, start, end } }),

  completeBooking: (idBooking, data) =>
    request.post(`${BOOKING_URL}/${idBooking}/complete`, data, {
      headers: { "Content-Type": "multipart/form-data" },
    }),

  getBookedSlots: (idBarber, branchId, date) =>
    request.get(`${BOOKING_URL}/barbers/${idBarber}/booked-slots`, {
      params: { branchId, date },
    }),

  createBooking: (data) => request.post(`${BOOKING_URL}/create`, data),
};

export default bookingApi;