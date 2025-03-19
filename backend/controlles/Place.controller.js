const { Place, Media, Review, Categorie, Citiria, PlaceUser } = require('../models');

const placeController = {
  // Get all places with related data
  getAllPlaces: async (req, res) => {
    try {
      const { limit, category } = req.query;
      console.log('Fetching places with category:', category);
      
      const include = [
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
          required: category ? true : false // Make it required only when filtering by category
        }
      ];

      const whereClause = {
        status: 'approved'
      };

      // If category is specified, add it to the include conditions
      if (category) {
        include[2].where = { name: category };
      }

      const places = await Place.findAll({
        include,
        where: whereClause,
        distinct: true // Add this to avoid duplicate places
      });

      const formattedPlaces = places.map(place => {
        // Get image from Media or fallback to images field
        let imageUrl = 'https://via.placeholder.com/400';
        let images = [imageUrl]; // Default image
        
        // First try getting images from Media
        if (place.Media && place.Media.length > 0) {
          images = place.Media.map(media => media.url);
        } 
        // Then try the images field
        else if (place.images) {
          try {
            // If it's a JSON string, parse it
            if (typeof place.images === 'string') {
              const parsedImages = JSON.parse(place.images);
              if (Array.isArray(parsedImages) && parsedImages.length > 0) {
                images = parsedImages;
              } else {
                images = [place.images]; // Treat as single image
              }
            } 
            // If it's already an array
            else if (Array.isArray(place.images) && place.images.length > 0) {
              images = place.images;
            }
          } catch (e) {
            console.error('Error parsing images:', e);
            images = [place.images]; // Fallback to treating as single image
          }
        }

        return {
          id: place.id,
          name: place.name,
          description: place.description,
          location: place.location,
          images: images, // Return array instead of single image
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
        console.log('Using media images:', images);
      } else if (place.images) {
        console.log('PlaceById - Raw images data type:', typeof place.images);
        console.log('PlaceById - Raw images data:', place.images);
        
        try {
          if (Array.isArray(place.images)) {
            images = place.images.length > 0 ? place.images : images;
            console.log('PlaceById - Using array images:', images);
          } else if (typeof place.images === 'string') {
            // Try to parse if it looks like JSON
            if (place.images.startsWith('[') && place.images.endsWith(']')) {
              try {
                const parsedImages = JSON.parse(place.images);
                if (Array.isArray(parsedImages) && parsedImages.length > 0) {
                  images = parsedImages;
                  console.log('PlaceById - Successfully parsed JSON images array:', images);
                }
              } catch (parseError) {
                console.error('PlaceById - Error parsing JSON images:', parseError);
                // Fallback to treating as a single image URL
                images = [place.images];
              }
            } else {
              // Not JSON, treat as a single image URL
              images = [place.images];
            }
          }
        } catch (e) {
          console.error('PlaceById - Error processing images:', e);
          images = typeof place.images === 'string' ? [place.images] : images;
        }
      }

      // Add criteria data separately after fetching the place
      const placeCriteria = await Citiria.findAll({
        include: [{
          model: PlaceUser,
          where: { placeId: id },
          required: false
        }]
      });

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
        })) || [],
        critiria: placeCriteria.map(crit => ({
          id: crit.id,
          name: crit.name,
          percentage: crit.purcent,
          value: crit.PlaceUsers && crit.PlaceUsers.length > 0 ? crit.PlaceUsers[0].value : 0
        })) || [],
        distance: 5.2,
        amenities: ["water", "restrooms", "fire_pit", "picnic_table"],
        terrain_type: "forest",
        availability: "open",
        site_type: "tent",
        accessibility: "easy",
        weather: {
          current: {
            temp: 22,
            condition: "Sunny",
            humidity: 40,
          },
          forecast: [
            { day: "Mon", temp: 22, condition: "Sunny" },
            { day: "Tue", temp: 20, condition: "Cloudy" },
            { day: "Wed", temp: 18, condition: "Rain" },
          ],
        },
        cost: 25,
        user_rating: 4.2,
        safety: ["Watch for wildlife", "Steep trails nearby"]
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
  },

  // Rate a place (add a star rating)
  ratePlace: async (req, res) => {
    try {
      const { userId, placeId, rating, comment } = req.body;
      
      if (!userId || !placeId || !rating || rating < 1 || rating > 5) {
        return res.status(400).json({
          success: false,
          error: 'Invalid request. Required fields: userId, placeId, rating (1-5)'
        });
      }
      
      // First check if user has already reviewed this place
      const existingReview = await Review.findOne({
        where: {
          userId,
          placeId
        }
      });
      
      let review;
      
      if (existingReview) {
        // Update existing review
        review = await existingReview.update({
          rating,
          comment: comment || existingReview.comment
        });
      } else {
        // Create new review
        review = await Review.create({
          userId,
          placeId,
          rating,
          comment: comment || ''
        });
      }
      
      // Update place's average rating
      const reviews = await Review.findAll({
        where: { placeId },
        attributes: ['rating']
      });
      
      if (reviews.length > 0) {
        const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
        const averageRating = parseFloat((totalRating / reviews.length).toFixed(1));
        
        await Place.update({ rating: averageRating }, { where: { id: placeId } });
      }
      
      res.status(200).json({
        success: true,
        data: review
      });
    } catch (error) {
      console.error('Error in ratePlace:', error);
      res.status(500).json({
        success: false,
        error: 'Error saving place rating',
        details: error.message
      });
    }
  },
  
  // Get a user's rating for a specific place
  getUserPlaceRating: async (req, res) => {
    try {
      const { placeId, userId } = req.params;
      
      const review = await Review.findOne({
        where: {
          placeId,
          userId
        },
        attributes: ['id', 'rating', 'comment', 'created_at']
      });
      
      res.status(200).json({
        success: true,
        data: review || null
      });
    } catch (error) {
      console.error('Error in getUserPlaceRating:', error);
      res.status(500).json({
        success: false,
        error: 'Error fetching user rating',
        details: error.message
      });
    }
  }
};

module.exports = placeController;
