const { Place, Media, Review, Categorie } = require('../models');

const placeController = {
  // Get all places with related data
  getAllPlaces: async (req, res) => {
    try {
      const { limit, category } = req.query;
      
      const places = await Place.findAll({
        include: [
          {
            model: Media,
            attributes: ['url', 'type'],
            required: false
          },
          {
            model: Review,
            attributes: ['rating'],
            required: false
          },
          {
            model: Categorie,
            through: { attributes: [] },
            attributes: ['name', 'icon'],
            required: false
          }
        ],
        where: {
          status: 'approved'
        }
      });

      const formattedPlaces = places.map(place => {
        // Get image from Media or fallback to images field
        let imageUrl = 'https://via.placeholder.com/400';
        if (place.Media && place.Media.length > 0) {
          imageUrl = place.Media[0].url;
        } else if (place.images && Array.isArray(place.images) && place.images.length > 0) {
          imageUrl = place.images[0];
        } else if (place.images && typeof place.images === 'string') {
          imageUrl = place.images;
        }

        return {
          id: place.id,
          name: place.name,
          description: place.description,
          location: place.location,
          image: imageUrl,
          rating: Number(
            (place.Reviews?.reduce((acc, rev) => acc + (rev.rating || 0), 0) / 
             (place.Reviews?.length || 1)).toFixed(1)
          ),
          categories: place.Categories?.map(cat => ({
            name: cat.name,
            icon: cat.icon
          })) || []
        };
      });

      const limitedPlaces = limit ? formattedPlaces.slice(0, parseInt(limit)) : formattedPlaces;

      res.status(200).json({
        success: true,
        data: limitedPlaces
      });
    } catch (error) {
      console.error('Error in getAllPlaces:', error);
      res.status(500).json({
        success: false,
        error: 'Error fetching places',
        details: error.message
      });
    }
  },

  // Get place by ID
  getPlaceById: async (req, res) => {
    try {
      const { id } = req.params;

      const place = await Place.findByPk(parseInt(id), {
        include: [
          {
            model: Media,
            attributes: ['url', 'type'],
            required: false
          },
          {
            model: Review,
            attributes: ['id', 'rating', 'comment', 'created_at'],
            required: false
          },
          {
            model: Categorie,
            through: { attributes: [] },
            attributes: ['name', 'icon'],
            required: false
          }
        ]
      });

      if (!place) {
        return res.status(404).json({
          success: false,
          error: 'Place not found'
        });
      }

      // Handle images from both Media and images field
      let images = ['https://via.placeholder.com/400'];
      if (place.Media && place.Media.length > 0) {
        images = place.Media.map(media => media.url);
      } else if (place.images) {
        if (Array.isArray(place.images)) {
          images = place.images;
        } else if (typeof place.images === 'string') {
          images = [place.images];
        }
      }

      const formattedPlace = {
        id: place.id,
        name: place.name,
        description: place.description,
        location: place.location,
        images: images,
        rating: Number(
          (place.Reviews?.reduce((acc, rev) => acc + (rev.rating || 0), 0) / 
           (place.Reviews?.length || 1)).toFixed(1)
        ) || 0,
        reviews: place.Reviews?.map(review => ({
          id: review.id,
          rating: review.rating,
          comment: review.comment || '',
          created_at: review.created_at,
          user: {
            name: 'Anonymous',
            avatar: 'https://via.placeholder.com/40'
          }
        })) || [],
        categories: place.Categories?.map(cat => ({
          name: cat.name,
          icon: cat.icon || '🏷️'
        })) || []
      };

      console.log('Sending place with images:', formattedPlace.images);

      res.status(200).json({
        success: true,
        data: formattedPlace
      });

    } catch (error) {
      console.error('Error in getPlaceById:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        details: error.message
      });
    }
  }
};

module.exports = placeController;
