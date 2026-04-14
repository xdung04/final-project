import * as request from "~/apis/configs/httpRequest";

// 📋 Lấy tất cả barber
export const getAllBarbers = async () => {
  try {
    const res = await request.get("/barbers");
    console.log("API getAllBarbers trả về:", res);
    return res;
  } catch (error) {
    console.error(
      "Lỗi khi gọi API getAllBarbers:",
      error.response?.data || error
    );
    throw error.response?.data || error;
  }
};

export const assignUserAsBarber = async ({
  idUser,
  idBranch,
  profileDescription,
}) => {
  try {
    const res = await request.post("/barbers/assign-user", {
      idUser,
      idBranch,
      profileDescription,
    });
    console.log("API assignUserAsBarber trả về:", res);
    return res;
  } catch (error) {
    console.error(
      "Lỗi khi gọi API assignUserAsBarber:",
      error.response?.data || error
    );
    throw error.response?.data || error;
  }
};

export const assignBarberToBranch = async (payload) => {
  try {
    const res = await request.post("/barbers/assign-branch", payload);
    console.log("API assignBarberToBranch trả về:", res);
    return res;
  } catch (error) {
    console.error(
      "Lỗi khi gọi API assignBarberToBranch:",
      error.response?.data || error
    );
    throw error.response?.data || error;
  }
};

export const lockBarber = async (data) => {
  const res = await request.post("/barbers/lock", data);
  return res.data; // 👈 thêm dòng này để return data về frontend
};

export const unlockBarber = async (data) => {
  const res = await request.post("/barbers/unlock", data);
  return res.data;
};

export const getBarberReward = async (idBarber) => {
  try {
    const res = await request.get(`/barbers/reward/${idBarber}`);
    console.log("API getBarberReward trả về:", res);
    return res;
  } catch (error) {
    console.error(
      "Lỗi khi gọi getBarberReward:",
      error.response?.data || error
    );
  }
};
export const createBarberWithUser = async (payload) => {
  try {
    const res = await request.post("/barbers/create", payload);
    console.log("API createBarberWithUser trả về:", res);
    return res;
  } catch (error) {
    console.error(
      "Lỗi khi gọi API createBarberWithUser:",
      error.response?.data || error
    );
    throw error.response?.data || error;
  }
};

export const updateBarber = async (idBarber, payload) => {
  try {
    const res = await request.put(`/barbers/update/${idBarber}`, payload);
    console.log("API updateBarber trả về:", res);
    return res;
  } catch (error) {
    console.error(
      "Lỗi khi gọi API updateBarber:",
      error.response?.data || error
    );
    throw error.response?.data || error;
  }
};
export const deleteBarber = async (idBarber) => {
  try {
    const res = await request.del(`/barbers/delete/${idBarber}`);
    console.log("API deleteBarber trả về:", res);
    return res;
  } catch (error) {
    console.error(
      "Lỗi khi gọi API deleteBarber:",
      error.response?.data || error
    );
    throw error.response?.data || error;
  }
};

export const addUnavailability = async (payload) => {
  try {
    const res = await request.post("/barbers/unavailability", payload);
    console.log("API addUnavailability trả về:", res);
    return res;
  } catch (error) {
    console.error(
      "Lỗi khi gọi API addUnavailability:",
      error.response?.data || error
    );
    throw error.response?.data || error;
  }
};

export const getUnavailabilitiesByBarber = async (idBarber) => {
  try {
    const res = await request.get(`/barbers/unavailability/${idBarber}`);
    console.log("API getUnavailabilitiesByBarber trả về:", res);
    return res;
  } catch (error) {
    console.error(
      "Lỗi khi gọi API getUnavailabilitiesByBarber:",
      error.response?.data || error
    );
    throw error.response?.data || error;
  }
};

export const getProfile = async (idBarber) => {
  try {
    const res = await request.get(`/barbers/profile/${idBarber}`);
    console.log("API getProfile trả về:", res);
    return res;
  } catch (error) {
    console.error("Lỗi khi gọi API getProfile:", error.response?.data || error);
    throw error.response?.data || error;
  }
};

export const updateProfile = async (idBarber, payload, token) => {
  if (!token) {
    throw new Error("Authentication token is required for updating profile.");
  }
  
  try {
    const isFormData = payload instanceof FormData;

    const res = await request.put(`/barbers/profile/${idBarber}`, payload, {
      headers: {
        Authorization: `Bearer ${token}`,
        
        "Content-Type": isFormData
          ? "multipart/form-data"
          : "application/json",
      },
    });

    console.log("API updateProfile trả về:", res.data);
    return res.data;
  } catch (error) {
    console.error(
      "Lỗi khi gọi API updateProfile:",
      error.response?.data || error
    );
    throw error.response?.data || error;
  }
};

export const fetchBarberDashboardStats = async (idBarber, token) => {
  if (!token) {
    throw new Error("Authentication token is required to fetch dashboard stats.");
  }

  try {
    const res = await request.get(`/barbers/stats/${idBarber}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    console.log("API fetchBarberDashboardStats trả về:", res);
    return res; // Giả định res chứa data thống kê trực tiếp
  } catch (error) {
    console.error(
      "Lỗi khi gọi API fetchBarberDashboardStats:",
      error.response?.data || error
    );
    throw error.response?.data || error;
  }
};
export const getBarbersForHome = async () => {
  try {
    const res = await request.get("/barbers/home");
    console.log("API getBarbersForHome trả về:", res);
    return res;
  } catch (error) {
    console.error(
      "Lỗi khi gọi API getBarbersForHome:",
      error.response?.data || error
    );
    throw error.response?.data || error;
  }
};

