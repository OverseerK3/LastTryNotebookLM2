// API Configuration
// Automatically switches between local development and production

export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

console.log('🌐 API Base URL:', API_BASE_URL);
