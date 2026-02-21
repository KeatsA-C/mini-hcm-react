const isDevelopment = import.meta.env.DEV;

// Automatically switch between development and production API URLs
export const API_BASE_URL = isDevelopment
  ? import.meta.env.VITE_API_LOCAL_URL || 'http://localhost:5000'
  : import.meta.env.VITE_API_BASE_URL || 'https://railway.app';

// Log current environment configuration (helpful for debugging)
if (isDevelopment) {
  console.log(' Development Mode');
  console.log('API URL:', API_BASE_URL);
}
