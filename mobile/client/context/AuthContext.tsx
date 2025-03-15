import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthState, User } from '../types/auth';
import AuthService from '../services/auth.service';

interface AuthContextType extends AuthState {
  signIn: (token: string, user: User) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    isLoading: true,
    accessToken: null,
    user: null,
  });

  useEffect(() => {
    // Load stored authentication state
    loadStoredAuth();
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

  return (
    <AuthContext.Provider
      value={{
        ...state,
        signIn,
        signOut,
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