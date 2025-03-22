'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import { Ionicons } from '@expo/vector-icons';

interface User {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  profile_image?: string;
  bio?: string;
  created_at: string;
}

export default function AdminProfile() {
  const router = useRouter();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [userData, setUserData] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState<Partial<User>>({});
  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  useEffect(() => {
    fetchUserData();
  }, []);

  useEffect(() => {
    if (userData) {
      setFormData({
        first_name: userData.first_name,
        last_name: userData.last_name,
        email: userData.email,
        phone: userData.phone || '',
        bio: userData.bio || '',
      });
    }
  }, [userData]);

  const fetchUserData = async () => {
    try {
      const token = localStorage.getItem('userToken');
      const storedUserData = localStorage.getItem('userData');
      if (storedUserData) {
        const user = JSON.parse(storedUserData);
        const response = await fetch(`${API_URL}users/${user.id}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
        
        if (response.ok) {
          const data = await response.json();
          setUserData(data.data);
        }
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSaveAll = async () => {
    try {
      const token = localStorage.getItem('userToken');
      const storedUserData = localStorage.getItem('userData');
      
      if (!storedUserData || !token) {
        router.push('/auth');
        return;
      }

      const user = JSON.parse(storedUserData);
      const response = await fetch(`${API_URL}users/${user.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });
      
      const data = await response.json();
      if (data.success) {
        setUserData(data.data);
        localStorage.setItem('userData', JSON.stringify(data.data));
        await fetchUserData();
      }
    } catch (error) {
      console.error('Update error:', error);
    }
  };

  const handleLogout = async () => {
    try {
      localStorage.removeItem('userToken');
      localStorage.removeItem('userData');
      router.push('/auth');
    } catch (error) {
      console.error('Logout error:', error);
      alert('Failed to logout');
    }
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const file = event.target.files?.[0];
      if (!file) return;

      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', 'Ghassen123');
      formData.append('cloud_name', 'dqh6arave');

      const response = await fetch(
        'https://api.cloudinary.com/v1_1/dqh6arave/image/upload',
        {
          method: 'POST',
          body: formData,
        }
      );

      const data = await response.json();
      
      if (data.secure_url) {
        const token = localStorage.getItem('userToken');
        const storedUserData = localStorage.getItem('userData');
        
        if (!storedUserData || !token) {
          router.push('/auth');
          return;
        }

        const user = JSON.parse(storedUserData);
        const updateResponse = await fetch(`${API_URL}users/${user.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({ profile_image: data.secure_url }),
        });
        
        const updateData = await updateResponse.json();
        if (updateData.success) {
          setUserData(updateData.data);
          localStorage.setItem('userData', JSON.stringify(updateData.data));
          await fetchUserData();
        }
      }
    } catch (error) {
      console.error('Upload error:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center" style={{ backgroundColor: '#0A192F' }}>
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#64FFDA]"></div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen" style={{ backgroundColor: '#0A192F' }}>
      <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />

      <div className={`flex-1 transition-all duration-300 ${isSidebarOpen ? 'ml-64' : 'ml-16'}`}>
        <div className="p-8">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-2xl font-bold text-[#64FFDA]">Admin Profile</h1>
            <button
              onClick={handleLogout}
              className="text-[#64FFDA] hover:text-opacity-80"
            >
              Logout
            </button>
          </div>

          <div className="bg-[#112240] rounded-lg p-6 shadow-lg mb-6">
            <div className="flex flex-col items-center mb-6">
              <div className="relative">
                <div className="w-32 h-32 rounded-full bg-[#64FFDA] flex items-center justify-center overflow-hidden mb-4">
                  {userData?.profile_image ? (
                    <img
                      src={userData.profile_image}
                      alt="Profile"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-[#0A192F] text-4xl font-semibold">
                      {userData?.first_name?.[0]?.toUpperCase() || 'A'}
                    </span>
                  )}
                </div>
                <label 
                  htmlFor="image-upload" 
                  className="absolute bottom-4 right-0 w-8 h-8 bg-[#1D2D50] rounded-full flex items-center justify-center cursor-pointer hover:bg-opacity-80 transition-all duration-200"
                >
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    className="h-5 w-5 text-[#64FFDA]" 
                    fill="none" 
                    viewBox="0 0 24 24" 
                    stroke="currentColor"
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth={2} 
                      d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" 
                    />
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth={2} 
                      d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" 
                    />
                  </svg>
                </label>
                <input
                  id="image-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </div>
            </div>

            <div className="space-y-4">
              {[
                { label: 'First Name', field: 'first_name' },
                { label: 'Last Name', field: 'last_name' },
                { label: 'Email', field: 'email' },
                { label: 'Phone', field: 'phone' },
                { label: 'Bio', field: 'bio' },
              ].map((item) => (
                <div key={item.field} className="flex flex-col space-y-2">
                  <label className="text-sm text-[#8892B0]">{item.label}</label>
                  <input
                    type="text"
                    value={formData[item.field as keyof User] || ''}
                    onChange={(e) => handleInputChange(item.field, e.target.value)}
                    className="w-full bg-[#1D2D50] p-2 rounded-lg text-[#CCD6F6] border border-[#1D2D50] focus:border-[#64FFDA] focus:outline-none"
                  />
                </div>
              ))}
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={handleSaveAll}
                className="px-6 py-2 bg-[#64FFDA] text-[#0A192F] rounded-lg hover:bg-opacity-80 font-semibold transition-all duration-200"
              >
                Save Changes
              </button>
            </div>
          </div>

          <div className="bg-[#112240] rounded-lg p-6 shadow-lg">
            <h2 className="text-lg font-bold text-[#64FFDA] mb-4">Stats</h2>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-[#8892B0]">Member since</span>
                <span className="text-[#CCD6F6]">
                  {new Date(userData?.created_at || '').toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}