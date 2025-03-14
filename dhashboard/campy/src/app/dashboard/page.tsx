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

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://192.168.1.15:3000/api/';

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
  const [userData, setUserData] = useState(null);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  useEffect(() => {
    const fetchUserData = async () => {
      const token = localStorage.getItem('userToken');
      if (!token) {
        router.push('/');
        return;
      }

      try {
        const storedUserData = localStorage.getItem('userData');
        if (storedUserData) {
          setUserData(JSON.parse(storedUserData));
        }

        // Fetch user data from API if needed
        const response = await fetch(`${API_URL}users/me`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          const data = await response.json();
          setUserData(data.data);
          localStorage.setItem('userData', JSON.stringify(data.data));
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    };

    fetchUserData();
    fetchUsers();
    fetchAdvisorFormulars();
  }, []);

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('userToken');
      const response = await fetch(`${API_URL}users`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) throw new Error('Failed to fetch users');
      const data = await response.json();
      setUsers(data.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching users:', error);
      setError('Failed to load users');
      setLoading(false);
    }
  };

  const fetchAdvisorFormulars = async () => {
    try {
      const token = localStorage.getItem('userToken');
      const response = await fetch(`${API_URL}formularAdvisor`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) throw new Error('Failed to fetch advisor applications');
      const data = await response.json();
      setFormulars(data.data);
    } catch (error) {
      console.error('Error fetching advisor applications:', error);
      setError('Failed to load advisor applications');
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

      if (!response.ok) throw new Error('Failed to update advisor status');
      
      setShowModal(false);
      fetchUsers();
      fetchAdvisorFormulars();
    } catch (error) {
      console.error('Error updating advisor status:', error);
      setError('Failed to update advisor status');
    }
  };

  const handleBanUser = async (userId: number) => {
    try {
      const token = localStorage.getItem('userToken');
      const response = await fetch(`${API_URL}users/${userId}/ban`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) throw new Error('Failed to update user status');
      fetchUsers();
    } catch (error) {
      console.error('Error updating user:', error);
      setError('Failed to update user status');
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
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#0A192F' }}>
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen" style={{ backgroundColor: '#0A192F' }}>
      {/* Sidebar */}
      <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />

      {/* Main Content */}
      <div 
        className={`flex-1 transition-all duration-300 ${
          isSidebarOpen ? 'ml-64' : 'ml-16'
        }`}
      >
        {/* Header */}
        <div className="bg-opacity-10 bg-white p-4 flex justify-between items-center">
          <div className="flex items-center">
            <h1 className="text-xl font-bold text-[#64FFDA]">
              Users Dashboard
            </h1>
          </div>
          <div className="flex items-center space-x-4">
            {/* Profile Section */}
            <div className="relative group">
              <button
                className="flex items-center space-x-2 px-3 py-2 rounded-full hover:bg-opacity-20 hover:bg-white transition-all"
                onClick={() => router.push('/dashboard/adminprofile')}
              >
                {userData?.profile_image ? (
                  <img
                    src={userData.profile_image}
                    alt="Profile"
                    className="w-8 h-8 rounded-full object-cover border-2 border-[#64FFDA]"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-[#64FFDA] flex items-center justify-center">
                    <span className="text-[#0A192F] font-semibold">
                      {userData?.first_name?.[0]?.toUpperCase() || 'A'}
                    </span>
                  </div>
                )}
                <span className="text-[#64FFDA] hidden md:block">
                  {userData?.first_name || 'Admin'} Profile
                </span>
              </button>

              {/* Optional: Dropdown menu on hover */}
              <div className="absolute right-0 mt-2 w-48 py-2 bg-[#112240] rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                <button
                  onClick={() => router.push('/dashboard/adminprofile')}
                  className="block w-full px-4 py-2 text-left text-[#CCD6F6] hover:bg-[#1D2D50] transition-colors"
                >
                  View Profile
                </button>
                <button
                  onClick={handleLogout}
                  className="block w-full px-4 py-2 text-left text-[#CCD6F6] hover:bg-[#1D2D50] transition-colors"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="p-6">
          {error && (
            <div className="mb-4 p-3 rounded" style={{ backgroundColor: 'rgba(255, 0, 0, 0.1)', color: '#FF6B6B' }}>
              {error}
            </div>
          )}

          {/* Search and Filter Bar */}
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
                    <td className="px-6 py-4" style={{ color: '#CCD6F6' }}>
                      {user.id}
                    </td>
                    <td className="px-6 py-4" style={{ color: '#CCD6F6' }}>
                      {user.first_name} {user.last_name}
                    </td>
                    <td className="px-6 py-4" style={{ color: '#CCD6F6' }}>
                      {user.email}
                    </td>
                    <td className="px-6 py-4" style={{ color: '#CCD6F6' }}>
                      {user.role}
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

        {/* Modal for Advisor Formular Details */}
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
                // Page 1: Personal Information
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
                // Page 2: Documents
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

              {/* Navigation and Action Buttons */}
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
  );
} 