const express = require('express');
const router = express.Router();
const cloudinary = require('../config/cloudinary');

// Route to get upload signature
router.get('/signature', async (req, res) => {
  try {
    const timestamp = Math.round((new Date).getTime() / 1000);
    const signature = cloudinary.utils.api_sign_request({
      timestamp: timestamp,
      upload_preset: 'Ghassen123'
    }, process.env.CLOUDINARY_API_SECRET);

    res.json({
      timestamp,
      signature,
      cloudName: process.env.CLOUDINARY_CLOUD_NAME,
      apiKey: process.env.CLOUDINARY_API_KEY
    });
  } catch (error) {
    console.error('Error generating signature:', error);
    res.status(500).json({ error: 'Failed to generate upload signature' });
  }
});

module.exports = router; 