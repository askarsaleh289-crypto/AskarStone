import axios from "axios";

export const API_BASE_URL =
  process.env.REACT_APP_API_URL || "http://localhost:5000/api";

export const SERVER_BASE_URL = API_BASE_URL.replace(/\/api\/?$/, "");

export const assetUrl = (path) =>
  `${SERVER_BASE_URL}/${String(path || "").replace(/^\/+/, "")}`;

const API = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000
});
API.interceptors.request.use(config => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default API;

