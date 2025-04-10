'use client';
import { useState } from "react";
import { useRouter } from "next/navigation";
import api, { API_URL } from "../utils/api";
import axios, { AxiosError } from "axios";

export default function AdminLogin() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (!formData.email || !formData.password) {
        setError('Please fill in all fields');
        setLoading(false);
        return;
      }

      console.log('Attempting login with API URL:', API_URL);
      
      const response = await api.post('auth/login', {
        email: formData.email.toLowerCase().trim(),
        password: formData.password
      });
      
      console.log('Response status:', response.status);
      const data = response.data;
      console.log('Response data:', data);

      if (data.success) {
        if (data.data.user.role !== 'admin') {
          setError('Access Denied: Only administrators can access this dashboard');
          return;
        }

        const token = data.data.token || data.data.accessToken;
        localStorage.setItem('userToken', token);
        localStorage.setItem('userData', JSON.stringify(data.data.user));
        router.push('/dashboard');
      } else {
        setError(data.error || data.message || 'Login failed');
      }
    } catch (err) {
      console.error('Login error:', err);
      // Type guard to handle Axios errors
      if (axios.isAxiosError(err)) {
        const error = err as AxiosError;
        if (error.response) {
          // Server returned an error response
          const errorData = error.response.data as any;
          const errorMessage = errorData?.message || errorData?.error || 'Authentication failed';
          setError(errorMessage);
        } else if (error.request) {
          // Request was made but no response received
          setError('Server is not responding. Please check if the backend is running.');
        } else {
          // Error setting up the request
          setError('Login failed. Please check server connection and try again.');
        }
      } else {
        // Non-Axios error
        setError('Login failed. Please check server connection and try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#0A192F' }}>
      <div className="p-8 rounded-lg shadow-lg w-full max-w-md" style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)' }}>
        <div className="flex flex-col items-center mb-8">
          <h1 className="text-3xl font-bold" style={{ color: '#64FFDA' }}>
            Admin Portal
          </h1>
          <p className="mt-2" style={{ color: '#8892B0' }}>
            Welcome back! Please log in to continue.
          </p>
        </div>
        
        {error && (
          <div className="mb-4 p-3 rounded text-center" style={{ backgroundColor: 'rgba(255, 0, 0, 0.1)', color: '#FF6B6B' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label 
              htmlFor="email" 
              className="block text-sm font-medium mb-2"
              style={{ color: '#CCD6F6' }}
            >
              Admin Email
            </label>
            <input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              required
              className="w-full px-3 py-2 rounded-md focus:outline-none focus:ring-2"
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                color: '#CCD6F6',
                borderColor: 'rgba(255, 255, 255, 0.1)'
              }}
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium mb-2"
              style={{ color: '#CCD6F6' }}
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              value={formData.password}
              onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
              required
              className="w-full px-3 py-2 rounded-md focus:outline-none focus:ring-2"
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                color: '#CCD6F6',
                borderColor: 'rgba(255, 255, 255, 0.1)'
              }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md py-2 px-4 text-sm font-medium transition-colors hover:opacity-90"
            style={{
              backgroundColor: '#64FFDA',
              color: '#0A192F',
            }}
          >
            {loading ? 'Signing in...' : 'Sign in to Dashboard'}
          </button>
        </form>

        <div className="mt-6 text-center text-sm">
          <a
            href="#"
            className="hover:underline hover:underline-offset-4"
            style={{ color: '#64FFDA' }}
          >
            Forgot admin password?
          </a>
        </div>
      </div>
    </div>
  );
}
