import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:5001",
  timeout: 10000
});

export async function fetchNotifications({ type, page, limit, priority }) {
  const response = await api.get("/notifications", {
    params: {
      type: type || undefined,
      page,
      limit,
      priority
    }
  });

  return response.data;
}

export async function sendFrontendLog(payload) {
  const response = await api.post("/logs", payload);
  return response.data;
}
