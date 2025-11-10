import axios from 'axios';
// import 'dotenv/config';
import { auth } from '../firebase';

//Base setup
const api = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api', // your backend base URL
    withCredentials: true,
});


api.interceptors.request.use(
    async (config) => {
        // Get current user's token
        const user = auth.currentUser;
        if (user) {
            const token = await user.getIdToken();
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);


api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            console.log('Unauthorized user may need to log in');
        }
        return Promise.reject(error);
    }
);
export default api;