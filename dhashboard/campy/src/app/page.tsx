'use client';
import { useState } from "react";
import { useRouter } from "next/navigation";

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://192.168.1.15:3000/api/';

interface FetchOptions extends RequestInit {
  headers?: Record<string, string>;
}

// Utility function for authenticated API calls
const authenticatedFetch = async (endpoint: string, options: FetchOptions = {}) => {
  const token = localStorage.getItem('userToken');
  console.log('Retrieved token:', token);
  
  if (!token) {
    console.error('No token found in localStorage');
    throw new Error('No authentication token found');
  }

  const headers = {
    ...options.headers,
    'Authorization': `Bearer ${token}`
  };
  console.log('Request headers:', headers);

  try {
    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('API request failed:', error);
      throw new Error(error.error || 'API request failed');
    }

    return response.json();
  } catch (error) {
    console.error('Fetch error:', error);
    throw error;
  }
};

export default function AdminLogin() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      if (!formData.email || !formData.password) {
        setError('Please fill in all fields');
        return;
      }

      const response = await fetch(`${API_URL}auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          email: formData.email.toLowerCase().trim(),
          password: formData.password
        }),
      });

      const data = await response.json();

      if (data.success) {
        console.log('Login response:', data);
        const token = data.data.accessToken;
        console.log('Token to be stored:', token);
        
        // Verify token is not undefined or null
        if (!token) {
          throw new Error('No token received from server');
        }
        
        // Store token
        localStorage.setItem('userToken', token);
        
        // Verify token was stored correctly
        const storedToken = localStorage.getItem('userToken');
        console.log('Stored token:', storedToken);
        
        if (!storedToken) {
          throw new Error('Failed to store token');
        }
        
        localStorage.setItem('userData', JSON.stringify(data.data.user));
        router.push('/dashboard');
      } else {
        setError(data.error || 'Login failed');
      }
    } catch (error) {
      console.error('Login error:', error);
      setError('Login failed. Please check your credentials.');
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
            className="w-full rounded-md py-2 px-4 text-sm font-medium transition-colors hover:opacity-90"
            style={{
              backgroundColor: '#64FFDA',
              color: '#0A192F',
            }}
          >
            Sign in to Dashboard
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
