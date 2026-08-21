import axios from "axios";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
});


// =====================================================
// REQUEST INTERCEPTOR
// =====================================================

api.interceptors.request.use(
  (config) => {

    // =================================================
    // TOKEN
    // =================================================

    if (
      typeof window !== "undefined"
    ) {

      const token =
        localStorage.getItem("token");

      if (token) {

        config.headers.Authorization =
          `Bearer ${token}`;

      }

    }


    // =================================================
    // CONTENT TYPE
    // =================================================
    // FormData ke liye Content-Type manually set nahi
    // karna hai. Browser automatically boundary add karega.
    // =================================================

    if (
      config.data instanceof FormData
    ) {

      delete config.headers["Content-Type"];

    }
    else {

      config.headers["Content-Type"] =
        "application/json";

    }


    return config;

  },
  (error) => {

    return Promise.reject(error);

  }
);


export default api;