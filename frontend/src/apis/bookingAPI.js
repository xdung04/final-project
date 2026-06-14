import axios from "axios";

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;
const API_URL = `${API_BASE_URL}/bookings`;

// Lấy access token từ localStorage
const getAuthHeader = () => {
  const token = localStorage.getItem("accessToken");
  return {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };
};

const bookingApi = {
  // 🌟 ĐÃ THÊM: Lấy thông tin chi nhánh của lễ tân
  getMyBranch: () => {
    return axios.get(`${API_BASE_URL}/receptionist/my-branch`, getAuthHeader());
  },

  // 🌟 ĐÃ THÊM: Lấy bookings theo idBranch và ngày
  getBookingsByBranch: (idBranch, date) => {
    return axios.get(`${API_URL}/branch/${idBranch}`, {
      params: { date },
      ...getAuthHeader(),
    });
  },

  // 🌟 ĐÃ THÊM: Check-in lịch hẹn
  checkInBooking: (id) => {
    return axios.put(`${API_URL}/${id}/checkin`, {}, getAuthHeader());
  },

  // 🌟 ĐÃ THÊM: Hủy lịch hẹn
  cancelBooking: (id) => {
    return axios.put(`${API_URL}/${id}/cancel`, {}, getAuthHeader());
  },

  // Lấy tất cả booking
  getBooking: () => {
    return axios.get(API_URL, getAuthHeader());
  },

  // Lấy booking của barber theo khoảng ngày
  getForBarber: (idBarber, start, end) => {
    return axios.get(`${API_URL}/barber`, {
      params: { idBarber, start, end },
      ...getAuthHeader(),
    });
  },

  // Hoàn tất booking (upload ảnh)
  completeBooking: (idBooking, data) => {
    return axios.post(`${API_URL}/${idBooking}/complete`, data, {
      headers: {
        ...getAuthHeader().headers,
        "Content-Type": "multipart/form-data",
      },
    });
  },

  // Lấy booked slots của barber theo ngày
  getBookedSlots: (idBarber, branchId, date) => {
    return axios.get(`${API_URL}/barbers/${idBarber}/booked-slots`, {
      params: { branchId, date },
      ...getAuthHeader(),
    });
  },

  // Tạo booking mới
  createBooking: (data) => {
    const token = localStorage.getItem("accessToken");
    return axios.post(`${API_URL}/create`, data, {
      headers: { Authorization: `Bearer ${token}` },
    });
  },
};

export default bookingApi;