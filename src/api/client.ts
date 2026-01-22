import axios from "axios";
import { getAccessToken } from "../auth/tokenStore";

export const API_BASE = `${import.meta.env.VITE_API_URL}/api`;

export const api = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const t = getAccessToken();
  if (t) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${t}`;
  }

  return config;
});
