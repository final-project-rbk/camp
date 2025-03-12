const { Favorite, Place, Media, Review } = require('../models');

const favoriteController = {
  getUserFavorites: async (req, res) => {
    try {
      const { userId } = req.params;
      
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

        // Calculate average rating
        const ratings = place.reviews || [];
        const rating = ratings.length > 0
          ? Number((ratings.reduce((acc, rev) => acc + rev.rating, 0) / ratings.length).toFixed(1))
          : 0;

        return {
          id: place.id.toString(),
          name: place.name,
          location: place.location,
          image: imageUrl,
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
      const { userId, placeId } = req.body;
      
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
