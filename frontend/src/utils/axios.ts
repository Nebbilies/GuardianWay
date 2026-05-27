import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

const axiosInstance = axios.create({
    baseURL: API_BASE_URL,
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json',
    },
});

axiosInstance.interceptors.request.use(
    (config: any) => {
        // attach token from localStorage or smth
        return config;
    },
    (error: Error) => {
        return Promise.reject(error);
    }
);

axiosInstance.interceptors.response.use(
    (response: any) => response.data,
    (error: any) => {
        const data = error.response?.data;
        const message = data?.detail || data?.message || 'Có lỗi xảy ra. Vui lòng thử lại.';
        return Promise.reject({ ...error, message });
    }
);

export default axiosInstance;