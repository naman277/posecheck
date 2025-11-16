import axios from "axios";

const base = import.meta.env.DEV ? "http://localhost:5000" : "";

const instance = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000",
  headers: { "Content-Type": "application/json" }
});


export default axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000"
});
