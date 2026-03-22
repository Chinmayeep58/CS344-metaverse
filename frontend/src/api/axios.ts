import axios from "axios";

const API_BASE_URL =
    import.meta.env.VITE_API_BASE_URL || "https://cs344-metaverse-1.onrender.com/api";

const api = axios.create({
    baseURL: API_BASE_URL,
    timeout: 30000,
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem("auth_token");
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export default api;
