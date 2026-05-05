import axios from "axios";

const API_URL = process.env.REACT_APP_API_BASE_URL + "/calendar";

const calendarApi = {
  getAuthUrl: (token, returnUrl) =>
    axios.get(`${API_URL}/google/link`, {
      headers: { Authorization: `Bearer ${token}` },
      params: { returnUrl }
    }),
  getStatus: (token) =>
    axios.get(`${API_URL}/status`, {
      headers: { Authorization: `Bearer ${token}` },
    }),
  unlink: (token) =>
    axios.delete(`${API_URL}/unlink`, {
      headers: { Authorization: `Bearer ${token}` },
    }),
};

export default calendarApi;