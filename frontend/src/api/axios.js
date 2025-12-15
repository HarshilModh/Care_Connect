import axios from 'axios';
// import 'dotenv/config';
import { auth } from '../firebase';
    
//Base setup
const api = axios.create({
    baseURL: (import.meta.env.VITE_API_URL || "http://localhost:3000/api") + "/",
    // note the trailing slash ↑
    withCredentials: true,
});


api.interceptors.request.use(
    async (config) => {
        // Get current user's token
        await auth.authStateReady();
        const user = auth.currentUser;
        if (user) {
            const token = await user.getIdToken();
            config.headers.Authorization = `Bearer ${token}`;
        } else {
            const token = localStorage.getItem("accessToken");
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }
        }
        console.log(config);

        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);


api.interceptors.response.use(
    (response) => response,
   (error) => {
    console.log(error);
    if (error.response?.status === 401) {
        console.log('Unauthorized user may need to log in');
        
        // Clear session storage
        localStorage.removeItem("user");
        localStorage.removeItem("accessToken");
        localStorage.removeItem("tokenExpiry");
        
        // Force redirect to signin
        // Using window.location instead of useNavigate because this file is outside React context
        window.location.href = '/signin';
    }
    return Promise.reject(error);
});
api.isCancel = axios.isCancel;
export default api;