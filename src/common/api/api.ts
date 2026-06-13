//src/common/api/api.ts
import axios from "axios";

export const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8050";

export const api = axios.create({
  baseURL: API_URL,
  withCredentials: true, // ✅ Cookies HttpOnly
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});
