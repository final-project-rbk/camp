// ... existing imports ...
import Image from 'next/image';

// ... existing interfaces ...

export default function Dashboard() {
  // ... existing state variables ...
  const [userData, setUserData] = useState<User | null>(null);

  // ... existing useEffect and other functions ...

  // Add this effect to fetch user data
  useEffect(() => {
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
      }
    };

    fetchUserData();
  }, []);

  // ... existing code until the header section ...

  // Update the header section in the return statement:
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
            <h1 className="text-xl font-bold" style={{ color: '#64FFDA' }}>
              Users Dashboard
            </h1>
          </div>
          <div className="flex items-center space-x-4">
            {/* Profile Section */}
            <div className="relative group">
              <button
                className="flex items-center space-x-2 px-3 py-2 rounded-full hover:bg-opacity-20 hover:bg-white transition-all"
              >
                {userData?.profile_image ? (
                  <Image
                    src={userData.profile_image}
                    alt="Profile"
                    width={32}
                    height={32}
                    className="rounded-full"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-[#64FFDA] flex items-center justify-center">
                    <span className="text-[#0A192F] font-semibold">
                      {userData?.first_name?.[0]?.toUpperCase() || 'U'}
                    </span>
                  </div>
                )}
                <span className="text-[#64FFDA] hidden md:block">
                  {userData?.first_name || 'User'}
                </span>
              </button>
              
              {/* Dropdown Menu */}
              <div className="absolute right-0 mt-2 w-48 py-2 bg-[#112240] rounded-md shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                <div className="px-4 py-2 text-sm text-[#8892B0] border-b border-[#1D2D50]">
                  Signed in as<br />
                  <span className="text-[#64FFDA]">{userData?.email}</span>
                </div>
                <button
                  onClick={() => router.push('/dashboard/profile')}
                  className="w-full text-left px-4 py-2 text-sm text-[#CCD6F6] hover:bg-[#1D2D50] transition-colors"
                >
                  Your Profile
                </button>
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2 text-sm text-[#CCD6F6] hover:bg-[#1D2D50] transition-colors"
                >
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Rest of your existing dashboard content */}
        {/* ... */}
      </div>
    </div>
  );
}