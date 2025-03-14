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
  },
  createPlace: async (req, res) => {
    try {
      console.log('Received request body:', req.body);
      const { name, description, location, images, categories } = req.body;

      // Validate required fields
      if (!name || !description || !location) {
        return res.status(400).json({
          success: false,
          error: 'Name, description, and location are required'
        });
      }

      // Create place with current timestamp
      const now = new Date();
      const place = await Place.create({
        name,
        description,
        location,
        images,
        status: 'pending',
        created_at: now,
        updated_at: now
      });

      console.log('Place created:', place.toJSON());

      // Handle categories if provided
      if (categories && Array.isArray(categories)) {
        try {
          await place.setCategories(categories);
        } catch (categoryError) {
          console.error('Error setting categories:', categoryError);
        }
      }

      // Get the created place with its categories
      const createdPlace = await Place.findByPk(place.id, {
        include: [{
          model: Categorie,
          through: { attributes: [] }
        }]
      });

      res.status(201).json({
        success: true,
        data: createdPlace
      });

    } catch (error) {
      console.error('Error in createPlace:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to create place',
        details: error.message
      });
    }
  },

  // Add the updatePlace method
  updatePlace: async (req, res) => {
    try {
      const { id } = req.params;
      const { name, description, location, image, categories } = req.body;

      // Find the place
      const place = await Place.findByPk(id);
      
      if (!place) {
        return res.status(404).json({
          success: false,
          error: 'Place not found'
        });
      }

      // Update the place
      await place.update({
        name: name || place.name,
        description: description || place.description,
        location: location || place.location,
        images: image || place.images
      });

      // Update categories if provided
      if (categories && Array.isArray(categories) && categories.length > 0) {
        await place.setCategories(categories);
      }

      // Fetch updated place with categories
      const updatedPlace = await Place.findByPk(id, {
        include: [
          {
            model: Categorie,
            through: { attributes: [] },
            attributes: ['id', 'name', 'icon'],
            required: false
          }
        ]
      });

      res.status(200).json({
        success: true,
        data: {
          id: updatedPlace.id,
          name: updatedPlace.name,
          description: updatedPlace.description,
          location: updatedPlace.location,
          image: updatedPlace.images,
          categories: updatedPlace.Categories?.map(cat => ({
            id: cat.id,
            name: cat.name,
            icon: cat.icon
          })) || []
        }
      });

    } catch (error) {
      console.error('Error in updatePlace:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update place',
        details: error.message
      });
    }
  },

  // Add the deletePlace method
  deletePlaceById: async (req, res) => {
    try {
      const { id } = req.params;
      
      // Find the place
      const place = await Place.findByPk(id);
      
      if (!place) {
        return res.status(404).json({
          success: false,
          error: 'Place not found'
        });
      }

      // Delete the place
      await place.destroy();

      res.status(200).json({
        success: true,
        message: 'Place deleted successfully'
      });

    } catch (error) {
      console.error('Error in deletePlace:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to delete place',
        details: error.message
      });
    }
  },

  // Add this new method to the placeController object
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
            attributes: ['rating'],
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
          status: place.status,
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

      res.status(200).json({
        success: true,
        data: formattedPlaces
      });
    } catch (error) {
      console.error('Error in getAllPlacesAdmin:', error);
      res.status(500).json({
        success: false,
        error: 'Error fetching places',
        details: error.message
      });
    }
  },

  // Add this new method to update place status
  updatePlaceStatus: async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;

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
        message: 'Status updated successfully'
      });
    } catch (error) {
      console.error('Error in updatePlaceStatus:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update status',
        details: error.message
      });
    }
  }
};

module.exports = placeController;
