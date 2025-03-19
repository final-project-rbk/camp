const { Place, Media, Review, Categorie, Citiria, PlaceUser, User } = require('../models');

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

  // Create new place
  createPlace: async (req, res) => {
    try {
      const { name, description, location, images, categories } = req.body;
      console.log('Received data:', { name, description, location, images, categories });

      // Create the place without explicitly setting timestamps
      const placeData = {
        name,
        description,
        location,
        images: images ? [images] : [],
        status: 'pending'
      };

      // Remove timestamp fields from the create operation
      const place = await Place.create(placeData, {
        fields: ['name', 'description', 'location', 'images', 'status']
      });

      // Handle categories if they exist
      if (categories && Array.isArray(categories) && categories.length > 0) {
        try {
          await place.addCategories(categories);
        } catch (categoryError) {
          console.error('Error adding categories:', categoryError);
        }
      }

      // Fetch the created place with its categories
      const createdPlace = await Place.findByPk(place.id, {
        include: [{
          model: Categorie,
          through: { attributes: [] },
          attributes: ['id', 'name', 'icon']
        }]
      });

      res.status(201).json({
        success: true,
        data: {
          id: createdPlace.id,
          name: createdPlace.name,
          description: createdPlace.description,
          location: createdPlace.location,
          image: createdPlace.images?.[0] || null,
          status: createdPlace.status,
          categories: createdPlace.Categories?.map(cat => ({
            id: cat.id,
            name: cat.name,
            icon: cat.icon
          })) || []
        }
      });
    } catch (error) {
      console.error('Detailed create place error:', error);
      res.status(500).json({
        success: false,
        error: 'Error creating place',
        details: error.message
      });
    }
  },

  // Update place
  updatePlace: async (req, res) => {
    try {
      const { id } = req.params;
      const { name, description, location, image, categoryIds } = req.body;

      const place = await Place.findByPk(id);
      if (!place) {
        return res.status(404).json({
          success: false,
          error: 'Place not found'
        });
      }

      await place.update({
        name,
        description,
        location,
        images: image // Store single image in images array
      });

      if (categoryIds && Array.isArray(categoryIds)) {
        await place.setCategories(categoryIds);
      }

      res.status(200).json({
        success: true,
        data: place
      });
    } catch (error) {
      console.error('Error in updatePlace:', error);
      res.status(500).json({
        success: false,
        error: 'Error updating place',
        details: error.message
      });
    }
  },

  // Delete place
  deletePlace: async (req, res) => {
    try {
      const { id } = req.params;
      
      const place = await Place.findByPk(id);
      if (!place) {
        return res.status(404).json({
          success: false,
          error: 'Place not found'
        });
      }

      await place.destroy();

      res.status(200).json({
        success: true,
        message: 'Place deleted successfully'
      });
    } catch (error) {
      console.error('Error in deletePlace:', error);
      res.status(500).json({
        success: false,
        error: 'Error deleting place',
        details: error.message
      });
    }
  },

  // Update place status
  updatePlaceStatus: async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;

      if (!['pending', 'approved', 'rejected'].includes(status)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid status value'
        });
      }

      const place = await Place.findByPk(id);
      if (!place) {
        return res.status(404).json({
          success: false,
          error: 'Place not found'
        });
      }

      await place.update({ status });

      res.status(200).json({
        success: true,
        data: place
      });
    } catch (error) {
      console.error('Error in updatePlaceStatus:', error);
      res.status(500).json({
        success: false,
        error: 'Error updating place status',
        details: error.message
      });
    }
  },

  // Get places by status
  getAllPlacesAdmin: async (req, res) => {
    try {
      const places = await Place.findAll({
        include: [
          {
            model: Media,
            attributes: ['url', 'type'],
            required: false
          },
          {
            model: Review,
            attributes: ['id', 'rating', 'comment', 'createdAt'],
            include: [
              {
                model: User,
                attributes: ['first_name', 'last_name']
              }
            ],
            required: false
          },
          {
            model: Categorie,
            through: { attributes: [] },
            attributes: ['id', 'name', 'icon'],
            required: false
          }
        ],
        order: [['createdAt', 'DESC']]
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
          status: place.status || 'pending',
          rating: Number(
            (place.Reviews?.reduce((acc, rev) => acc + (rev.rating || 0), 0) / 
             (place.Reviews?.length || 1)).toFixed(1)
          ),
          categories: place.Categories?.map(cat => ({
            id: cat.id,
            name: cat.name,
            icon: cat.icon || '🏷️'
          })) || [],
          reviews: place.Reviews?.map(review => ({
            id: review.id,
            rating: review.rating,
            comment: review.comment || '',
            user: {
              first_name: review.User?.first_name || 'Anonymous',
              last_name: review.User?.last_name || 'User'
            },
            createdAt: review.createdAt
          })) || [],
          created_at: place.createdAt,
          updated_at: place.updatedAt
        };
      });

      res.status(200).json({
        success: true,
        data: formattedPlaces
      });
    } catch (error) {
      console.error('Error in getAllPlacesAdmin:', error);
      res.status(500).json({
        success: false,
        error: 'Error fetching places for admin',
        details: error.message
      });
    }
  },

  // Add this function to get places by status for admin
  getPlacesByStatusAdmin: async (req, res) => {
    try {
      const { status } = req.query;
      
      const whereClause = {};
      if (status && status !== 'all') {
        whereClause.status = status;
      }

      const places = await Place.findAll({
        where: whereClause,
        include: [
          {
            model: Media,
            attributes: ['url', 'type'],
            required: false
          },
          {
            model: Review,
            attributes: ['id', 'rating', 'comment', 'createdAt'],
            include: [
              {
                model: User,
                attributes: ['first_name', 'last_name']
              }
            ],
            required: false
          },
          {
            model: Categorie,
            through: { attributes: [] },
            attributes: ['id', 'name', 'icon'],
            required: false
          }
        ],
        order: [['createdAt', 'DESC']]
      });

      const formattedPlaces = places.map(place => {
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
          status: place.status || 'pending',
          rating: Number(
            (place.Reviews?.reduce((acc, rev) => acc + (rev.rating || 0), 0) / 
             (place.Reviews?.length || 1)).toFixed(1)
          ),
          categories: place.Categories?.map(cat => ({
            id: cat.id,
            name: cat.name,
            icon: cat.icon || '🏷️'
          })) || [],
          reviews: place.Reviews?.map(review => ({
            id: review.id,
            rating: review.rating,
            comment: review.comment || '',
            user: {
              first_name: review.User?.first_name || 'Anonymous',
              last_name: review.User?.last_name || 'User'
            },
            createdAt: review.createdAt
          })) || [],
          created_at: place.createdAt,
          updated_at: place.updatedAt
        };
      });

      res.status(200).json({
        success: true,
        data: formattedPlaces
      });
    } catch (error) {
      console.error('Error in getPlacesByStatusAdmin:', error);
      res.status(500).json({
        success: false,
        error: 'Error fetching filtered places for admin',
        details: error.message
      });
    }
  },
};

module.exports = placeController;
