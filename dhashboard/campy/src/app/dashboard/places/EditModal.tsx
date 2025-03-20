import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';

const ImagePreview = ({ url, onDelete }: { url: string; onDelete: () => void }) => (
  <div className="relative w-24 h-24 group">
    <Image
      src={url}
      alt="Preview"
      fill
      className="object-cover rounded-lg"
    />
    <button
      onClick={onDelete}
      className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
    >
      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
      </svg>
    </button>
  </div>
);

const EditModal = ({ place, onClose, onSave }: EditModalProps) => {
  const [name, setName] = useState(place.name);
  const [description, setDescription] = useState(place.description);
  const [location, setLocation] = useState(place.location);
  const [images, setImages] = useState<File[]>([]);
  const [existingImages, setExistingImages] = useState<string[]>(() => {
    if (Array.isArray(place.images) && place.images.length > 0) {
      return place.images;
    }
    return place.image ? [place.image] : [];
  });
  const [selectedCategories, setSelectedCategories] = useState<string[]>(
    place.categories?.map(cat => typeof cat === 'string' ? cat : cat.name) || []
  );
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Create preview URLs for newly added images
    const urls = images.map(file => URL.createObjectURL(file));
    setPreviewUrls(urls);

    // Cleanup function to revoke object URLs
    return () => {
      urls.forEach(url => URL.revokeObjectURL(url));
    };
  }, [images]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      const validFiles = filesArray.filter(file => file.type.startsWith('image/'));
      setImages(prev => [...prev, ...validFiles]);
    }
  };

  const handleDeleteExistingImage = (index: number) => {
    setExistingImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleDeleteNewImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
    setPreviewUrls(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      name,
      description,
      location,
      images: existingImages,
      categories: selectedCategories.map(name => ({ name }))
    }, images);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
          <h2 className="text-xl font-semibold">Edit Place</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form id="edit-place-form" onSubmit={handleSubmit} className="space-y-6 p-6">
          <div>
            <label className="block text-sm font-medium text-gray-700">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Location</label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Images</label>
            <div className="grid grid-cols-4 gap-4 mb-4">
              {existingImages.map((url, index) => (
                <ImagePreview
                  key={`existing-${index}`}
                  url={url}
                  onDelete={() => handleDeleteExistingImage(index)}
                />
              ))}
              {previewUrls.map((url, index) => (
                <ImagePreview
                  key={`new-${index}`}
                  url={url}
                  onDelete={() => handleDeleteNewImage(index)}
                />
              ))}
            </div>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageChange}
              accept="image/*"
              multiple
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Add Images
            </button>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Categories</label>
            <div className="grid grid-cols-3 gap-4">
              {categories.map((category) => (
                <button
                  key={category.name}
                  type="button"
                  onClick={() => {
                    setSelectedCategories(prev =>
                      prev.includes(category.name)
                        ? prev.filter(cat => cat !== category.name)
                        : [...prev, category.name]
                    );
                  }}
                  className={`flex items-center justify-center p-4 rounded-lg border ${
                    selectedCategories.includes(category.name)
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <span className="mr-2">{category.icon}</span>
                  {category.name}
                </button>
              ))}
            </div>
          </div>
        </form>

        <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4 flex justify-end space-x-4">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="edit-place-form"
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditModal; 