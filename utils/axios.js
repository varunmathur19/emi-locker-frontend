import axios from "axios";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
});

// ===============================
// REQUEST INTERCEPTOR
// ===============================
api.interceptors.request.use(
  (config) => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("token");

      if (token) {
        config.headers = config.headers || {};
        config.headers.Authorization = `Bearer ${token}`;
      }
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// ===============================
// RESPONSE INTERCEPTOR
// ===============================
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    const status = error?.response?.status;
    const maintenance =
      error?.response?.data?.maintenance;

    console.log("API ERROR:", {
      status,
      maintenance,
      skipMaintenanceRedirect:
        error?.config?.skipMaintenanceRedirect,
    });

    // ==========================================
    // Maintenance status check ko redirect
    // nahi karna hai
    // ==========================================
    if (error?.config?.skipMaintenanceRedirect) {
      return Promise.reject(error);
    }

    // ==========================================
    // Maintenance Mode
    // ==========================================
    if (
      status === 503 &&
      maintenance === true &&
      typeof window !== "undefined"
    ) {
      if (
        window.location.pathname !== "/maintenance"
      ) {
        window.location.replace("/maintenance");
      }
    }

    return Promise.reject(error);
  }
);

export default api;