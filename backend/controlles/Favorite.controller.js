const { Favorite, Place, Media, Review } = require('../models');

const favoriteController = {
  getUserFavorites: async (req, res) => {
    try {
      const { userId } = req.params;
      
      const favorites = await Favorite.findAll({
        where: { userId: parseInt(userId) },
        include: [{
          model: Place,
          as: 'place',
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

      if (!favorites || favorites.length === 0) {
        return res.status(200).json({
          success: true,
          data: []
        });
      }

      // Format the response data
      const formattedFavorites = favorites.map(fav => {
        const place = fav.place;
        if (!place) return null;

        // Get the first image URL
        const imageUrl = place.Media && place.Media.length > 0 
          ? place.Media[0].url 
          : 'https://via.placeholder.com/400';

        // Calculate average rating
        const rating = place.Reviews && place.Reviews.length > 0
          ? Number((place.Reviews.reduce((acc, rev) => acc + rev.rating, 0) / place.Reviews.length).toFixed(1))
          : 0;

        return {
          id: place.id.toString(),
          name: place.name,
          location: place.location,
          image: imageUrl,
          rating: rating
        };
      }).filter(item => item !== null);

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
