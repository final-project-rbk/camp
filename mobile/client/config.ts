export const EXPO_PUBLIC_BASE_URL = __DEV__
  ? 'http://192.168.1.17:3000'  // Replace with your local IP
  : 'https://your-production-api.com';

export const EXPO_PUBLIC_API_URL = `${EXPO_PUBLIC_BASE_URL}/api/`;

// You can find your IP address by:
// Windows: ipconfig in cmd
// Mac/Linux: ifconfig in terminal 
