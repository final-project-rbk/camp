'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';

interface User {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  role: string;
  isBanned: boolean;
  created_at: string;
  profile_image?: string;
}

interface AdvisorFormular {
  id: number;
  userId: number;
  address: string;
  phoneNumber: string;
  cin: string;
  motivation: string;
  eventTypes: string;
  experience: string;
  status: 'pending' | 'approved' | 'rejected';
  advisor_medium: {
    cinFront: string;
    cinBack: string;
    certificate: string;
    faceImage: string;
  };
  user: {
    first_name: string;
    last_name: string;
    email: string;
  };
}

const API_URL = process.env.NEXT_PUBLIC_API_URL ;

export default function Dashboard() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [formulars, setFormulars] = useState<AdvisorFormular[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedFormular, setSelectedFormular] = useState<AdvisorFormular | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [modalPage, setModalPage] = useState(1);
  const [token, setToken] = useState('');
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const loadDashboardData = async () => {
    try {
      const token = localStorage.getItem('userToken');
      if (!token) {
        router.push('/');
        return;
      }

      setLoading(true);
      setError('');

      // Fetch users first
      try {
        const usersResponse = await fetch(`${API_URL}admin/users`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          }
        });

        const usersData = await usersResponse.json();
        if (usersData.success) {
          setUsers(usersData.data || []);
        } else {
          console.error('Error fetching users:', usersData.message);
        }
      } catch (userError) {
        console.error('Error fetching users:', userError);
        setUsers([]);
      }

      // Fetch advisor applications using the formularAdvisor endpoint
      try {
        console.log('Fetching advisor applications...');
        const formularsResponse = await fetch(`${API_URL}formularAdvisor`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          }
        });

        const formularsData = await formularsResponse.json();
        console.log('Advisor applications response:', formularsData);

        if (formularsData.success) {
          setFormulars(formularsData.data || []);
        } else {
          console.error('Error in advisor applications response:', formularsData.message);
          setError(formularsData.message || 'Failed to fetch advisor applications');
        }
      } catch (formularError) {
        console.error('Error fetching advisor applications:', formularError);
        setFormulars([]);
      }

    } catch (error) {
      console.error('Error loading dashboard data:', error);
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  useEffect(() => {
    const userDataString = localStorage.getItem('userData');
    if (userDataString) {
      const userData = JSON.parse(userDataString);
      setCurrentUser(userData);
    }
  }, []);

  const handleBanUser = async (userId: number) => {
    try {
      const token = localStorage.getItem('userToken');
      const response = await fetch(`${API_URL}admin/users/${userId}/ban`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to update user status');
      }

      // Reload the dashboard data to show updated status
      await loadDashboardData();
    } catch (error) {
      console.error('Error:', error);
      setError(error instanceof Error ? error.message : 'Failed to update user status');
    }
  };

  const handleUpdateRole = async (userId: number, newRole: string) => {
    try {
      const token = localStorage.getItem('userToken');
      const response = await fetch(`${API_URL}users/${userId}/role`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ role: newRole }),
      });

      if (!response.ok) throw new Error('Failed to update user role');
      await loadDashboardData();
    } catch (error) {
      console.error('Error:', error);
      setError('Failed to update user role');
    }
  };

  const handleAdvisorStatus = async (formularId: number, status: 'approved' | 'rejected') => {
    try {
      const token = localStorage.getItem('userToken');
      const response = await fetch(`${API_URL}formularAdvisor/${formularId}/status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update advisor status');
      }

      setShowModal(false);
      await loadDashboardData(); // Reload data after status update
    } catch (error) {
      console.error('Error:', error);
      setError(error instanceof Error ? error.message : 'Failed to update advisor status');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('userToken');
    localStorage.removeItem('userData');
    router.push('/');
  };

  const showFormularDetails = (userId: number) => {
    const formular = formulars.find(f => f.userId === userId);
    if (formular) {
      setSelectedFormular(formular);
      setShowModal(true);
    }
  };

  const filteredUsers = users.filter(user => {
    const searchLower = searchQuery.toLowerCase();
    const fullName = `${user.first_name} ${user.last_name}`.toLowerCase();
    const userId = user.id.toString();
    const matchesSearch = fullName.includes(searchLower) || userId.includes(searchQuery);
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    
    return matchesSearch && matchesRole;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A192F] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#64FFDA]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A192F]">
      <div className="flex h-screen">
        <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
        <div className={`flex-1 transition-all duration-300 ${isSidebarOpen ? 'ml-64' : 'ml-16'}`}>
          <div className="bg-opacity-10 bg-white p-4 flex justify-between items-center">
            <div className="flex items-center">
              <h1 className="text-xl font-bold" style={{ color: '#64FFDA' }}>
                Users Dashboard
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push('/dashboard/adminprofile')}
                className="p-1 rounded-full hover:bg-[#112240] transition-colors duration-200 overflow-hidden"
              >
                {currentUser?.profile_image ? (
                  <img
                    src={currentUser.profile_image}
                    alt="Profile"
                    className="h-8 w-8 rounded-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = 'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y';
                    }}
                  />
                ) : (
                  <div className="h-8 w-8 rounded-full bg-[#112240] flex items-center justify-center text-[#64FFDA]">
                    {currentUser?.first_name?.[0]?.toUpperCase() || (
                      <svg 
                        xmlns="http://www.w3.org/2000/svg" 
                        className="h-5 w-5" 
                        fill="none" 
                        viewBox="0 0 24 24" 
                        stroke="currentColor"
                      >
                        <path 
                          strokeLinecap="round" 
                          strokeLinejoin="round" 
                          strokeWidth={2} 
                          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" 
                        />
                      </svg>
                    )}
                  </div>
                )}
              </button>
            </div>
          </div>
          <div className="p-6">
            {error && (
              <div className="mb-4 p-3 rounded" style={{ backgroundColor: 'rgba(255, 0, 0, 0.1)', color: '#FF6B6B' }}>
                {error}
              </div>
            )}
            <div className="mb-6 flex gap-4">
              <input
                type="text"
                placeholder="Search by name or ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 px-4 py-2 rounded-md focus:outline-none focus:ring-2"
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  color: '#CCD6F6',
                  borderColor: 'rgba(255, 255, 255, 0.1)'
                }}
              />
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="px-4 py-2 rounded-md focus:outline-none focus:ring-2"
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  color: '#CCD6F6',
                  borderColor: 'rgba(255, 255, 255, 0.1)'
                }}
              >
                <option value="all">All Roles</option>
                <option value="user">User</option>
                <option value="advisor">Advisor</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div className="bg-white bg-opacity-10 rounded-lg overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr style={{ backgroundColor: 'rgba(100, 255, 218, 0.1)' }}>
                    <th className="px-6 py-3 text-left text-xs font-medium" style={{ color: '#64FFDA' }}>Profile</th>
                    <th className="px-6 py-3 text-left text-xs font-medium" style={{ color: '#64FFDA' }}>ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium" style={{ color: '#64FFDA' }}>Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium" style={{ color: '#64FFDA' }}>Email</th>
                    <th className="px-6 py-3 text-left text-xs font-medium" style={{ color: '#64FFDA' }}>Role</th>
                    <th className="px-6 py-3 text-left text-xs font-medium" style={{ color: '#64FFDA' }}>Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium" style={{ color: '#64FFDA' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="border-t border-gray-700">
                      <td className="px-6 py-4">
                        <div className="w-10 h-10 rounded-full overflow-hidden">
                          {user.profile_image ? (
                            <img
                              src={user.profile_image}
                              alt={`${user.first_name}'s profile`}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.src = 'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y';
                              }}
                            />
                          ) : (
                            <div 
                              className="w-full h-full flex items-center justify-center bg-gray-700 text-[#64FFDA]"
                            >
                              {user.first_name[0]?.toUpperCase() || '?'}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4" style={{ color: '#CCD6F6' }}>
                        {user.id}
                      </td>
                      <td className="px-6 py-4" style={{ color: '#CCD6F6' }}>
                        {user.first_name} {user.last_name}
                      </td>
                      <td className="px-6 py-4" style={{ color: '#CCD6F6' }}>
                        {user.email}
                      </td>
                      <td className="px-6 py-4">
                        <select
                          value={user.role}
                          onChange={(e) => handleUpdateRole(user.id, e.target.value)}
                          className="px-3 py-1 rounded-md text-sm mr-2"
                          style={{
                            backgroundColor: 'rgba(100, 255, 218, 0.1)',
                            color: '#64FFDA',
                            border: '1px solid #64FFDA'
                          }}
                        >
                          <option value="user">User</option>
                          <option value="advisor">Advisor</option>
                          <option value="admin">Admin</option>
                        </select>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-2 py-1 rounded-full text-xs ${
                            user.isBanned 
                              ? 'bg-red-900 bg-opacity-20 text-red-400'
                              : 'bg-green-900 bg-opacity-20 text-green-400'
                          }`}
                        >
                          {user.isBanned ? 'Banned' : 'Active'}
                        </span>
                      </td>
                      <td className="px-6 py-4 space-x-2">
                        <button
                          onClick={() => handleBanUser(user.id)}
                          className="px-3 py-1 rounded-md text-sm mr-2"
                          style={{
                            backgroundColor: user.isBanned ? '#4CAF50' : '#FF6B6B',
                            color: '#0A192F'
                          }}
                        >
                          {user.isBanned ? 'Unban' : 'Ban'}
                        </button>
                        {formulars.some(f => f.userId === user.id) && (
                          <button
                            onClick={() => showFormularDetails(user.id)}
                            className="px-3 py-1 rounded-md text-sm"
                            style={{ backgroundColor: '#64FFDA', color: '#0A192F' }}
                          >
                            Advisor Demand
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          {showModal && selectedFormular && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
              <div className="bg-[#0A192F] rounded-lg p-6 max-w-2xl w-full">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold text-[#64FFDA]">
                    Advisor Application Details - {modalPage === 1 ? 'Personal Info' : 'Documents'}
                  </h2>
                  <div className="flex items-center space-x-2">
                    <span className="text-[#8892B0]">Page {modalPage} of 2</span>
                  </div>
                </div>
                {modalPage === 1 ? (
                  <div className="space-y-4 text-[#CCD6F6]">
                    <p><strong>Name:</strong> {selectedFormular.user.first_name} {selectedFormular.user.last_name}</p>
                    <p><strong>Email:</strong> {selectedFormular.user.email}</p>
                    <p><strong>Phone:</strong> {selectedFormular.phoneNumber}</p>
                    <p><strong>Address:</strong> {selectedFormular.address}</p>
                    <p><strong>CIN:</strong> {selectedFormular.cin}</p>
                    <p><strong>Event Types:</strong> {selectedFormular.eventTypes}</p>
                    <p><strong>Experience:</strong> {selectedFormular.experience}</p>
                    <p><strong>Motivation:</strong> {selectedFormular.motivation}</p>
                    <p>
                      <strong>Status:</strong> 
                      <span className={`ml-2 px-2 py-1 rounded-full text-xs ${
                        selectedFormular.status === 'approved' 
                          ? 'bg-green-900 bg-opacity-20 text-green-400'
                          : selectedFormular.status === 'rejected'
                          ? 'bg-red-900 bg-opacity-20 text-red-400'
                          : 'bg-yellow-900 bg-opacity-20 text-yellow-400'
                      }`}>
                        {selectedFormular.status.charAt(0).toUpperCase() + selectedFormular.status.slice(1)}
                      </span>
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-4">
                    {selectedFormular.advisor_medium.cinFront && (
                      <div>
                        <p className="text-[#CCD6F6] mb-2">CIN Front:</p>
                        <img 
                          src={selectedFormular.advisor_medium.cinFront} 
                          alt="CIN Front" 
                          className="w-full h-48 object-cover rounded-lg"
                        />
                      </div>
                    )}
                    {selectedFormular.advisor_medium.cinBack && (
                      <div>
                        <p className="text-[#CCD6F6] mb-2">CIN Back:</p>
                        <img 
                          src={selectedFormular.advisor_medium.cinBack} 
                          alt="CIN Back" 
                          className="w-full h-48 object-cover rounded-lg"
                        />
                      </div>
                    )}
                    {selectedFormular.advisor_medium.faceImage && (
                      <div>
                        <p className="text-[#CCD6F6] mb-2">Profile Photo:</p>
                        <img 
                          src={selectedFormular.advisor_medium.faceImage} 
                          alt="Profile Photo" 
                          className="w-full h-48 object-cover rounded-lg"
                        />
                      </div>
                    )}
                    {selectedFormular.advisor_medium.certificate && (
                      <div>
                        <p className="text-[#CCD6F6] mb-2">Certificate:</p>
                        <img 
                          src={selectedFormular.advisor_medium.certificate} 
                          alt="Certificate" 
                          className="w-full h-48 object-cover rounded-lg"
                        />
                      </div>
                    )}
                  </div>
                )}
                <div className="mt-6 flex justify-between">
                  <div className="flex space-x-2">
                    {modalPage === 2 && (
                      <button
                        onClick={() => setModalPage(1)}
                        className="px-4 py-2 rounded-md bg-[#112240] text-[#64FFDA] hover:bg-opacity-80"
                      >
                        Previous
                      </button>
                    )}
                    {modalPage === 1 && (
                      <button
                        onClick={() => setModalPage(2)}
                        className="px-4 py-2 rounded-md bg-[#112240] text-[#64FFDA] hover:bg-opacity-80"
                      >
                        Next
                      </button>
                    )}
                  </div>
                  <div className="flex space-x-2">
                    {selectedFormular.status === 'pending' && (
                      <>
                        <button
                          onClick={() => handleAdvisorStatus(selectedFormular.id, 'approved')}
                          className="px-4 py-2 rounded-md bg-green-500 text-white hover:bg-green-600"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleAdvisorStatus(selectedFormular.id, 'rejected')}
                          className="px-4 py-2 rounded-md bg-red-500 text-white hover:bg-red-600"
                        >
                          Reject
                        </button>
                      </>
                    )}
                    {(() => {
                      const user = users.find(u => u.id === selectedFormular.userId);
                      if (user) {
                        if (user.role === 'user') {
                          return (
                            <button
                              onClick={() => handleAdvisorStatus(selectedFormular.id, 'approved')}
                              className="px-4 py-2 rounded-md bg-green-500 text-white hover:bg-green-600"
                            >
                              Accept Demand
                            </button>
                          );
                        } else if (user.role === 'advisor') {
                          return (
                            <button
                              onClick={() => {
                                handleUpdateRole(user.id, 'user');
                                setShowModal(false);
                                setModalPage(1);
                              }}
                              className="px-4 py-2 rounded-md bg-yellow-500 text-white hover:bg-yellow-600"
                            >
                              Switch to User
                            </button>
                          );
                        }
                      }
                      return null;
                    })()}
                    <button
                      onClick={() => {
                        setShowModal(false);
                        setModalPage(1);
                      }}
                      className="px-4 py-2 rounded-md bg-[#64FFDA] text-[#0A192F] hover:opacity-90"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 