const { Place, Media, Review, Categorie, User } = require('../models');

const adminPlaceController = {
  // Get all places for admin
  getAllPlaces: async (req, res) => {
    try {
      console.log('Starting getAllPlaces...');
      
      const places = await Place.findAll({
        attributes: ['id', 'name', 'description', 'location', 'status', 'images'],
        include: [
          {
            model: Media,
            attributes: ['url'],
            required: false
          },
          {
            model: Review,
            attributes: ['id', 'rating', 'comment', 'createdAt'],
            include: [{
              model: User,
              attributes: ['first_name', 'last_name']
            }],
            required: false
          },
          {
            model: Categorie,
            through: { attributes: [] }, // Exclude junction table attributes
            attributes: ['id', 'name', 'icon'],
            required: false
          }
        ]
      });

      console.log(`Found ${places.length} places`);

      const formattedPlaces = places.map(place => {
        try {
          const plainPlace = place.get({ plain: true });
          
          // Handle Cloudinary image URL
          let imageUrl = null;
          if (plainPlace.Media?.length > 0 && plainPlace.Media[0].url) {
            imageUrl = plainPlace.Media[0].url;
          } else if (plainPlace.images) {
            // If images is an array or string, find first Cloudinary URL
            const images = Array.isArray(plainPlace.images) ? plainPlace.images : [plainPlace.images];
            imageUrl = images.find(img => img?.includes('cloudinary.com')) || null;
          }

          return {
            id: plainPlace.id,
            name: plainPlace.name,
            description: plainPlace.description,
            location: plainPlace.location,
            status: plainPlace.status,
            image: imageUrl,
            categories: plainPlace.Categories || [],
            reviews: (plainPlace.Reviews || []).map(review => ({
              id: review.id,
              rating: review.rating,
              comment: review.comment,
              user: {
                first_name: review.User?.first_name || '',
                last_name: review.User?.last_name || ''
              },
              createdAt: review.createdAt
            }))
          };
        } catch (error) {
          console.error('Error formatting place:', error, place);
          return {
            id: place.id || 'unknown',
            name: place.name || 'Error formatting place',
            status: place.status || 'unknown',
            image: null,
            categories: [],
            reviews: []
          };
        }
      });

      res.json({
        success: true,
        data: formattedPlaces
      });
    } catch (error) {
      console.error('Detailed error in getAllPlaces:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
      
      res.status(500).json({
        success: false,
        error: 'Failed to fetch places',
        details: error.message
      });
    }
  },

  // Create new place
  createPlace: async (req, res) => {
    try {
      console.log('Starting createPlace with body:', req.body);
      const { name, description, location, image, categoryIds } = req.body;

      // Validate required fields
      if (!name || !description || !location) {
        return res.status(400).json({
          success: false,
          error: 'Name, description, and location are required'
        });
      }

      // Create place with status 'approved' by default for admin
      const place = await Place.create({
        name,
        description,
        location,
        status: 'approved', // Set default status to approved for admin
        images: image ? [image] : [],
        created_at: new Date(),
        updated_at: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      });

      // Handle categories if provided
      if (categoryIds && Array.isArray(categoryIds) && categoryIds.length > 0) {
        await place.setCategories(categoryIds);
      }

      // Fetch the created place with its associations
      const createdPlace = await Place.findByPk(place.id, {
        include: [
          {
            model: Categorie,
            through: { attributes: [] },
            attributes: ['id', 'name', 'icon']
          },
          {
            model: Review,
            attributes: ['id', 'rating', 'comment', 'createdAt'],
            include: [{
              model: User,
              attributes: ['first_name', 'last_name']
            }]
          }
        ]
      });

      // Format the response
      const formattedPlace = {
        id: createdPlace.id,
        name: createdPlace.name,
        description: createdPlace.description,
        location: createdPlace.location,
        status: createdPlace.status,
        image: createdPlace.images?.[0] || null,
        categories: createdPlace.Categories || [],
        reviews: []
      };

      return res.status(201).json({
        success: true,
        data: formattedPlace
      });

    } catch (error) {
      console.error('Create place error:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to create place',
        details: error.message
      });
    }
  },

  // Update place status
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

      res.json({
        success: true,
        data: place
      });
    } catch (error) {
      console.error('Error in updatePlaceStatus:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update place status'
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

      res.json({
        success: true,
        message: 'Place deleted successfully'
      });
    } catch (error) {
      console.error('Error in deletePlace:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to delete place'
      });
    }
  },

  // Update place
  updatePlace: async (req, res) => {
    try {
      const { id } = req.params;
      const { name, description, location, image, categoryIds } = req.body;

      console.log('Update request received:', {
        id,
        body: req.body
      });

      const place = await Place.findByPk(id);
      if (!place) {
        console.log('Place not found:', id);
        return res.status(404).json({
          success: false,
          error: 'Place not found'
        });
      }

      console.log('Current place data:', {
        id: place.id,
        name: place.name,
        description: place.description,
        location: place.location,
        images: place.images
      });

      // Handle image update
      let updatedImages = place.images || [];
      if (image) {
        console.log('Updating image:', image);
        if (Array.isArray(updatedImages)) {
          if (updatedImages.length > 0) {
            updatedImages[0] = image;
          } else {
            updatedImages.push(image);
          }
        } else {
          updatedImages = [image];
        }
        console.log('Updated images array:', updatedImages);
      }

      // Prepare update data
      const updateData = {
        name: name || place.name,
        description: description || place.description,
        location: location || place.location,
        images: updatedImages,
        updated_at: new Date(),
        updatedAt: new Date()
      };

      console.log('Updating place with data:', updateData);

      // Force the update with raw SQL query to ensure it's executed
      await Place.update(updateData, {
        where: { id: place.id },
        returning: true
      });

      // Verify the update
      const updatedPlace = await Place.findByPk(id, {
        include: [
          {
            model: Categorie,
            through: { attributes: [] },
            attributes: ['id', 'name', 'icon']
          },
          {
            model: Review,
            attributes: ['id', 'rating', 'comment', 'createdAt'],
            include: [{
              model: User,
              attributes: ['first_name', 'last_name']
            }]
          }
        ]
      });

      console.log('Place updated, new data:', {
        id: updatedPlace.id,
        name: updatedPlace.name,
        description: updatedPlace.description,
        location: updatedPlace.location,
        images: updatedPlace.images
      });

      // Update categories if provided
      if (categoryIds && Array.isArray(categoryIds)) {
        console.log('Updating categories:', categoryIds);
        await updatedPlace.setCategories(categoryIds);
      }

      // Format the response
      const formattedPlace = {
        id: updatedPlace.id,
        name: updatedPlace.name,
        description: updatedPlace.description,
        location: updatedPlace.location,
        status: updatedPlace.status,
        image: updatedPlace.images?.[0] || null,
        categories: updatedPlace.Categories || [],
        reviews: (updatedPlace.Reviews || []).map(review => ({
          id: review.id,
          rating: review.rating,
          comment: review.comment,
          user: {
            first_name: review.User?.first_name || '',
            last_name: review.User?.last_name || ''
          },
          createdAt: review.createdAt
        }))
      };

      console.log('Sending response:', {
        success: true,
        data: formattedPlace
      });

      res.json({
        success: true,
        data: formattedPlace
      });
    } catch (error) {
      console.error('Detailed error in updatePlace:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
      res.status(500).json({
        success: false,
        error: 'Failed to update place',
        details: error.message
      });
    }
  }
};

module.exports = adminPlaceController;
