'use client';

import { useEffect } from 'react';

const CloudinaryScript = () => {
  useEffect(() => {
    // Check if cloudinary is already loaded
    if (typeof window !== 'undefined') {
      if (window.cloudinary) {
        console.log('Cloudinary script already loaded');
        window.cloudinaryScriptLoaded = true;
      } else {
        // Set up an interval to check until it's loaded
        const intervalId = setInterval(() => {
          if (window.cloudinary) {
            console.log('Cloudinary script loaded successfully');
            window.cloudinaryScriptLoaded = true;
            clearInterval(intervalId);
          }
        }, 500);

        // Cleanup interval on component unmount
        return () => clearInterval(intervalId);
      }
    }
  }, []);

  return null; // This component doesn't render anything
};

export default CloudinaryScript; 