import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { EXPO_PUBLIC_API_URL } from '../config';

const AUTH_KEYS = {
  TOKEN: 'userToken',
  REFRESH_TOKEN: 'refreshToken',
  USER_DATA: 'userData'
};

interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
}

interface AuthData {
  token?: string;
  accessToken?: string;
  refreshToken?: string;
  user?: any;
}

class AuthService {
  private static instance: AuthService;
  private tokens: AuthTokens | null = null;
  private user: User | null = null;

  private constructor() {}

  public static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  async initialize() {
    try {
      const [token, userStr] = await Promise.all([
        AsyncStorage.getItem(AUTH_KEYS.TOKEN),
        AsyncStorage.getItem(AUTH_KEYS.USER_DATA)
      ]);

      if (token) {
        this.tokens = { accessToken: token, refreshToken: '' };
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      }
      
      if (userStr) {
        this.user = JSON.parse(userStr);
      }
    } catch (error) {
      console.error('Error initializing auth service:', error);
    }
  }

  async login(email: string, password: string) {
    try {
      const response = await axios.post(`${EXPO_PUBLIC_API_URL}auth/login`, {
        email,
        password
      });

      const { accessToken, refreshToken } = response.data.data;
      const user = response.data.data.user;

      await this.setTokens({ accessToken, refreshToken });
      await this.setUser(user);

      return user;
    } catch (error) {
      throw error;
    }
  }

  async refreshToken() {
    try {
      if (!this.tokens?.refreshToken) throw new Error('No refresh token');

      const response = await axios.post(`${EXPO_PUBLIC_API_URL}auth/refresh-token`, {
        refreshToken: this.tokens.refreshToken
      });

      const { accessToken, refreshToken } = response.data.data;
      await this.setTokens({ accessToken, refreshToken });

      return accessToken;
    } catch (error) {
      await this.logout();
      throw error;
    }
  }

  async logout() {
    try {
      if (this.tokens?.accessToken) {
        await axios.post(`${EXPO_PUBLIC_API_URL}auth/logout`);
      }
    } catch (error) {
      console.error('Error during logout:', error);
    } finally {
      await this.clearAuth();
    }
  }

  private async setTokens(tokens: AuthTokens) {
    this.tokens = tokens;
    axios.defaults.headers.common['Authorization'] = `Bearer ${tokens.accessToken}`;
    await AsyncStorage.setItem(AUTH_KEYS.TOKEN, tokens.accessToken);
    if (tokens.refreshToken) {
      await AsyncStorage.setItem(AUTH_KEYS.REFRESH_TOKEN, tokens.refreshToken);
    }
  }

  private async setUser(user: User) {
    this.user = user;
    await AsyncStorage.setItem(AUTH_KEYS.USER_DATA, JSON.stringify(user));
  }

  private async clearAuth() {
    this.tokens = null;
    this.user = null;
    delete axios.defaults.headers.common['Authorization'];
    await Promise.all([
      AsyncStorage.removeItem(AUTH_KEYS.TOKEN),
      AsyncStorage.removeItem(AUTH_KEYS.REFRESH_TOKEN),
      AsyncStorage.removeItem(AUTH_KEYS.USER_DATA)
    ]);
  }

  getAccessToken() {
    return this.tokens?.accessToken;
  }

  isAuthenticated() {
    return !!this.tokens?.accessToken;
  }

  public async storeAuthData(data: AuthData): Promise<void> {
    try {
      const token = data.accessToken || data.token;
      if (token) {
        await this.setTokens({ 
          accessToken: token, 
          refreshToken: data.refreshToken || '' 
        });
      }

      if (data.user) {
        await this.setUser(data.user);
      }

      // Update axios headers
      if (token) {
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('Error storing auth data:', error);
      throw error;
    }
  }

  public async clearAuthData(): Promise<void> {
    await this.clearAuth();
  }

  public async getToken(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(AUTH_KEYS.TOKEN);
    } catch (error) {
      console.error('Error getting token:', error);
      return null;
    }
  }

  public async getUser(): Promise<any | null> {
    try {
      const userData = await AsyncStorage.getItem(AUTH_KEYS.USER_DATA);
      
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error('Error getting user data:', error);
      return null;
    }

  }
  
}

export default AuthService.getInstance(); 