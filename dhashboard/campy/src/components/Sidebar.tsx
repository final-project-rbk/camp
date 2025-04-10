'use client';
import { useRouter } from 'next/navigation';

interface SidebarProps {
  isOpen: boolean;
  toggleSidebar: () => void;
}

export default function Sidebar({ isOpen, toggleSidebar }: SidebarProps) {
  const router = useRouter();

  const handleLogout = () => {
    localStorage.removeItem('userToken');
    localStorage.removeItem('userData');
    router.push('/');
  };

  return (
    <div className="relative">
      {/* Sidebar */}
      <aside 
        className={`fixed top-0 left-0 h-full transition-all duration-300 ease-in-out ${
          isOpen ? 'w-64' : 'w-20'
        }`}
        style={{ backgroundColor: '#112240' }}
      >
        {/* Header with Toggle */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-gray-700">
          {isOpen && (
            <h1 className="text-[#64FFDA] font-semibold text-lg">
              Admin Panel
            </h1>
          )}
          <button
            onClick={toggleSidebar}
            className={`${isOpen ? 'ml-auto' : 'mx-auto'} hover:bg-white/10 p-2 rounded-lg transition-colors`}
          >
            <div className="w-6 h-5 flex flex-col justify-between items-center">
              <span className={`w-full h-0.5 bg-[#64FFDA] rounded-full transition-all ${
                isOpen ? 'w-full' : 'w-1/2'
              }`} />
              <span className="w-full h-0.5 bg-[#64FFDA] rounded-full" />
              <span className={`w-full h-0.5 bg-[#64FFDA] rounded-full transition-all ${
                isOpen ? 'w-full' : 'w-3/4'
              }`} />
            </div>
          </button>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-2">
          <div
            onClick={() => router.push('/dashboard')}
            className={`flex items-center space-x-4 text-gray-300 hover:bg-white/10 rounded-lg p-3 cursor-pointer transition-colors ${
              isOpen ? 'justify-start' : 'justify-center'
            }`}
          >
            <svg 
              className="w-6 h-6 text-[#64FFDA]" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" 
              />
            </svg>
            {isOpen && <span className="text-[#8892B0]">Users Dashboard</span>}
          </div>

          {/* New Blog Management Link */}
          <div
            onClick={() => router.push('/dashboard/blogs')}
            className={`flex items-center space-x-4 text-gray-300 hover:bg-white/10 rounded-lg p-3 cursor-pointer transition-colors ${
              isOpen ? 'justify-start' : 'justify-center'
            }`}
          >
            <svg 
              className="w-6 h-6 text-[#64FFDA]" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9.5a2 2 0 00-2-2h-2" 
              />
            </svg>
            {isOpen && <span className="text-[#8892B0]">Blog Management</span>}
          </div>

          {/* Hints Management Link */}
          <div
            onClick={() => router.push('/dashboard/hints')}
            className={`flex items-center space-x-4 text-gray-300 hover:bg-white/10 rounded-lg p-3 cursor-pointer transition-colors ${
              isOpen ? 'justify-start' : 'justify-center'
            }`}
          >
            <svg 
              className="w-6 h-6 text-[#64FFDA]" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" 
              />
            </svg>
            {isOpen && <span className="text-[#8892B0]">Hints Management</span>}
          </div>

          {/* Places Management Link */}
          <div
            onClick={() => router.push('/dashboard/places')}
            className={`flex items-center space-x-4 text-gray-300 hover:bg-white/10 rounded-lg p-3 cursor-pointer transition-colors ${
              isOpen ? 'justify-start' : 'justify-center'
            }`}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
            {isOpen && <span>Places</span>}
          </div>

          {/* Marketplace Management Link */}
          <div
            onClick={() => router.push('/dashboard/marketplace')}
            className={`flex items-center space-x-4 text-gray-300 hover:bg-white/10 rounded-lg p-3 cursor-pointer transition-colors ${
              isOpen ? 'justify-start' : 'justify-center'
            }`}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6 text-[#64FFDA]"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
              />
            </svg>
            {isOpen && <span>Marketplace</span>}
          </div>
        </nav>

        {/* Logout Section */}
        <div className="absolute bottom-4 w-full px-4">
          <button
            onClick={handleLogout}
            className={`w-full bg-[#64FFDA] text-[#0A192F] rounded-lg transition-all hover:opacity-90 flex items-center justify-center ${
              isOpen ? 'px-4 py-2 space-x-2' : 'p-2'
            }`}
          >
            <svg 
              className="w-5 h-5" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" 
              />
            </svg>
            {isOpen && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-20 md:hidden"
          onClick={toggleSidebar}
        />
      )}
    </div>
  );
} 