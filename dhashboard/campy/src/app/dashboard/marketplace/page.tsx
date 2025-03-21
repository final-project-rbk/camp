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
  const [showAddModal, setShowAddModal] = useState(false);
  const [newItem, setNewItem] = useState({
    title: '',
    description: '',
    price: '',
    location: '',
    status: 'available' as const,
    image: ''
  });
  const [categories, setCategories] = useState<{id: string, name: string}[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const fetchItems = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('userToken');
      if (!token) {
        console.log('No token found, redirecting to login');
        router.push('/login');
        return;
      }

      const response = await fetch(`${API_URL}marketplace/items`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        if (response.status === 403 || response.status === 401) {
          localStorage.removeItem('userToken');
          router.push('/login');
          return;
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('Fetched items:', data);
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
    console.log('Attempting to delete item:', itemId);
    setItemToDelete(itemId);
    setShowDeleteModal(true);
    setError(null);
  };

  const handleDelete = async () => {
    try {
      const token = localStorage.getItem('userToken');
      if (!token || !itemToDelete) {
        router.push('/login');
        return;
      }

      console.log('Deleting item:', `${API_URL}marketplace/items/${itemToDelete}`);

      const response = await fetch(`${API_URL}marketplace/items/${itemToDelete}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        if (response.status === 403 || response.status === 401) {
          localStorage.removeItem('userToken');
          router.push('/login');
          return;
        }

        const contentType = response.headers.get("content-type");
        if (contentType && contentType.indexOf("application/json") !== -1) {
          const errorData = await response.json();
          throw new Error(errorData.error || `Failed to delete item (${response.status})`);
        } else {
          throw new Error(`Failed to delete item (${response.status}). Please check the item ID and try again.`);
        }
      }

      setItems(items.filter(item => item.id !== itemToDelete));
      setShowDeleteModal(false);
      setItemToDelete(null);
      setError(null);
    } catch (error) {
      console.error('Error deleting item:', error);
      setError(
        error instanceof Error 
          ? error.message 
          : 'Failed to delete item. Please try again.'
      );
    }
  };

  const fetchCategories = async () => {
    try {
      const token = localStorage.getItem('userToken');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}marketplace/categories`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) throw new Error('Failed to fetch categories');
      const data = await response.json();
      setCategories(data);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const file = event.target.files?.[0];
      if (!file) return;

      setUploading(true);
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
        setNewItem(prev => ({ ...prev, image: data.secure_url }));
      }
    } catch (error) {
      console.error('Upload error:', error);
      setError('Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  const handleCreateItem = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('userToken');
      if (!token) {
        router.push('/login');
        return;
      }

      // Validate required fields
      if (!newItem.title || !newItem.description || !newItem.price || !newItem.location) {
        setError('Please fill in all required fields');
        return;
      }

      // Validate price is a positive number
      const price = parseFloat(newItem.price);
      if (isNaN(price) || price <= 0) {
        setError('Please enter a valid price');
        return;
      }

      // Validate at least one category is selected
      if (selectedCategories.length === 0) {
        setError('Please select at least one category');
        return;
      }

      // Validate image is uploaded
      if (!newItem.image) {
        setError('Please upload an image');
        return;
      }

      const formData = {
        title: newItem.title.trim(),
        description: newItem.description.trim(),
        price: price,
        location: newItem.location.trim(),
        status: 'available',
        categoryIds: selectedCategories,
        images: [newItem.image] // Send the Cloudinary URL
      };

      const response = await fetch(`${API_URL}marketplace/items`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create item');
      }
      
      const createdItem = await response.json();

      // Update the items list with the new item
      setItems(prevItems => [createdItem, ...prevItems]);
      
      // Reset form and close modal
      setShowAddModal(false);
      setNewItem({
        title: '',
        description: '',
        price: '',
        location: '',
        status: 'available',
        image: ''
      });
      setSelectedCategories([]);
      setError(null);

    } catch (error) {
      console.error('Error creating item:', error);
      setError(
        error instanceof Error 
          ? error.message 
          : 'Failed to create item. Please try again.'
      );
    }
  };

  // Add this helper function to validate the form data
  const validateFormData = () => {
    if (!newItem.title || !newItem.description || !newItem.price || !newItem.location) {
      return 'Please fill in all required fields';
    }
    
    const price = parseFloat(newItem.price);
    if (isNaN(price) || price <= 0) {
      return 'Please enter a valid price';
    }
    
    if (selectedCategories.length === 0) {
      return 'Please select at least one category';
    }
    
    return null;
  };

  useEffect(() => {
    fetchItems();
    fetchCategories();
  }, []);

  // Add price formatting helper
  const formatPrice = (price: any): string => {
    if (typeof price === 'string') {
      price = parseFloat(price);
    }
    if (typeof price === 'number' && !isNaN(price)) {
      return price.toFixed(2);
    }
    return '0.00';
  };

  useEffect(() => {
    if (API_URL && API_URL.endsWith('/')) {
      console.log('API URL is correctly formatted');
    } else {
      console.warn('API URL should end with a forward slash');
    }
  }, [API_URL]);

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
              <button
                onClick={() => setShowAddModal(true)}
                className="bg-[#64FFDA] text-[#0A192F] px-4 py-2 rounded-lg hover:bg-[#4CD6B4] transition-colors"
              >
                Add New Item
              </button>
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

            {/* Add Item Modal */}
            {showAddModal && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
                <div className="bg-[#112240] rounded-lg p-6 max-w-md w-full">
                  <h2 className="text-xl font-bold text-[#64FFDA] mb-4">Add New Item</h2>
                  {error && (
                    <div className="mb-4 p-3 bg-red-500 bg-opacity-10 border border-red-500 rounded text-red-500">
                      {error}
                    </div>
                  )}
                  <form onSubmit={handleCreateItem}>
                    <div className="space-y-4">
                      <input
                        type="text"
                        placeholder="Title *"
                        value={newItem.title}
                        onChange={e => setNewItem({...newItem, title: e.target.value})}
                        className="w-full p-2 rounded bg-[#1D2D50] text-[#CCD6F6]"
                        required
                      />
                      <textarea
                        placeholder="Description *"
                        value={newItem.description}
                        onChange={e => setNewItem({...newItem, description: e.target.value})}
                        className="w-full p-2 rounded bg-[#1D2D50] text-[#CCD6F6]"
                        required
                      />
                      <input
                        type="number"
                        placeholder="Price *"
                        value={newItem.price}
                        onChange={e => setNewItem({...newItem, price: e.target.value})}
                        className="w-full p-2 rounded bg-[#1D2D50] text-[#CCD6F6]"
                        required
                        min="0"
                        step="0.01"
                      />
                      <input
                        type="text"
                        placeholder="Location *"
                        value={newItem.location}
                        onChange={e => setNewItem({...newItem, location: e.target.value})}
                        className="w-full p-2 rounded bg-[#1D2D50] text-[#CCD6F6]"
                        required
                      />
                      <div>
                        <label className="block text-[#CCD6F6] mb-2">Categories *</label>
                        <select
                          multiple
                          value={selectedCategories}
                          onChange={e => setSelectedCategories(
                            Array.from(e.target.selectedOptions, option => option.value)
                          )}
                          className="w-full p-2 rounded bg-[#1D2D50] text-[#CCD6F6]"
                          required
                        >
                          {categories.map(category => (
                            <option key={category.id} value={category.id}>
                              {category.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-[#CCD6F6] mb-2">Image</label>
                        <div className="relative">
                          {newItem.image && (
                            <div className="w-full h-48 mb-4 relative rounded-lg overflow-hidden">
                              <img
                                src={newItem.image}
                                alt="Item preview"
                                className="w-full h-full object-cover"
                              />
                            </div>
                          )}
                          <label 
                            htmlFor="item-image-upload" 
                            className="px-4 py-2 bg-[#1D2D50] text-[#CCD6F6] rounded-lg cursor-pointer hover:bg-opacity-80 transition-all duration-200 inline-flex items-center"
                          >
                            <svg 
                              xmlns="http://www.w3.org/2000/svg" 
                              className="h-5 w-5 mr-2 text-[#64FFDA]" 
                              fill="none" 
                              viewBox="0 0 24 24" 
                              stroke="currentColor"
                            >
                              <path 
                                strokeLinecap="round" 
                                strokeLinejoin="round" 
                                strokeWidth={2} 
                                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" 
                              />
                            </svg>
                            Upload Image
                          </label>
                          <input
                            id="item-image-upload"
                            type="file"
                            accept="image/*"
                            onChange={handleImageUpload}
                            className="hidden"
                          />
                          {uploading && (
                            <div className="mt-2 text-[#64FFDA] text-sm flex items-center">
                              <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-[#64FFDA] mr-2"></div>
                              Uploading...
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex justify-end space-x-4 mt-6">
                      <button
                        type="button"
                        onClick={() => {
                          setShowAddModal(false);
                          setError(null);
                        }}
                        className="px-4 py-2 rounded bg-[#1D2D50] text-[#CCD6F6] hover:bg-[#2A3F6D]"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-2 rounded bg-[#64FFDA] text-[#0A192F] hover:bg-[#4CD6B4]"
                      >
                        Create
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {items.map((item) => (
                <div key={item.id} className="bg-[#112240] rounded-lg shadow-lg p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-xl font-semibold text-[#CCD6F6]">{item.title}</h3>
                      <p className="text-[#8892B0]">{item.description}</p>
                    </div>
                    <p className="text-[#64FFDA] font-bold">${formatPrice(item.price)}</p>
                  </div>
                  {item.media && item.media[0] && (
                    <img
                      src={item.media[0].url}
                      alt={item.title}
                      className="w-full h-48 object-cover rounded mb-4"
                    />
                  )}
                  <div className="flex justify-end items-center">
                    <button
                      onClick={() => handleDeleteClick(item.id)}
                      className="text-red-500 hover:text-red-600"
                    >
                      Delete
                    </button>
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
          <div className="bg-[#112240] rounded-lg p-6 max-w-md w-full mx-4">
            <h2 className="text-xl font-bold text-[#64FFDA] mb-4">Confirm Delete</h2>
            {error && (
              <div className="mb-4 p-3 bg-red-500 bg-opacity-10 border border-red-500 rounded text-red-500">
                {error}
              </div>
            )}
            <p className="text-[#CCD6F6] mb-2">Are you sure you want to delete this item?</p>
            <p className="text-[#8892B0] text-sm mb-6">Item ID: {itemToDelete}</p>
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setItemToDelete(null);
                  setError(null);
                }}
                className="px-4 py-2 rounded bg-[#1D2D50] text-[#CCD6F6] hover:bg-[#2A3F6D]"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 rounded bg-red-500 text-white hover:bg-red-600"
                disabled={!itemToDelete}
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