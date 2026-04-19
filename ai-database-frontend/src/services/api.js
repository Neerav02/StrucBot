import axios from 'axios';
import { useAuthStore } from '../stores/authStore';

let baseURL = import.meta.env.VITE_API_URL || '/api';
if (baseURL.startsWith('http') && !baseURL.endsWith('/api')) {
  baseURL = baseURL.replace(/\/$/, '') + '/api';
}

const api = axios.create({ baseURL });

// THIS PART IS THE SAME
api.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token;
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// --- ADD THIS NEW RESPONSE INTERCEPTOR ---
api.interceptors.response.use(
  (response) => response, // Directly return successful responses
  (error) => {
    // Check if the error is due to authentication (401 or 403)
    if (error.response && [401, 403].includes(error.response.status)) {
      console.log('Authentication error, logging out...');
      // Use the logout function from your authStore to clear user and token
      useAuthStore.getState().logout(); 
      // Optionally redirect to the login page
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);


export default api;