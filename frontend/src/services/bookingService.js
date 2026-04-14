import bookingApi from "~/apis/bookingAPI";

// Lấy tất cả booking
export const getBooking = async () => {
  try {
    const response = await bookingApi.getBooking();
    return response.data;
  } catch (error) {
    console.error("Error fetching bookings:", error);
    throw error;
  }
};

// Lấy booking của barber theo khoảng ngày
export const fetchBookingsForBarber = async (idBarber, start, end) => {
  try {
    const res = await bookingApi.getForBarber(idBarber, start, end);
    return res.data;
  } catch (error) {
    console.error("Error fetching barber bookings:", error);
    throw error;
  }
};

// Hoàn tất booking (upload ảnh)
export const completeBooking = async (idBooking, formData) => {
  try {
    const res = await bookingApi.completeBooking(idBooking, formData);
    return res.data;
  } catch (error) {
    console.error("Error completing booking:", error);
    throw error;
  }
};

// Lấy booked slots của barber theo ngày
export const fetchBookedSlots = async (idBarber, branchId, date) => {
  try {
    const res = await bookingApi.getBookedSlots(idBarber, branchId, date);
    return res.data;
  } catch (error) {
    console.error("Error fetching booked slots:", error);
    throw error;
  }
};

// Tạo booking mới
export const createBooking = async (bookingData) => {
  try {
    const res = await bookingApi.createBooking(bookingData);
    return res.data;
  } catch (error) {
    console.error("Error creating booking:", error);
    throw error;
  }
};
