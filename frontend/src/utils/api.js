import axios from "axios";

const base = import.meta.env.DEV ? "http://localhost:5000" : "";

const instance = axios.create({
  baseURL: base
});

export default instance;
