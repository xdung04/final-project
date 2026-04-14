import axios from "axios";

const API_URL = process.env.REACT_APP_API_BASE_URL + "/customer-galleries";
const customerGalleryApi = {
  getByBarber: (barberId) => axios.get(`${API_URL}/barber/${barberId}`),
  getByCustomer: (token) =>
    axios.get(`${API_URL}/customer`, {
      headers: { Authorization: `Bearer ${token}` },
    }),
};

export default customerGalleryApi;
