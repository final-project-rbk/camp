export const EXPO_PUBLIC_API_URL = __DEV__
  ? 'http://192.168.1.17:3000/api/'  // Replace X with your local IP
  : 'https://your-production-api.com/api/';

export const EXPO_PUBLIC_BASE_URL = __DEV__
  ? 'http://192.168.1.17:3000/'  // Same IP without /api/
  : 'https://your-production-api.com/';

// You can find your IP address by:
// Windows: ipconfig in cmd
// Mac/Linux: ipconfig getifaddr en0 in terminal