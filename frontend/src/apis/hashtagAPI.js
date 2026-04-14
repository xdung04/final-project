import axios from "axios";

const API_URL = process.env.REACT_APP_API_BASE_URL + "/hashtags";

const hashtagApi = {
  getSuggestions: (query) => axios.get(`${API_URL}?q=${encodeURIComponent(query)}`),
  getTopHashtags: () => axios.get(`${API_URL}/top`),
};

export default hashtagApi;
