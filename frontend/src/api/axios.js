import axios from 'axios';
// import 'dotenv/config';

//Base setup
const api = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api', // your backend base URL
    withCredentials: true,
});
export default api;