'use client';
import { useEffect, useRef, useState } from 'react';
import { UploadCloud } from 'lucide-react';

declare global {
  interface Window {
    cloudinary: any;
  }
}

interface CloudinaryUploadProps {
  onImageUpload: (url: string) => void;
  currentImage?: string;
}

export default function CloudinaryUpload({ onImageUpload, currentImage }: CloudinaryUploadProps) {
  const [imageUrl, setImageUrl] = useState<string>(currentImage || '');
  const widgetRef = useRef<any>(null);
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'your-cloud-name';

  useEffect(() => {
    // Update local state if the prop changes
    if (currentImage) {
      setImageUrl(currentImage);
    }
  }, [currentImage]);

  useEffect(() => {
    // Initialize the Cloudinary widget
    if (window.cloudinary) {
      widgetRef.current = window.cloudinary.createUploadWidget(
        {
          cloudName: cloudName,
          uploadPreset: 'campy_uploads', // Create this preset in your Cloudinary dashboard
          sources: ['local', 'url', 'camera'],
          multiple: false,
          folder: 'campy/hints', // Organize uploads in this folder
          cropping: true,
          resourceType: 'image',
          maxFileSize: 5000000, // 5MB limit
        },
        (error: any, result: any) => {
          if (!error && result && result.event === 'success') {
            const url = result.info.secure_url;
            setImageUrl(url);
            onImageUpload(url);
          } else if (error) {
            console.error('Cloudinary upload error:', error);
            // You can add toast notification here if you want to show errors to users
          }
        }
      );
    }
    
    // Cleanup widget on unmount
    return () => {
      if (widgetRef.current && widgetRef.current.close) {
        widgetRef.current.close();
      }
    };
  }, [cloudName, onImageUpload]);

  const openWidget = () => {
    if (widgetRef.current) {
      widgetRef.current.open();
    }
  };

  return (
    <div className="w-full">
      {imageUrl ? (
        <div className="relative rounded-md overflow-hidden">
          <img 
            src={imageUrl} 
            alt="Uploaded" 
            className="w-full h-48 object-cover" 
          />
          <button
            type="button"
            onClick={openWidget}
            className="absolute bottom-2 right-2 bg-gray-800 bg-opacity-70 p-2 rounded-md hover:bg-opacity-90 transition-all"
          >
            <UploadCloud size={16} className="text-white" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={openWidget}
          className="w-full p-4 border-2 border-dashed rounded-md flex flex-col items-center justify-center h-48 transition-all"
          style={{ 
            borderColor: 'rgba(100, 255, 218, 0.3)', 
            backgroundColor: 'rgba(100, 255, 218, 0.05)' 
          }}
        >
          <UploadCloud size={32} className="text-[#64FFDA] mb-2" />
          <span className="text-sm" style={{ color: '#CCD6F6' }}>
            Click to upload image
          </span>
          <span className="text-xs mt-1" style={{ color: '#8892B0' }}>
            JPG, PNG or GIF up to 5MB
          </span>
        </button>
      )}
    </div>
  );
} 