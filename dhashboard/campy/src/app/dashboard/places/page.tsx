'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import Image from 'next/image';
import CloudinaryScript from '@/components/CloudinaryScript';

interface Category {
  id: number;
  name: string;
  icon: string;
}

interface Place {
  id: string;
  name: string;
  description: string;
  location: string;
  image: string;
  rating: number;
  status: 'pending' | 'approved' | 'rejected';
  categories: Category[];
  reviews: {
    id: number;
    rating: number;
    comment: string;
    user: {
      first_name: string;
      last_name: string;
    };
    createdAt: string;
  }[];
}

interface PlaceFormData {
  name: string;
  description: string;
  location: string;
  image: string;
  categoryIds: number[];
}

export default function PlaceManagement() {
  const router = useRouter();
  const [places, setPlaces] = useState<Place[]>([]);
  const [filteredPlaces, setFilteredPlaces] = useState<Place[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [placeToDelete, setPlaceToDelete] = useState<string | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/';
  const [activeStatus, setActiveStatus] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [totalCounts, setTotalCounts] = useState({
    all: 0,
    pending: 0,
    approved: 0,
    rejected: 0
  });

  const [formData, setFormData] = useState<PlaceFormData>({
    name: '',
    description: '',
    location: '',
    image: '',
    categoryIds: [],
  });

  const [statusCounts, setStatusCounts] = useState({
    all: 0,
    pending: 0,
    approved: 0,
    rejected: 0
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  useEffect(() => {
    fetchPlaces();
    fetchCategories();
  }, []);

  useEffect(() => {
    const shouldLockScroll = showAddModal || showEditModal || showDeleteModal || showDetailModal;
    
    if (shouldLockScroll) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [showAddModal, showEditModal, showDeleteModal, showDetailModal]);

  useEffect(() => {
    const counts = {
      all: places.length,
      pending: places.filter(p => p.status === 'pending').length,
      approved: places.filter(p => p.status === 'approved').length,
      rejected: places.filter(p => p.status === 'rejected').length
    };
    setStatusCounts(counts);
  }, [places]);

  const fetchCategories = async () => {
    try {
      const token = localStorage.getItem('userToken');
      const { data } = await proxyFetch('categories', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (data.success) {
        setCategories(data.data);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
      setError('Failed to load categories');
    }
  };

  // Proxy function to handle API calls
  const proxyFetch = async (endpoint: string, options: RequestInit) => {
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '') || 'http://localhost:3000/api'.replace(/\/$/, ''); // Remove trailing slash if present
      const response = await fetch(`${API_URL}/${endpoint}`, {  // Add slash between API_URL and endpoint
        ...options,
        headers: {
          ...options.headers,
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      return { response, data };
    } catch (error) {
      console.error('Proxy fetch error:', error);
      throw error;
    }
  };

  // Add function to calculate counts
  const calculateCounts = (placesData: Place[]) => {
    const counts = {
      all: placesData.length,
      pending: placesData.filter(p => p.status === 'pending').length,
      approved: placesData.filter(p => p.status === 'approved').length,
      rejected: placesData.filter(p => p.status === 'rejected').length
    };
    setTotalCounts(counts);
  };

  // Update fetchPlaces to calculate counts
  const fetchPlaces = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('userToken');
      if (!token) {
        router.push('/');
        return;
      }

      const { data } = await proxyFetch('admin/places', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (data.success && Array.isArray(data.data)) {
        setPlaces(data.data);
        setFilteredPlaces(data.data);
        calculateCounts(data.data);
      } else {
        setError('Invalid data format received');
      }
    } catch (error) {
      console.error('Error fetching places:', error);
      setError('Error fetching places');
    } finally {
      setLoading(false);
    }
  };

  // Update handleStatusChange to only filter places
  const handleStatusChange = (newStatus: 'all' | 'pending' | 'approved' | 'rejected') => {
    setActiveStatus(newStatus);
    const filtered = newStatus === 'all' 
      ? places 
      : places.filter(place => place.status === newStatus);
    setFilteredPlaces(filtered);
  };

  // Add separate function for status updates
  const handleStatusUpdate = async (placeId: string, newStatus: 'pending' | 'approved' | 'rejected') => {
    try {
      const token = localStorage.getItem('userToken');
      const { response } = await proxyFetch(`admin/places/${placeId}/status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) throw new Error('Failed to update status');
      
      // Update places locally
      const updatedPlaces = places.map(place => 
        place.id === placeId ? { ...place, status: newStatus } : place
      );
      setPlaces(updatedPlaces);
      
      // Update filtered places if needed
      if (activeStatus === 'all' || activeStatus === newStatus) {
        const newFiltered = activeStatus === 'all' 
          ? updatedPlaces 
          : updatedPlaces.filter(place => place.status === activeStatus);
        setFilteredPlaces(newFiltered);
      } else {
        setFilteredPlaces(prev => prev.filter(place => place.id !== placeId));
      }
      
      // Update counts
      calculateCounts(updatedPlaces);
    } catch (error) {
      console.error('Error updating status:', error);
      setError(error instanceof Error ? error.message : 'Failed to update status');
    }
  };

  const handleAddPlace = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      const token = localStorage.getItem('userToken');

      const { response, data } = await proxyFetch('admin/places/create', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...formData,
          status: 'approved' // Ensure status is set to approved
        }),
      });

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create place');
      }

      if (data.success) {
        await fetchPlaces();
        setShowAddModal(false);
        setFormData({
          name: '',
          description: '',
          location: '',
          image: '',
          categoryIds: [],
        });
        setError(null);
      }
    } catch (error) {
      console.error('Error creating place:', error);
      setError(error instanceof Error ? error.message : 'Failed to create place');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdatePlace = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlace) return;

    try {
      setIsSubmitting(true);
      const token = localStorage.getItem('userToken');
      
      // Log the current state and what we're trying to update
      console.log('Current place data:', selectedPlace);
      console.log('Update data being sent:', {
        name: formData.name,
        description: formData.description,
        location: formData.location,
        image: formData.image,
        categoryIds: formData.categoryIds
      });

      const url = `${API_URL}admin/places/${selectedPlace.id}`;
      
      console.log('Making PUT request to:', url);

      const requestBody = {
        name: formData.name,
        description: formData.description,
        location: formData.location,
        image: formData.image,
        categoryIds: formData.categoryIds
      };

      console.log('Request body:', JSON.stringify(requestBody, null, 2));

      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody),
      });

      console.log('Response status:', response.status);
      const responseText = await response.text();
      console.log('Raw response:', responseText);

      let data;
      try {
        data = JSON.parse(responseText);
        console.log('Parsed response data:', data);
      } catch (e) {
        console.error('Failed to parse response as JSON:', e);
        throw new Error('Invalid response from server');
      }

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update place');
      }

      if (data.success) {
        console.log('Update successful, refreshing places...');
        await fetchPlaces(); // Refresh the places list
        
        // Force a re-render of the specific place
        const updatedPlace = await fetch(`${API_URL}admin/places/${selectedPlace.id}`).then(res => res.json());
        console.log('Fetched updated place:', updatedPlace);

        setShowEditModal(false);
        setFormData({
          name: '',
          description: '',
          location: '',
          image: '',
          categoryIds: [],
        });
        setSelectedPlace(null);
        setError(null);

        // Force refresh of the places list
        window.location.reload();
      }
    } catch (error) {
      console.error('Error updating place:', error);
      setError(error instanceof Error ? error.message : 'Failed to update place');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditClick = (place: Place) => {
    console.log('Editing place - full data:', place);
    
    // Ensure we have the correct data structure
    const categoryIds = place.categories?.map(cat => cat.id) || [];
    const imageUrl = place.image || (Array.isArray(place.images) ? place.images[0] : '') || '';
    
    const formDataToSet = {
      name: place.name || '',
      description: place.description || '',
      location: place.location || '',
      image: imageUrl,
      categoryIds: categoryIds,
    };

    console.log('Setting form data:', formDataToSet);

    setSelectedPlace(place);
    setFormData(formDataToSet);
    setShowEditModal(true);
  };

  const handleDeleteClick = (placeId: string) => {
    setPlaceToDelete(placeId);
    setShowDeleteModal(true);
  };

  const handleDelete = async () => {
    if (!placeToDelete) return;

    try {
      const token = localStorage.getItem('userToken');
      const { response } = await proxyFetch(`admin/places/${placeToDelete}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error('Failed to delete place');
      await fetchPlaces();
      setShowDeleteModal(false);
      setPlaceToDelete(null);
    } catch (error) {
      console.error('Error deleting place:', error);
      setError(error instanceof Error ? error.message : 'Failed to delete place');
    }
  };

  const handlePlaceClick = async (placeId: string) => {
    try {
      const token = localStorage.getItem('userToken');
      const response = await fetch(`${API_URL}places/${placeId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) throw new Error('Failed to fetch place details');
      const data = await response.json();
      setSelectedPlace(data.data);
      setShowDetailModal(true);
    } catch (error) {
      console.error('Error fetching place details:', error);
      setError(error instanceof Error ? error.message : 'Failed to load place details');
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
        console.log('Image uploaded successfully:', data.secure_url);
        setFormData(prev => ({ ...prev, image: data.secure_url }));
      }
    } catch (error) {
      console.error('Upload error:', error);
      setError('Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  const calculateStatusCounts = (placesData: any[]) => {
    console.log('Calculating counts for places:', placesData); // Debug log

    const counts = {
      all: placesData.length,
      pending: 0,
      approved: 0,
      rejected: 0
    };

    placesData.forEach(place => {
      console.log('Place status:', place.status); // Debug log for each place's status
      if (place.status === 'pending') counts.pending++;
      else if (place.status === 'approved') counts.approved++;
      else if (place.status === 'rejected') counts.rejected++;
    });

    console.log('Final counts:', counts); // Debug log for final counts
    setStatusCounts(counts);
  };

  // Add this sorting function before rendering
  const sortedPlaces = filteredPlaces.sort((a, b) => {
    // Sort by ID in descending order (newest first)
    return b.id - a.id;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-red-600 text-xl">{error}</div>
      </div>
    );
  }

  return (
    <>
      <CloudinaryScript />
      <div className="flex min-h-screen bg-[#0A192F]">
        <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
        
        <div className={`flex-1 transition-all duration-300 ${isSidebarOpen ? 'ml-64' : 'ml-16'} p-8`}>
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-[#64FFDA]">Place Management</h1>
            <button
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2 bg-[#64FFDA] text-[#0A192F] rounded-lg hover:bg-opacity-90"
            >
              Add New Place
            </button>
          </div>

          {/* Status Filter Buttons */}
          <div className="mb-6 flex space-x-4">
            {(['all', 'pending', 'approved', 'rejected'] as const).map((status) => (
              <button
                key={status}
                onClick={() => handleStatusChange(status)}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  activeStatus === status
                    ? 'bg-[#64FFDA] text-[#0A192F]'
                    : 'bg-[#112240] text-[#CCD6F6] hover:bg-[#1D2D50]'
                }`}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
                <span className="ml-2 px-2 py-1 rounded-full bg-[#1D2D50] text-[#64FFDA] text-sm">
                  {totalCounts[status]}
                </span>
              </button>
            ))}
          </div>

          {/* Places Grid */}
          <div className="space-y-4">
            {sortedPlaces.map((place) => (
              <div
                key={place.id}
                className="bg-[#112240] rounded-lg overflow-hidden border-l-4 border-[#64FFDA]"
              >
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-xl font-semibold text-[#64FFDA] mb-2">{place.name}</h3>
                      <p className="text-[#8892B0] mb-2">{place.location}</p>
                      <span className="px-3 py-1 bg-[#1D2D50] text-[#F44336] rounded-full text-sm">
                        {place.status || 'Unknown'}
                      </span>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleStatusUpdate(place.id, 'pending')}
                        className={`px-4 py-2 bg-[#FFA500] text-white rounded-lg hover:bg-opacity-90 ${
                          place.status === 'pending' ? 'bg-[#FFA500]' : 'bg-[#112240]'
                        }`}
                      >
                        Pending
                      </button>
                      <button
                        onClick={() => handleStatusUpdate(place.id, 'approved')}
                        className={`px-4 py-2 bg-[#4CAF50] text-white rounded-lg hover:bg-opacity-90 ${
                          place.status === 'approved' ? 'bg-[#4CAF50]' : 'bg-[#112240]'
                        }`}
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => handleStatusUpdate(place.id, 'rejected')}
                        className={`px-4 py-2 bg-[#F44336] text-white rounded-lg hover:bg-opacity-90 ${
                          place.status === 'rejected' ? 'bg-[#F44336]' : 'bg-[#112240]'
                        }`}
                      >
                        Reject
                      </button>
                      <button
                        onClick={() => handleEditClick(place)}
                        className="px-4 py-2 bg-[#64FFDA] text-[#0A192F] rounded-lg hover:bg-opacity-90"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => {
                          setPlaceToDelete(place.id);
                          setShowDeleteModal(true);
                        }}
                        className="px-4 py-2 bg-[#F44336] text-white rounded-lg hover:bg-opacity-90"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                  <p className="text-[#CCD6F6]">{place.description}</p>
                  {place.image && (
                    <img
                      src={place.image}
                      alt={place.name}
                      className="w-full h-64 object-cover rounded-lg mt-4"
                    />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Add/Edit Place Modal */}
      {(showAddModal || showEditModal) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-hidden">
          <div className="bg-[#112240] p-6 rounded-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl text-[#64FFDA] font-semibold mb-4">
              {showAddModal ? 'Add New Place' : 'Edit Place'}
            </h3>
            <form onSubmit={showAddModal ? handleAddPlace : handleUpdatePlace} className="space-y-4">
              <div>
                <label className="block text-[#CCD6F6] mb-2">Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full p-2 rounded-lg bg-[#1D2D50] text-[#CCD6F6] border border-[#64FFDA]"
                  required
                />
              </div>

              <div>
                <label className="block text-[#CCD6F6] mb-2">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full p-2 rounded-lg bg-[#1D2D50] text-[#CCD6F6] border border-[#64FFDA] h-32"
                  required
                />
              </div>

              <div>
                <label className="block text-[#CCD6F6] mb-2">Location</label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="w-full p-2 rounded-lg bg-[#1D2D50] text-[#CCD6F6] border border-[#64FFDA]"
                  required
                />
              </div>

              <div>
                <label className="block text-[#CCD6F6] mb-2">Image</label>
                <div className="relative">
                  {formData.image && (
                    <div className="w-full h-48 mb-4 relative rounded-lg overflow-hidden">
                      <img
                        src={formData.image}
                        alt="Place preview"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    id="place-image-upload"
                  />
                  <label 
                    htmlFor="place-image-upload"
                    className="px-4 py-2 bg-[#1D2D50] text-[#CCD6F6] rounded-lg cursor-pointer hover:bg-opacity-80 transition-all duration-200 inline-flex items-center"
                  >
                    <svg 
                      xmlns="http://www.w3.org/2000/svg" 
                      className="h-5 w-5 mr-2" 
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
                    {uploading ? 'Uploading...' : 'Upload Image'}
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-[#CCD6F6] mb-2">Categories</label>
                <div className="flex flex-wrap gap-2">
                  {categories.map((category) => (
                    <label key={category.id} className="inline-flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.categoryIds.includes(category.id)}
                        onChange={(e) => {
                          const newCategoryIds = e.target.checked
                            ? [...formData.categoryIds, category.id]
                            : formData.categoryIds.filter(id => id !== category.id);
                          setFormData({ ...formData, categoryIds: newCategoryIds });
                        }}
                        className="mr-2"
                      />
                      <span className="text-[#CCD6F6]">{category.name}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setShowEditModal(false);
                    setFormData({
                      name: '',
                      description: '',
                      location: '',
                      image: '',
                      categoryIds: [],
                    });
                    setSelectedPlace(null);
                  }}
                  className="px-4 py-2 bg-[#1D2D50] text-[#CCD6F6] rounded-lg hover:bg-opacity-80 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`px-4 py-2 bg-[#64FFDA] text-[#0A192F] rounded-lg transition-colors ${
                    isSubmitting ? 'opacity-50 cursor-not-allowed' : 'hover:bg-opacity-90'
                  }`}
                >
                  {isSubmitting 
                    ? 'Saving...' 
                    : (showAddModal ? 'Add place' : 'Update Place')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Place Detail Modal */}
      {showDetailModal && selectedPlace && (
        <div 
          className="fixed inset-0 z-50 overflow-hidden"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.75)' }}
        >
          <div className="fixed inset-0 flex items-center justify-center p-4">
            <div 
              className="bg-[#112240] rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 border-b border-[#1D2D50]">
                <div className="flex justify-between items-start">
                  <h2 className="text-2xl font-bold text-[#64FFDA]">{selectedPlace.name}</h2>
                  <button
                    onClick={() => setShowDetailModal(false)}
                    className="text-[#8892B0] hover:text-[#64FFDA]"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-6">
                {selectedPlace.image && (
                  <img
                    src={selectedPlace.image}
                    alt={selectedPlace.name}
                    className="w-full h-64 object-cover rounded-lg mb-4"
                  />
                )}

                <div className="space-y-4">
                  <div>
                    <h3 className="text-[#64FFDA] font-semibold mb-2">Location</h3>
                    <p className="text-[#CCD6F6]">{selectedPlace.location}</p>
                  </div>

                  <div>
                    <h3 className="text-[#64FFDA] font-semibold mb-2">Description</h3>
                    <p className="text-[#CCD6F6]">{selectedPlace.description}</p>
                  </div>

                  <div>
                    <h3 className="text-[#64FFDA] font-semibold mb-2">Categories</h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedPlace.categories.map((category, index) => (
                        <span
                          key={index}
                          className="bg-[#1D2D50] text-[#64FFDA] px-2 py-1 rounded-full text-sm"
                        >
                          {category.name}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-[#64FFDA] font-semibold mb-2">
                      Reviews ({selectedPlace.reviews.length})
                    </h3>
                    <div className="space-y-4">
                      {selectedPlace.reviews.map((review, index) => (
                        <div key={index} className="bg-[#1D2D50] rounded-lg p-4">
                          <div className="flex justify-between items-start">
                            <div>
                              <div className="text-[#CCD6F6] font-semibold">
                                {review.user.first_name} {review.user.last_name}
                              </div>
                              <div className="text-[#8892B0] text-sm">
                                {new Date(review.createdAt).toLocaleString()}
                              </div>
                            </div>
                            <div className="text-[#64FFDA]">
                              Rating: {review.rating}/5
                            </div>
                          </div>
                          <p className="text-[#CCD6F6] mt-2">{review.comment}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-hidden">
          <div className="bg-[#112240] p-6 rounded-lg max-w-md w-full mx-4">
            <h3 className="text-xl text-[#64FFDA] font-semibold mb-4">
              Confirm Delete
            </h3>
            <p className="text-[#CCD6F6] mb-6">
              Are you sure you want to delete this place? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setPlaceToDelete(null);
                }}
                className="px-4 py-2 bg-[#1D2D50] text-[#CCD6F6] rounded-lg hover:bg-opacity-80 transition-colors"
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
    </>
  );
}   
