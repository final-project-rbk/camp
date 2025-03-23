import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthState, User } from '../types/auth';
import AuthService from '../services/auth.service';
import { jwtDecode } from 'jwt-decode';

interface AuthContextType extends AuthState {
  signIn: (token: string, user: User) => Promise<void>;
  signOut: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    isLoading: true,
    accessToken: null,
    user: null,
  });

  useEffect(() => {
    // Check for token when the app initializes
    const bootstrapAsync = async () => {
      try {
        const userToken = await AsyncStorage.getItem('userToken');
        console.log('Initial token check:', userToken ? 'Token exists' : 'No token');
        
        if (userToken) {
          try {
            // Validate token
            const decoded = jwtDecode(userToken);
            const currentTime = Date.now() / 1000;
            
            // Check if token is expired
            if (decoded.exp && decoded.exp < currentTime) {
              console.log('Token expired, logging out');
              await AsyncStorage.removeItem('userToken');
              setState({ isLoading: false, accessToken: null, user: null });
              return;
            }
            
            // Get user data
            const userData = await AsyncStorage.getItem('userData');
            const user = userData ? JSON.parse(userData) : null;
            
            // Initialize auth service with the existing token
            await AuthService.storeAuthData({
              token: userToken,
              user
            });
            
            setState({
              isLoading: false,
              accessToken: userToken,
              user: user,
            });
          } catch (e) {
            console.error('Error validating token:', e);
            await AsyncStorage.removeItem('userToken');
            setState({ isLoading: false, accessToken: null, user: null });
          }
        } else {
          setState({ isLoading: false, accessToken: null, user: null });
        }
      } catch (e) {
        console.error('Error bootstrapping auth:', e);
        setState({ isLoading: false, accessToken: null, user: null });
      }
    };

    bootstrapAsync();
  }, []);

  const loadStoredAuth = async () => {
    try {
      // Initialize auth service and get stored data
      await AuthService.initialize();
      const token = await AuthService.getToken();
      const user = await AuthService.getUser();

      if (token && user) {
        setState({
          accessToken: token,
          user,
          isLoading: false,
        });
      } else {
        setState({
          ...state,
          isLoading: false,
        });
      }
    } catch (error) {
      console.error('Error loading auth state:', error);
      setState({
        ...state,
        isLoading: false,
      });
    }
  };

  const signIn = async (token: string, user: User) => {
    try {
      // Store auth data using AuthService
      await AuthService.storeAuthData({
        token,
        user,
      });

      setState({
        accessToken: token,
        user,
        isLoading: false,
      });
    } catch (error) {
      console.error('Error storing auth state:', error);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      // Clear auth data using AuthService
      await AuthService.clearAuthData();

      setState({
        accessToken: null,
        user: null,
        isLoading: false,
      });
    } catch (error) {
      console.error('Error removing auth state:', error);
      throw error;
    }
  };

  const checkAuth = async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true }));
      
      // Initialize auth service and get stored data
      await AuthService.initialize();
      const token = await AuthService.getToken();
      const user = await AuthService.getUser();

      if (token && user) {
        setState({
          accessToken: token,
          user,
          isLoading: false,
        });
      } else {
        setState({
          accessToken: null,
          user: null,
          isLoading: false,
        });
      }
    } catch (error) {
      console.error('Error checking auth state:', error);
      setState({
        accessToken: null,
        user: null,
        isLoading: false,
      });
    }
  };

  return (
    <AuthContext.Provider
      value={{
        ...state,
        signIn,
        signOut,
        checkAuth
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
} 