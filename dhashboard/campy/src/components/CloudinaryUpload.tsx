'use client';
import { useEffect, useRef, useState } from 'react';
import { UploadCloud } from 'lucide-react';

declare global {
  interface Window {
    cloudinary: any;
    cloudinaryScriptLoaded?: boolean;
  }
}

interface CloudinaryUploadProps {
  onImageUpload: (url: string) => void;
  currentImage?: string;
}

export default function CloudinaryUpload({ onImageUpload, currentImage }: CloudinaryUploadProps) {
  const [imageUrl, setImageUrl] = useState<string>(currentImage || '');
  const widgetRef = useRef<any>(null);
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'dqh6arave';
  const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || 'Ghassen123';
  const [isUploading, setIsUploading] = useState(false);
  const [scriptReady, setScriptReady] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Update local state if the prop changes
    if (currentImage) {
      setImageUrl(currentImage);
    }
  }, [currentImage]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      // First check if script is already marked as loaded
      if (window.cloudinaryScriptLoaded && window.cloudinary) {
        console.log('Cloudinary script already loaded');
        setScriptReady(true);
        initializeWidget();
        return;
      }

      // Otherwise, set up a listener for script load
      const checkCloudinaryLoaded = () => {
        if (window.cloudinary) {
          console.log('Cloudinary found in window object');
          setScriptReady(true);
          initializeWidget();
          return true;
        }
        return false;
      };

      // Try immediately
      if (!checkCloudinaryLoaded()) {
        // If not loaded, set up an interval to check
        const intervalId = setInterval(() => {
          if (checkCloudinaryLoaded()) {
            clearInterval(intervalId);
          }
        }, 500);

        // Cleanup interval
        return () => clearInterval(intervalId);
      }
    }
  }, []);

  const initializeWidget = () => {
    // Don't initialize if already initialized
    if (widgetRef.current) return;
    
    // Initialize the Cloudinary widget
    if (window.cloudinary) {
      console.log('Initializing Cloudinary widget with:', { cloudName, uploadPreset });
      
      try {
        widgetRef.current = window.cloudinary.createUploadWidget(
          {
            cloudName: cloudName,
            uploadPreset: uploadPreset,
            sources: ['local', 'url', 'camera'],
            multiple: false,
            folder: 'campy/hints',
            cropping: true,
            resourceType: 'image',
            maxFileSize: 5000000, // 5MB limit
          },
          (error: any, result: any) => {
            console.log('Cloudinary callback:', { error, result });
            
            if (!error && result && result.event === 'success') {
              const url = result.info.secure_url;
              console.log('Upload successful:', url);
              setImageUrl(url);
              onImageUpload(url);
              setIsUploading(false);
            } else if (result && result.event === 'start') {
              console.log('Upload started');
              setIsUploading(true);
            } else if (result && result.event === 'close') {
              console.log('Widget closed');
              setIsUploading(false);
            } else if (error) {
              console.error('Cloudinary upload error:', error);
              setIsUploading(false);
            }
          }
        );
        console.log('Widget created successfully:', widgetRef.current);
      } catch (err) {
        console.error('Error creating Cloudinary widget:', err);
      }
    }
  };

  // Alternative direct upload method if widget fails
  const handleDirectUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', uploadPreset);
      formData.append('cloud_name', cloudName);
      formData.append('folder', 'campy/hints');

      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
        {
          method: 'POST',
          body: formData,
        }
      );

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('Upload successful:', data);
      
      if (data.secure_url) {
        setImageUrl(data.secure_url);
        onImageUpload(data.secure_url);
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('Image upload failed. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const openWidget = () => {
    if (!scriptReady || isUploading) {
      // Fallback to direct file upload if widget not available
      if (fileInputRef.current) {
        fileInputRef.current.click();
      }
      return;
    }
    
    if (widgetRef.current) {
      console.log('Opening widget...');
      try {
        widgetRef.current.open();
      } catch (err) {
        console.error('Error opening widget:', err);
        // Fallback to direct file upload
        if (fileInputRef.current) {
          fileInputRef.current.click();
        }
      }
    } else {
      console.error('Cloudinary widget not initialized');
      // Fallback to direct file upload
      if (fileInputRef.current) {
        fileInputRef.current.click();
      }
    }
  };

  return (
    <div className="w-full">
      {/* Hidden file input for direct upload fallback */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleDirectUpload}
        accept="image/*"
        className="hidden"
      />
      
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
            disabled={isUploading}
          >
            {isUploading ? (
              <div className="animate-spin h-4 w-4 border-2 border-white rounded-full border-t-transparent" />
            ) : (
              <UploadCloud size={16} className="text-white" />
            )}
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
          disabled={isUploading}
        >
          {isUploading ? (
            <>
              <div className="animate-spin h-8 w-8 border-2 border-[#64FFDA] rounded-full border-t-transparent mb-2" />
              <span className="text-sm" style={{ color: '#CCD6F6' }}>
                Uploading...
              </span>
            </>
          ) : !scriptReady ? (
            <>
              <UploadCloud size={32} className="text-[#64FFDA] mb-2" />
              <span className="text-sm" style={{ color: '#CCD6F6' }}>
                Click to upload image
              </span>
              <span className="text-xs mt-1" style={{ color: '#8892B0' }}>
                JPG, PNG or GIF up to 5MB
              </span>
            </>
          ) : (
            <>
              <UploadCloud size={32} className="text-[#64FFDA] mb-2" />
              <span className="text-sm" style={{ color: '#CCD6F6' }}>
                Click to upload image
              </span>
              <span className="text-xs mt-1" style={{ color: '#8892B0' }}>
                JPG, PNG or GIF up to 5MB
              </span>
            </>
          )}
        </button>
      )}
    </div>
  );
} 