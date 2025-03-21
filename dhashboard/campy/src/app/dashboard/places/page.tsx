'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import { FiEdit2, FiTrash2 } from 'react-icons/fi';
import Image from 'next/image';
import Swal from 'sweetalert2';

interface User {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  profile_image?: string;
  role: 'user' | 'advisor' | 'admin';
}

interface Review {
  id: number;
  comment: string;
  rating: number;
  created_at: string | null;
  user: {
    id: number;
    name: string;
    profile_image: string;
  };
}

interface Category {
  name: string;
  icon?: string;
}

interface Creator {
  id: number;
  name: string;
  email: string;
  profile_image: string | null;
}

interface Place {
  id: number;
  name: string;
  description: string;
  location: string;
  created_at: string;
  image: string;
  images?: string[];
  rating: number;
  categories: Category[];
  reviews: Review[];
  status: 'pending' | 'approved' | 'rejected';
  creator: Creator | null;
}

interface EditModalProps {
  place: Place;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedPlace: Partial<Place>, images: File[]) => Promise<void>;
}

const EditModal = ({ place, isOpen, onClose, onSave }: EditModalProps) => {
  const [formData, setFormData] = useState({
    name: place.name,
    description: place.description,
    location: place.location,
    categories: place.categories.map(cat => typeof cat === 'string' ? cat : cat.name),
  });
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [existingImages, setExistingImages] = useState<string[]>(
    (place.images?.length ? place.images : [place.image]).filter(Boolean)
  );
  const [uploading, setUploading] = useState(false);
  const [availableCategories, setAvailableCategories] = useState<Category[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const token = localStorage.getItem('userToken');
        const response = await fetch(`${API_URL}categories`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) throw new Error('Failed to fetch categories');
        const data = await response.json();
        
        if (data.success && Array.isArray(data.data)) {
          setAvailableCategories(data.data);
        } else {
          console.error('Invalid categories response format:', data);
        }
      } catch (error) {
        console.error('Error fetching categories:', error);
      } finally {
        setCategoriesLoading(false);
      }
    };

    fetchCategories();
  }, []);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      const validFiles = filesArray.filter(file => file.type.startsWith('image/'));
      setSelectedImages(prev => [...prev, ...validFiles]);
    }
  };

  const removeExistingImage = (index: number) => {
    setExistingImages(prev => prev.filter((_, i) => i !== index));
  };

  const removeSelectedImage = (index: number) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploading(true);
    try {
      const form = e.currentTarget as HTMLFormElement;
      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }

      await onSave(
        { 
          ...formData,
          images: existingImages,
          categories: formData.categories.map(categoryName => {
            const category = availableCategories.find(cat => cat.name === categoryName);
            return category || { name: categoryName };
          })
        }, 
        selectedImages
      );
    } catch (error) {
      console.error('Error saving place:', error);
      throw error; // Re-throw to show the error in the UI
    } finally {
      setUploading(false);
    }
  };

  const toggleCategory = (categoryName: string) => {
    setFormData(prev => ({
      ...prev,
      categories: prev.categories.includes(categoryName)
        ? prev.categories.filter(cat => cat !== categoryName)
        : [...prev.categories, categoryName]
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-[#112240] rounded-lg w-full max-w-4xl m-4 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-[#1D2D50] flex justify-between items-center sticky top-0 bg-[#112240] z-10 rounded-t-lg">
          <h2 className="text-2xl font-bold text-[#64FFDA]">Edit Place</h2>
          <button
            onClick={onClose}
            className="text-[#8892B0] hover:text-[#CCD6F6] w-8 h-8 flex items-center justify-center rounded-full hover:bg-[#1D2D50]"
          >
            ✕
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 overflow-y-auto flex-1">
          <form id="edit-place-form" onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left column */}
              <div className="space-y-4">
                <div>
                  <label className="block text-[#CCD6F6] mb-2 font-medium">Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full p-3 rounded-lg bg-[#1D2D50] text-[#CCD6F6] border border-[#64FFDA] focus:ring-2 focus:ring-[#64FFDA] focus:border-transparent"
                    placeholder="Enter place name"
                  />
                </div>
                
                <div>
                  <label className="block text-[#CCD6F6] mb-2 font-medium">Description *</label>
                  <textarea
                    required
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full p-3 rounded-lg bg-[#1D2D50] text-[#CCD6F6] border border-[#64FFDA] focus:ring-2 focus:ring-[#64FFDA] focus:border-transparent h-32 resize-none"
                    placeholder="Enter place description"
                  />
                </div>

                <div>
                  <label className="block text-[#CCD6F6] mb-2 font-medium">Location *</label>
                  <input
                    type="text"
                    required
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="w-full p-3 rounded-lg bg-[#1D2D50] text-[#CCD6F6] border border-[#64FFDA] focus:ring-2 focus:ring-[#64FFDA] focus:border-transparent"
                    placeholder="Enter location"
                  />
                </div>

                <div>
                  <label className="block text-[#CCD6F6] mb-2 font-medium">Categories</label>
                  <div className="flex flex-wrap gap-2 p-3 rounded-lg bg-[#1D2D50] border border-[#64FFDA] min-h-[100px]">
                    {categoriesLoading ? (
                      <div className="flex items-center justify-center w-full">
                        <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-[#64FFDA]"></div>
                      </div>
                    ) : (
                      availableCategories.map((category) => (
                        <button
                          key={category.name}
                          type="button"
                          onClick={() => toggleCategory(category.name)}
                          className={`px-4 py-2 rounded-full text-sm flex items-center space-x-2 transition-all duration-200
                            ${formData.categories.includes(category.name)
                              ? 'bg-[#64FFDA] text-[#112240] shadow-lg transform scale-105'
                              : 'bg-[#112240] text-[#CCD6F6] hover:bg-[#1D2D50]'
                            }`}
                        >
                          <span className="text-lg">{category.icon}</span>
                          <span>{category.name}</span>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              </div>

              {/* Right column - Images */}
              <div className="space-y-4">
                <div>
                  <label className="block text-[#CCD6F6] mb-2 font-medium">Current Images</label>
                  <div className="relative">
                    <div className="flex space-x-4 overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-[#64FFDA] scrollbar-track-[#1D2D50] scrollbar-thumb-rounded-full scrollbar-track-rounded-full">
                      {existingImages.map((img, index) => (
                        <div key={index} className="relative group flex-none">
                          <div className="w-80 h-48 rounded-lg overflow-hidden">
                            <img
                              src={img}
                              alt={`Current ${index + 1}`}
                              className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-110"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => removeExistingImage(index)}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-opacity transform hover:scale-110"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                    <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-[#112240] to-transparent pointer-events-none" />
                    <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-[#112240] to-transparent pointer-events-none" />
                  </div>
                </div>

                <div>
                  <label className="block text-[#CCD6F6] mb-2 font-medium">Add New Images</label>
                  <div className="p-4 rounded-lg bg-[#1D2D50] border border-[#64FFDA] border-dashed">
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                      id="image-upload"
                    />
                    <label
                      htmlFor="image-upload"
                      className="flex flex-col items-center justify-center cursor-pointer py-4"
                    >
                      <svg className="w-12 h-12 text-[#64FFDA] mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      <span className="text-[#CCD6F6] text-lg">Click to upload images</span>
                      <span className="text-[#8892B0] text-sm mt-1">PNG, JPG, GIF up to 10MB</span>
                    </label>
                  </div>
                  {selectedImages.length > 0 && (
                    <div className="mt-4 relative">
                      <div className="flex space-x-4 overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-[#64FFDA] scrollbar-track-[#1D2D50] scrollbar-thumb-rounded-full scrollbar-track-rounded-full">
                        {selectedImages.map((file, index) => (
                          <div key={index} className="relative group flex-none">
                            <div className="w-80 h-48 rounded-lg overflow-hidden">
                              <img
                                src={URL.createObjectURL(file)}
                                alt={`Preview ${index}`}
                                className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-110"
                              />
                            </div>
                            <button
                              type="button"
                              onClick={() => removeSelectedImage(index)}
                              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-opacity transform hover:scale-110"
                            >
                              ✕
                            </button>
                          </div>
                        ))}
                      </div>
                      <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-[#112240] to-transparent pointer-events-none" />
                      <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-[#112240] to-transparent pointer-events-none" />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </form>
        </div>

        {/* Footer - Always visible */}
        <div className="p-6 border-t border-[#1D2D50] sticky bottom-0 bg-[#112240] rounded-b-lg">
          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 rounded-lg bg-[#1D2D50] text-[#CCD6F6] hover:bg-[#2A3E63] transition-colors duration-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="edit-place-form"
              disabled={uploading}
              className="px-6 py-2.5 rounded-lg bg-[#64FFDA] text-[#112240] hover:bg-[#45E6C4] disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 font-medium flex items-center space-x-2"
            >
              {uploading ? (
                <>
                  <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span>Saving...</span>
                </>
              ) : (
                <span>Save Changes</span>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://192.168.1.15:3000/api/';

export default function PlacesManagement() {
  const router = useRouter();
  const [places, setPlaces] = useState<Place[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [editingPlace, setEditingPlace] = useState<Place | null>(null);
  const [isAddingPlace, setIsAddingPlace] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  useEffect(() => {
    const token = localStorage.getItem('userToken');
    if (!token) {
      router.push('/');
      return;
    }
    fetchPlaces();
  }, [searchTerm, statusFilter]);

  const fetchPlaces = async () => {
    try {
      const token = localStorage.getItem('userToken');
      let url = `${API_URL}places?includeAll=true`;
      if (searchTerm) {
        url += `&search=${encodeURIComponent(searchTerm)}`;
      }
      if (statusFilter !== 'all') {
        url += `&status=${statusFilter}`;
      }
      console.log('Fetching places from URL:', url); // Log the URL being called

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) throw new Error('Failed to fetch places');
      const data = await response.json();
      console.log('Raw API Response Data:', JSON.stringify(data, null, 2)); // More detailed logging

      if (!data.success || !Array.isArray(data.data)) {
        throw new Error('Invalid API response format');
      }

      // Validate and transform the data
      const formattedPlaces = data.data.map((place: any) => {
        // Ensure images is always an array
        const images = Array.isArray(place.images) ? place.images : 
                      place.images ? [place.images] : 
                      place.image ? [place.image] : 
                      ['https://via.placeholder.com/400'];

        console.log('Place images:', images); // Debug log

        return {
          id: place.id || 0,
          name: place.name || 'Unnamed Place',
          description: place.description || 'No description available',
          location: place.location || 'Location not specified',
          created_at: place.created_at || new Date().toISOString(),
          image: images[0], // Keep first image as main image
          images: images, // Store all images
          rating: place.rating || 0,
          categories: Array.isArray(place.categories) ? place.categories : [],
          reviews: Array.isArray(place.reviews) ? place.reviews.map((review: {
            id: number;
            comment: string;
            rating: number;
            created_at: string | null;
            user: {
              id: number;
              name: string;
              profile_image: string;
            };
          }) => ({
            id: review.id,
            comment: review.comment,
            rating: review.rating,
            created_at: review.created_at,
            user: review.user
          })) : [],
          status: place.status || place.Status || 'pending',
          creator: place.creator
        };
      });

      console.log('Final Validated Places:', formattedPlaces.map(p => ({ id: p.id, status: p.status })));
      setPlaces(formattedPlaces);
      setLoading(false);
      setError('');
    } catch (error) {
      console.error('Error fetching places:', error);
      setError('Failed to load places');
      setLoading(false);
    }
  };

  const handleStatusChange = async (placeId: number, newStatus: 'approved' | 'rejected') => {
    try {
      const token = localStorage.getItem('userToken');
      const url = `${API_URL}places/${placeId}/status`;
      console.log('Updating place status:', { placeId, newStatus });

      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to parse error response' }));
        console.error('Error response:', errorData);
        throw new Error(errorData.error || `Failed to update place status: ${response.status}`);
      }

      const data = await response.json();
      console.log('Status update response:', data);

      if (data.success) {
        // Update the place in the local state with the status from the response
        setPlaces(places.map(place => 
          place.id === placeId 
            ? { ...place, ...data.data }
            : place
        ));
        setError('');

        // Show success message
        await Swal.fire({
          title: 'Success!',
          text: `Place has been ${newStatus}`,
          icon: 'success',
          background: '#112240',
          color: '#CCD6F6',
          confirmButtonColor: '#64FFDA',
          customClass: {
            popup: 'bg-[#112240] border border-[#1D2D50]',
            title: 'text-[#CCD6F6]',
            htmlContainer: 'text-[#8892B0]',
            confirmButton: 'bg-[#64FFDA] text-[#112240] hover:bg-[#45E6C4]'
          }
        });
      } else {
        throw new Error(data.error || 'Failed to update place status');
      }
    } catch (error) {
      console.error('Error updating place status:', error);
      setError(error instanceof Error ? error.message : 'Failed to update place status');
      
      await Swal.fire({
        title: 'Error!',
        text: error instanceof Error ? error.message : 'Failed to update place status',
        icon: 'error',
        background: '#112240',
        color: '#CCD6F6',
        confirmButtonColor: '#64FFDA',
        customClass: {
          popup: 'bg-[#112240] border border-[#1D2D50]',
          title: 'text-[#CCD6F6]',
          htmlContainer: 'text-[#8892B0]',
          confirmButton: 'bg-[#64FFDA] text-[#112240] hover:bg-[#45E6C4]'
        }
      });
    }
  };

  const handleEditPlace = async (updatedPlace: Partial<Place>, images: File[]) => {
    if (!editingPlace) return;
    
    try {
      const token = localStorage.getItem('userToken');
      if (!token) {
        throw new Error('No authentication token found');
      }

      // First, upload new images to Cloudinary if any
      const newImageUrls = [];
      if (images.length > 0) {
        for (const image of images) {
          const formData = new FormData();
          formData.append('file', image);
          formData.append('upload_preset', 'Ghassen123');

          const uploadResponse = await fetch('https://api.cloudinary.com/v1_1/dqh6arave/image/upload', {
            method: 'POST',
            body: formData
          });

          if (!uploadResponse.ok) {
            throw new Error('Failed to upload image to Cloudinary');
          }

          const data = await uploadResponse.json();
          newImageUrls.push(data.secure_url);
        }
      }

      // Prepare the update data
      const updateData = {
        name: updatedPlace.name,
        description: updatedPlace.description,
        location: updatedPlace.location,
        images: [...(updatedPlace.images || []), ...newImageUrls], // Combine existing and new images
        Categories: updatedPlace.categories?.map(cat => ({
          name: typeof cat === 'string' ? cat : cat.name,
          icon: typeof cat === 'string' ? '🏷️' : (cat.icon || '🏷️')
        }))
      };

      console.log('Sending update data:', updateData);

      // Update the place
      const updateResponse = await fetch(`${API_URL}advisor/place/${editingPlace.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData)
      });

      if (!updateResponse.ok) {
        const errorData = await updateResponse.json();
        throw new Error(errorData.error || 'Failed to update place');
      }

      const updatedData = await updateResponse.json();
      console.log('Update response:', updatedData);

      await fetchPlaces(); // Refresh the places list
      setEditingPlace(null); // Close the modal
    } catch (error) {
      console.error('Error in handleEditPlace:', error);
      setError(error instanceof Error ? error.message : 'Failed to update place');
      throw error;
    }
  };

  const handleAddPlace = async (newPlace: Partial<Place>, images: File[]) => {
    try {
      const token = localStorage.getItem('userToken');
      if (!token) {
        throw new Error('No authentication token found');
      }

      // First, upload images to Cloudinary if any
      const imageUrls = [];
      if (images.length > 0) {
        for (const image of images) {
          const formData = new FormData();
          formData.append('file', image);
          formData.append('upload_preset', 'Ghassen123');

          const uploadResponse = await fetch('https://api.cloudinary.com/v1_1/dqh6arave/image/upload', {
            method: 'POST',
            body: formData
          });

          if (!uploadResponse.ok) {
            throw new Error('Failed to upload image to Cloudinary');
          }

          const data = await uploadResponse.json();
          imageUrls.push(data.secure_url);
        }
      }

      // Prepare the place data
      const placeData = {
        name: newPlace.name,
        description: newPlace.description,
        location: newPlace.location,
        images: imageUrls,
        Categories: newPlace.categories?.map(cat => ({
          name: typeof cat === 'string' ? cat : cat.name,
          icon: typeof cat === 'string' ? '🏷️' : (cat.icon || '🏷️')
        }))
      };

      // Create the place using admin endpoint
      const response = await fetch(`${API_URL}admin/place`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(placeData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create place');
      }

      const responseData = await response.json();
      if (!responseData.success) {
        throw new Error(responseData.error || 'Failed to create place');
      }

      await fetchPlaces(); // Refresh the places list
      setIsAddingPlace(false); // Close the modal
    } catch (error) {
      console.error('Error in handleAddPlace:', error);
      setError(error instanceof Error ? error.message : 'Failed to create place');
      throw error;
    }
  };

  const handleDeletePlace = async (placeId: number) => {
    try {
      const result = await Swal.fire({
        title: 'Are you sure?',
        text: "You won't be able to revert this!",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#64FFDA',
        cancelButtonColor: '#8892B0',
        confirmButtonText: 'Yes, delete it!',
        cancelButtonText: 'Cancel',
        background: '#112240',
        color: '#CCD6F6',
        customClass: {
          popup: 'bg-[#112240] border border-[#1D2D50]',
          title: 'text-[#CCD6F6]',
          htmlContainer: 'text-[#8892B0]',
          confirmButton: 'bg-[#64FFDA] text-[#112240] hover:bg-[#45E6C4]',
          cancelButton: 'bg-[#1D2D50] text-[#CCD6F6] hover:bg-[#2A3E63]'
        }
      });

      if (result.isConfirmed) {
        const token = localStorage.getItem('userToken');
        const response = await fetch(`${API_URL}advisor/place/${placeId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error('Failed to delete place');
        }

        // Show success message
        await Swal.fire({
          title: 'Deleted!',
          text: 'Place has been deleted.',
          icon: 'success',
          background: '#112240',
          color: '#CCD6F6',
          confirmButtonColor: '#64FFDA',
          customClass: {
            popup: 'bg-[#112240] border border-[#1D2D50]',
            title: 'text-[#CCD6F6]',
            htmlContainer: 'text-[#8892B0]',
            confirmButton: 'bg-[#64FFDA] text-[#112240] hover:bg-[#45E6C4]'
          }
        });

        // Refresh the places list
        await fetchPlaces();
      }
    } catch (error) {
      console.error('Error deleting place:', error);
      Swal.fire({
        title: 'Error!',
        text: 'Failed to delete place.',
        icon: 'error',
        background: '#112240',
        color: '#CCD6F6',
        confirmButtonColor: '#64FFDA',
        customClass: {
          popup: 'bg-[#112240] border border-[#1D2D50]',
          title: 'text-[#CCD6F6]',
          htmlContainer: 'text-[#8892B0]',
          confirmButton: 'bg-[#64FFDA] text-[#112240] hover:bg-[#45E6C4]'
        }
      });
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-[#0A192F]">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-[#64FFDA]"></div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#0A192F]">
      <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
      
      <div className={`flex-1 p-6 transition-all duration-300 bg-[#0A192F] ${isSidebarOpen ? 'ml-64' : 'ml-20'}`}>
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold text-[#64FFDA]">Place Management</h1>
            <button
              onClick={() => setIsAddingPlace(true)}
              className="px-4 py-2 bg-[#64FFDA] text-[#112240] rounded-lg hover:bg-[#45E6C4] transition-colors duration-200"
            >
              Add New Place
            </button>
          </div>

          <div className="flex gap-4 mb-6">
            <input
              type="text"
              placeholder="Search places..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 p-3 rounded-lg bg-[#112240] text-[#CCD6F6] border border-[#1D2D50] focus:outline-none focus:border-[#64FFDA]"
            />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as 'all' | 'pending' | 'approved' | 'rejected')}
              className="p-3 rounded-lg bg-[#112240] text-[#CCD6F6] border border-[#1D2D50] focus:outline-none focus:border-[#64FFDA]"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded bg-red-500/10 text-red-400">
              {error}
            </div>
          )}
          
          <div className="grid gap-6">
            {places.map((place) => (
              <div 
                key={place.id} 
                className="bg-[#112240] rounded-lg p-6 shadow-lg hover:bg-[#1D2D50] transition-colors relative"
              >
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <h2 className="text-xl font-semibold text-[#CCD6F6]">{place.name}</h2>
                    {place.creator && (
                      <div className="flex items-center space-x-2 mt-2 text-[#8892B0]">
                        <img
                          src={place.creator.profile_image || 'https://via.placeholder.com/40'}
                          alt={`${place.creator.name}'s profile`}
                          className="w-8 h-8 rounded-full"
                        />
                        <span>{place.creator.name}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <span className={`px-3 py-1 rounded-full text-sm ${
                        place.status === 'approved' 
                          ? 'bg-green-500/20 text-green-400'
                          : place.status === 'rejected'
                          ? 'bg-red-500/20 text-red-400'
                          : 'bg-yellow-500/20 text-yellow-400'
                      }`}>
                        {place.status ? place.status.charAt(0).toUpperCase() + place.status.slice(1) : 'Pending'}
                      </span>
                      {place.status === 'pending' && (
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleStatusChange(place.id, 'approved')}
                            className="px-3 py-1 bg-green-500/20 text-green-400 rounded hover:bg-green-500/30 transition-colors"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleStatusChange(place.id, 'rejected')}
                            className="px-3 py-1 bg-red-500/20 text-red-400 rounded hover:bg-red-500/30 transition-colors"
                          >
                            Reject
                          </button>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleDeletePlace(place.id)}
                        className="p-2 rounded-full hover:bg-[#1D2D50] text-red-400 transition-colors"
                      >
                        <FiTrash2 size={18} />
                      </button>
                      <button
                        onClick={() => setEditingPlace(place)}
                        className="p-2 rounded-full hover:bg-[#1D2D50] text-[#64FFDA] transition-colors"
                      >
                        <FiEdit2 size={18} />
                      </button>
                    </div>
                  </div>
                </div>

                <div className="mb-4">
                  {place.images && place.images.length > 0 ? (
                    <div className="relative">
                      <div className="flex space-x-4 overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-[#64FFDA] scrollbar-track-[#1D2D50] scrollbar-thumb-rounded-full scrollbar-track-rounded-full">
                        {place.images.map((img, index) => (
                          <div 
                            key={index} 
                            className="flex-none w-80 h-48 relative rounded-lg overflow-hidden group"
                          >
                            <img
                              src={img}
                              alt={`${place.name} - ${index + 1}`}
                              className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-110"
                            />
                            {index === 0 && place.images.length > 1 && (
                              <div className="absolute bottom-2 right-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded-full text-sm">
                                {place.images.length} {place.images.length === 1 ? 'image' : 'images'}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                      <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-[#112240] to-transparent pointer-events-none" />
                      <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-[#112240] to-transparent pointer-events-none" />
                    </div>
                  ) : (
                    <div className="w-full h-48 rounded-lg overflow-hidden">
                      <img
                        src={place.image || 'https://via.placeholder.com/400'}
                        alt={place.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                </div>
                
                <p className="text-[#8892B0] mb-4 line-clamp-2">{place.description}</p>

                <div className="flex items-center space-x-4 text-[#8892B0] mb-4">
                  <span>📍 {place.location}</span>
                  <span>
                    {place.reviews.length > 0
                      ? `${place.reviews.length} ${place.reviews.length === 1 ? 'review' : 'reviews'}`
                      : 'No reviews yet'}
                  </span>
                </div>

                {place.reviews.length > 0 && (
                  <div className="mb-4">
                    <h3 className="text-[#CCD6F6] font-semibold mb-2">Latest Review</h3>
                    <div className="flex items-start space-x-3">
                      <img
                        src={place.reviews[0].user.profile_image}
                        alt={place.reviews[0].user.name}
                        className="w-8 h-8 rounded-full"
                      />
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="text-[#64FFDA]">{place.reviews[0].user.name}</span>
                          <span className="text-yellow-400">⭐ {place.reviews[0].rating}</span>
                        </div>
                        {place.reviews[0].comment && (
                          <p className="text-[#8892B0] mt-1">{place.reviews[0].comment}</p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {place.categories.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {place.categories.map((category, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 text-sm rounded-full bg-[#1D2D50] text-[#64FFDA]"
                      >
                        {typeof category === 'string' ? category : category.name}
                        {category.icon && <span className="ml-1">{category.icon}</span>}
                      </span>
                    ))}
                  </div>
                )}

                <div className="text-right">
                  <span className="text-sm text-[#8892B0]">
                    {new Date(place.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {editingPlace && (
        <EditModal
          place={editingPlace}
          isOpen={!!editingPlace}
          onClose={() => setEditingPlace(null)}
          onSave={handleEditPlace}
        />
      )}

      {isAddingPlace && (
        <EditModal
          place={{
            id: 0,
            name: '',
            description: '',
            location: '',
            created_at: new Date().toISOString(),
            image: '',
            images: [],
            rating: 0,
            categories: [],
            reviews: [],
            status: 'pending',
            creator: null
          }}
          isOpen={true}
          onClose={() => setIsAddingPlace(false)}
          onSave={handleAddPlace}
        />
      )}
    </div>
  );
} 