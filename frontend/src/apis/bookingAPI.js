import axios from "axios";

const API_URL = process.env.REACT_APP_API_BASE_URL + "/bookings";

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
  // Lấy tất cả booking
  getBooking: () => {
    return axios.get(API_URL, getAuthHeader());
  },

  // Lấy booking của barber theo khoảng ngày
  getForBarber: (idBarber, start, end) => {
    return axios.get(`${API_URL}/barber`, {
      params: {
        idBarber,
        start,
        end,
      },
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
    return axios.get(
      `${API_URL}/barbers/${idBarber}/booked-slots`,
      {
        params: {
          branchId,
          date,
        },
        ...getAuthHeader(),
      }
    );
  },

  // Tạo booking mới
   createBooking: (data) => {
    const token = localStorage.getItem("accessToken");
    return axios.post(`${API_URL}/create`, data, {
      headers: { Authorization: `Bearer ${token}` }
    });  
  },
};

export default bookingApi;