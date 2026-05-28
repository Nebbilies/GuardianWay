import axios, {AxiosError, AxiosResponse, InternalAxiosRequestConfig} from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

const axiosInstance = axios.create({
    baseURL: API_BASE_URL,
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json',
    },
});

axiosInstance.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
        // attach token from localStorage or smth
        return config;
    },
    (error: AxiosError) => {
        return Promise.reject(error);
    }
);

axiosInstance.interceptors.response.use(
    (response: AxiosResponse) => response.data,
    (error: AxiosError<{ detail?: string; message?: string }>) => {
        const data = error.response?.data;
        const message = data?.detail || data?.message || 'Có lỗi xảy ra. Vui lòng thử lại.';
        return Promise.reject({ ...error, message });
    }
);

export default axiosInstance;