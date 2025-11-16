// frontend/src/utils/api.js
import axios from "axios";

const base = import.meta.env.VITE_API_URL || "http://localhost:5000";

console.log("API baseURL =", base);

const instance = axios.create({
  baseURL: base,
  headers: { "Content-Type": "application/json" },
  // do not set Authorization here statically
});

// ensure every request reads the latest token from localStorage
instance.interceptors.request.use(
  (config) => {
    try {
      const token = localStorage.getItem("token");
      if (token) {
        config.headers = config.headers || {};
        config.headers.Authorization = `Bearer ${token}`;
      } else {
        // ensure Authorization removed when no token
        if (config.headers && config.headers.Authorization) delete config.headers.Authorization;
      }
    } catch (e) {
      // safe fallback
      console.warn("Failed to attach auth token to request", e);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default instance;
