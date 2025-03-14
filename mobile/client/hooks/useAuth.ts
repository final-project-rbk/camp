import { useState, useEffect } from 'react';
import authService from '../services/auth.service';

export const useAuth = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [user, setUser] = useState<any>(null);

  const checkAuth = async () => {
    try {
      const token = await authService.getToken();
      const userData = await authService.getUser();
      
      setIsAuthenticated(!!token);
      setUser(userData);
    } catch (error) {
      console.error('Auth check error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  return {
    isAuthenticated,
    isLoading,
    user,
    checkAuth
  };
}; 