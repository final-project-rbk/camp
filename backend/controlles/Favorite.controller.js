const { Favorite, Place, Media, Review } = require('../models');

const favoriteController = {
  getUserFavorites: async (req, res) => {
    try {
      // Get userId from params, but validate against authenticated user
      const { userId } = req.params;
      
      // Ensure user is only accessing their own favorites (if not admin)
      if (req.user && req.user.id !== parseInt(userId) && req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          error: 'You are not authorized to view these favorites'
        });
      }
      
      // Find all favorites with associated place data
      const favorites = await Favorite.findAll({
        where: { userId: parseInt(userId) },
        include: [{
          model: Place,
          required: true, // Only return favorites that have associated places
          include: [
            {
              model: Media,
              attributes: ['url'],
              required: false
            },
            {
              model: Review,
              attributes: ['rating'],
              required: false
            }
          ]
        }]
      });

      // Format the response data
      const formattedFavorites = favorites.map(favorite => {
        const place = favorite.place;
        if (!place) return null;

        // Get the first image URL or use placeholder
        const imageUrl = place.media && place.media.length > 0 
          ? place.media[0].url 
          : 'https://via.placeholder.com/400';

        // Get images from place.images if available
        let images = [imageUrl]; // Default with the media image or placeholder
        
        // Check if place has images field and use it if available
        if (place.images) {
          try {
            console.log('Favorites - Raw images data type:', typeof place.images);
            console.log('Favorites - Raw images data:', place.images);
            
            // If it's a JSON string, parse it
            if (typeof place.images === 'string') {
              // Try to parse if it looks like JSON
              if (place.images.startsWith('[') && place.images.endsWith(']')) {
                try {
                  const parsedImages = JSON.parse(place.images);
                  if (Array.isArray(parsedImages) && parsedImages.length > 0) {
                    images = parsedImages;
                    console.log('Favorites - Successfully parsed JSON images array:', images);
                  }
                } catch (parseError) {
                  console.error('Favorites - Error parsing JSON images:', parseError);
                  // Fallback to treating as a single image URL
                  images = [place.images];
                }
              } else {
                // Not JSON, treat as a single image URL
                images = [place.images];
              }
            } 
            // If it's already an array
            else if (Array.isArray(place.images)) {
              images = place.images.length > 0 ? place.images : [imageUrl];
              console.log('Favorites - Using array images:', images);
            }
          } catch (e) {
            console.error('Favorites - Error processing images:', e);
          }
        }

        // Calculate average rating
        const ratings = place.reviews || [];
        const rating = ratings.length > 0
          ? Number((ratings.reduce((acc, rev) => acc + rev.rating, 0) / ratings.length).toFixed(1))
          : 0;

        return {
          id: place.id.toString(),
          name: place.name,
          location: place.location,
          images: images, // Return array of images instead of single image
          rating: rating
        };
      }).filter(Boolean); // Remove any null entries

      res.status(200).json({
        success: true,
        data: formattedFavorites
      });
    } catch (error) {
      console.error('Error in getUserFavorites:', error);
      res.status(500).json({
        success: false,
        error: 'Error fetching favorites',
        details: error.message
      });
    }
  },

  toggleFavorite: async (req, res) => {
    try {
      // Get placeId from request body
      const { placeId } = req.body;
      
      // Use authenticated user ID from req.user instead of request body
      if (!req.user || !req.user.id) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required'
        });
      }
      
      const userId = req.user.id;
      
      // Validate required fields
      if (!placeId) {
        return res.status(400).json({
          success: false,
          error: 'Missing required placeId'
        });
      }
      
      const existing = await Favorite.findOne({
        where: { 
          userId: parseInt(userId), 
          placeId: parseInt(placeId) 
        }
      });

      if (existing) {
        await existing.destroy();
        res.status(200).json({
          success: true,
          message: 'Removed from favorites'
        });
      } else {
        await Favorite.create({ 
          userId: parseInt(userId), 
          placeId: parseInt(placeId) 
        });
        res.status(200).json({
          success: true,
          message: 'Added to favorites'
        });
      }
    } catch (error) {
      console.error('Error in toggleFavorite:', error);
      res.status(500).json({
        success: false,
        error: 'Error toggling favorite'
      });
    }
  }
};

module.exports = favoriteController;
