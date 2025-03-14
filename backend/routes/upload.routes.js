const express = require('express');
const router = express.Router();
const { v2: cloudinary } = require('cloudinary');
const  authMiddleware  = require('../middleware/auth.middleware');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Generate signature for client-side upload
router.post('/signature', authMiddleware, async (req, res) => {
  try {
    const timestamp = Math.round((new Date).getTime() / 1000);
    
    // Generate the signature
    const signature = cloudinary.utils.api_sign_request({
      timestamp: timestamp,
      upload_preset: 'Ghassen123'
    }, process.env.CLOUDINARY_API_SECRET);

    // Return the signature and timestamp
    res.json({
      success: true,
      signature: {
        signature,
        timestamp,
        api_key: process.env.CLOUDINARY_API_KEY
      }
    });
  } catch (error) {
    console.error('Error generating upload signature:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate upload signature'
    });
  }
});

module.exports = router; 