import bookingApi from "~/apis/bookingAPI";

// LƯU Ý CHUYỂN ĐỔI: bookingApi giờ gọi qua httpRequest.js (request.get/post/...),
// các hàm đó đã TỰ BÓC .data ra rồi. Trước đây dùng axios gốc nên phải đọc
// `response.data`, giờ `response` đã CHÍNH LÀ data — bỏ hết `.data` ở dưới.

export const fetchMyBranch = async () => {
  try {
    const response = await bookingApi.getMyBranch();
    return response;
  } catch (error) {
    console.error("Error fetching receptionist branch:", error);
    throw error;
  }
};

export const fetchBookingsByBranch = async (idBranch, date) => {
  try {
    const response = await bookingApi.getBookingsByBranch(idBranch, date);
    return response;
  } catch (error) {
    console.error("Error fetching branch bookings:", error);
    throw error;
  }
};

export const checkInBooking = async (id) => {
  try {
    const response = await bookingApi.checkInBooking(id);
    return response;
  } catch (error) {
    console.error("Error checking in booking:", error);
    throw error;
  }
};

export const cancelBooking = async (id) => {
  try {
    const response = await bookingApi.cancelBooking(id);
    return response;
  } catch (error) {
    console.error("Error cancelling booking:", error);
    throw error;
  }
};

export const getBooking = async () => {
  try {
    const response = await bookingApi.getBooking();
    return response;
  } catch (error) {
    console.error("Error fetching bookings:", error);
    throw error;
  }
};

export const fetchBookingsForBarber = async (idBarber, start, end) => {
  try {
    const res = await bookingApi.getForBarber(idBarber, start, end);
    return res;
  } catch (error) {
    console.error("Error fetching barber bookings:", error);
    throw error;
  }
};

export const completeBooking = async (idBooking, formData) => {
  try {
    const res = await bookingApi.completeBooking(idBooking, formData);
    return res;
  } catch (error) {
    console.error("Error completing booking:", error);
    throw error;
  }
};

export const fetchBookedSlots = async (idBarber, branchId, date) => {
  try {
    const res = await bookingApi.getBookedSlots(idBarber, branchId, date);
    return res;
  } catch (error) {
    console.error("Error fetching booked slots:", error);
    throw error;
  }
};

export const createBooking = async (bookingData) => {
  try {
    const res = await bookingApi.createBooking(bookingData);
    return res;
  } catch (error) {
    console.error("Error creating booking:", error);
    // Trích xuất message từ backend response (vd: "Thợ này sẽ nghỉ từ ngày...")
    const message =
      error?.response?.data?.message ||
      error?.response?.data?.error ||
      error.message ||
      "Không thể kết nối server!";
    throw new Error(message);
  }
};
