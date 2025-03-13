'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';

interface MarketplaceItem {
  id: number;
  title: string;
  description: string;
  price: number;
  status: 'available' | 'sold' | 'pending';
  location: string;
  seller: {
    first_name: string;
    last_name: string;
  };
  media: {
    id: number;
    url: string;
    type: string;
  }[];
  categories: {
    id: string;
    name: string;
  }[];
}

export default function MarketplaceManagement() {
  const router = useRouter();
  const [items, setItems] = useState<MarketplaceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<number | null>(null);
  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const fetchItems = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      
      if (!token) {
        console.log('No token found, redirecting to login');
        router.push('/login');
        return;
      }

      if (!apiUrl) {
        throw new Error('API URL not configured');
      }

      console.log('Fetching items from:', `${apiUrl}marketplace/items`);
      
      const response = await fetch(`${apiUrl}marketplace/items`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        credentials: 'include'
      });

      if (!response.ok) {
        if (response.status === 403 || response.status === 401) {
          console.log('Authentication failed, redirecting to login');
          localStorage.removeItem('token');
          router.push('/login');
          return;
        }

        const errorText = await response.text();
        console.error('Server response:', errorText);
        
        // Try to parse the error message
        try {
          const errorJson = JSON.parse(errorText);
          if (errorJson.error && errorJson.error.includes("Table") && errorJson.error.includes("doesn't exist")) {
            throw new Error("Marketplace is being set up. Please try again later.");
          }
          throw new Error(`Server error: ${errorJson.error}`);
        } catch (e) {
          throw new Error(`Server error (${response.status}): ${errorText}`);
        }
      }

      const data = await response.json();
      if (!Array.isArray(data)) {
        throw new Error('Invalid data format received from server');
      }
      setItems(data);
    } catch (error) {
      console.error('Error fetching items:', error);
      setError(
        error instanceof Error 
          ? error.message
          : 'Failed to load items. Please try again later.'
      );
    } finally {
      setLoading(false);
    }
  };

  const retryFetch = () => {
    setError(null);
    fetchItems();
  };

  const handleDeleteClick = (itemId: number) => {
    setItemToDelete(itemId);
    setShowDeleteModal(true);
  };

  const handleDelete = async () => {
    try {
      const token = localStorage.getItem('token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      
      if (!token || !itemToDelete) {
        router.push('/login');
        return;
      }

      if (!apiUrl) {
        throw new Error('API URL not configured');
      }

      const response = await fetch(`${apiUrl}marketplace/items/${itemToDelete}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        credentials: 'include'
      });

      if (!response.ok) {
        if (response.status === 403 || response.status === 401) {
          localStorage.removeItem('token');
          router.push('/login');
          return;
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      setItems(items.filter(item => item.id !== itemToDelete));
      setShowDeleteModal(false);
      setItemToDelete(null);
    } catch (error) {
      console.error('Error deleting item:', error);
      setError(error instanceof Error ? error.message : 'Failed to delete item');
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  if (loading) {
    return (
      <div className="flex h-screen bg-[#0A192F]">
        <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
        <div className="flex-1 p-8">
          <div className="flex justify-center items-center h-full">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#64FFDA]"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#0A192F] overflow-hidden">
      <div className="fixed">
        <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
      </div>
      <div className={`flex-1 overflow-auto ${isSidebarOpen ? 'ml-64' : 'ml-20'}`}>
        <div className="p-8">
          <div className="max-w-6xl mx-auto">
            <div className="flex justify-between items-center mb-8">
              <h1 className="text-2xl font-bold text-[#64FFDA]">Marketplace Management</h1>
            </div>

            {error && (
              <div className="bg-red-500 bg-opacity-10 border border-red-500 text-red-500 p-4 mb-4 rounded">
                <p className="mb-2">{error}</p>
                {!error.includes("being set up") && (
                  <button
                    onClick={retryFetch}
                    className="mt-2 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                  >
                    Retry
                  </button>
                )}
              </div>
            )}

            {!error && items.length === 0 && (
              <div className="text-center text-[#8892B0] py-8">
                <p>No items available in the marketplace.</p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {items.map((item) => (
                <div key={item.id} className="bg-[#112240] rounded-lg overflow-hidden">
                  {item.media && item.media[0] && (
                    <img
                      src={item.media[0].url}
                      alt={item.title}
                      className="w-full h-48 object-cover"
                    />
                  )}
                  <div className="p-4">
                    <h2 className="text-xl text-[#CCD6F6] font-semibold mb-2">
                      {item.title}
                    </h2>
                    <p className="text-[#8892B0] mb-2">
                      ${item.price?.toFixed(2)} - {item.status}
                    </p>
                    <p className="text-[#8892B0] mb-4">
                      Seller: {item.seller?.first_name} {item.seller?.last_name}
                    </p>
                    <div className="flex justify-end space-x-2">
                      <button
                        onClick={() => handleDeleteClick(item.id)}
                        className="px-4 py-2 bg-red-500/20 text-red-500 rounded hover:bg-red-500/30 transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-[#112240] p-6 rounded-lg max-w-md w-full mx-4">
            <h3 className="text-xl text-[#64FFDA] font-semibold mb-4">
              Confirm Delete
            </h3>
            <p className="text-[#CCD6F6] mb-6">
              Are you sure you want to delete this item? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 text-[#8892B0] hover:text-[#CCD6F6] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}