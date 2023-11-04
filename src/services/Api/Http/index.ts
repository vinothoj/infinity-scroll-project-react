import axios from "axios";

const API_URL = "http://localhost:4000";
const API_BASE = "/api";
const BaseUrl = `${API_URL}${API_BASE}`;

export const Http = axios.create({
  baseURL: BaseUrl,
});

// Http.interceptors.request.use(
//   async (conf) => {
//     conf.headers["Access-Control-Allow-Origin"] = "*";
//     conf.headers["Access-Control-Allow-Credentials"] = "true";
//     conf.headers["Content-Type"] = "application/json";
//     return conf;
//   },
//   (error) => Promise.reject(error)
// );

Http.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 404) {
      console.log("Error");
    }
    return Promise.reject(error.response ? error.response : error);
  }
);
