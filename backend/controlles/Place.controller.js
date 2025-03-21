const { Place, Media, Review, Categorie, Citiria, PlaceUser, User } = require('../models');
const { Op } = require('sequelize');

const placeController = {
  // Create a new place
  createPlace: async (req, res) => {
    try {
      const { name, location, description, images } = req.body;
      const creatorId = req.user.id; // From auth middleware

      console.log('Creating place with data:', {
        name,
        location,
        description,
        images,
        creatorId
      });

      // Create the place
      const place = await Place.create({
        name,
        location,
        description,
        images,
        status: 'pending',
        creatorId // This will be the creator's ID
      });

      // Create media entries for each image
      if (images && images.length > 0) {
        await Media.bulkCreate(
          images.map(url => ({
            url,
            type: 'image',
            placeId: place.id
          }))
        );
      }

      res.status(201).json({
        success: true,
        data: place
      });
    } catch (error) {
      console.error('Error in createPlace:', error);
      res.status(500).json({
        success: false,
        error: 'Error creating place',
        details: error.message
      });
    }
  },

  // Get all places with related data
  getAllPlaces: async (req, res) => {
    try {
      const { limit, category, search, status } = req.query;
      
      const include = [
        {
          model: Media,
          as: 'Media',
          attributes: ['url', 'type'],
          required: false
        },
        {
          model: Review,
          as: 'Reviews',
          attributes: ['id', 'rating', 'comment', 'created_at'],
          include: [{
            model: User,
            as: 'User',
            attributes: ['id', 'first_name', 'last_name', 'profile_image'],
            required: false
          }],
          required: false
        },
        {
          model: Categorie,
          as: 'Categories',
          through: { attributes: [] },
          attributes: ['name', 'icon'],
          required: category ? true : false
        },
        {
          model: User,
          as: 'Creator',
          attributes: ['id', 'first_name', 'last_name', 'email', 'profile_image'],
          required: false
        }
      ];

      const whereClause = {};

      // Add search condition
      if (search) {
        whereClause[Op.or] = [
          { name: { [Op.like]: `%${search}%` } },
          { description: { [Op.like]: `%${search}%` } },
          { location: { [Op.like]: `%${search}%` } }
        ];
      }

      // Add status filter
      if (status && ['pending', 'approved', 'rejected'].includes(status)) {
        whereClause.status = status;
      }

      if (category) {
        include[2].where = { name: category };
      }

      const places = await Place.findAll({
        include,
        where: whereClause,
        distinct: true,
        order: [['createdAt', 'DESC']] // Sort by newest first
      });

      const formattedPlaces = places.map(place => {
        // Simple image handling - just use the images array directly
        const images = place.images || [];
        
        return {
          id: place.id,
          name: place.name,
          description: place.description,
          location: place.location,
          images: Array.isArray(images) ? images : [images].filter(Boolean),
          rating: Number(
            (place.Reviews?.reduce((acc, rev) => acc + (rev.rating || 0), 0) / 
             (place.Reviews?.length || 1)).toFixed(1)
          ),
          categories: place.Categories?.map(cat => ({
            name: cat.name,
            icon: cat.icon
          })) || [],
          status: place.status || 'pending',
          creator: place.Creator ? {
            id: place.Creator.id,
            name: `${place.Creator.first_name} ${place.Creator.last_name}`,
            email: place.Creator.email,
            profile_image: place.Creator.profile_image
          } : null,
          created_at: place.createdAt
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
            as: 'Media',
            attributes: ['url', 'type'],
            required: false
          },
          {
            model: Review,
            as: 'Reviews',
            attributes: ['id', 'rating', 'comment', 'created_at'],
            required: false
          },
          {
            model: Categorie,
            as: 'Categories',
            through: { attributes: [] },
            attributes: ['name', 'icon'],
            required: false
          },
          {
            model: User,
            as: 'Creator',
            attributes: ['id', 'first_name', 'last_name', 'email', 'profile_image'],
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

      // Handle images simply
      const images = place.images || [];
      
      const formattedPlace = {
        id: place.id,
        name: place.name,
        description: place.description,
        location: place.location,
        images: Array.isArray(images) ? images : [images].filter(Boolean),
        rating: Number(
          (place.Reviews?.reduce((acc, rev) => acc + (rev.rating || 0), 0) / 
           (place.Reviews?.length || 1)).toFixed(1)
        ) || 0,
        status: place.status,
        creator: place.Creator ? {
          id: place.Creator.id,
          name: `${place.Creator.first_name} ${place.Creator.last_name}`,
          email: place.Creator.email,
          profile_image: place.Creator.profile_image
        } : null,
        created_at: place.created_at,
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
  },

  // Update place status (approve/reject)
  updatePlaceStatus: async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;

      if (!['approved', 'rejected'].includes(status)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid status. Must be either "approved" or "rejected"'
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

      // Fetch the updated place with all its relations
      const updatedPlace = await Place.findByPk(id, {
        include: [
          {
            model: Media,
            as: 'Media',
            attributes: ['url', 'type'],
            required: false
          },
          {
            model: Categorie,
            as: 'Categories',
            through: { attributes: [] },
            attributes: ['name', 'icon'],
            required: false
          },
          {
            model: User,
            as: 'Creator',
            attributes: ['id', 'first_name', 'last_name', 'email', 'profile_image'],
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
          status: updatedPlace.status,
          images: updatedPlace.Media?.map(media => media.url) || [],
          categories: updatedPlace.Categories?.map(cat => ({
            name: cat.name,
            icon: cat.icon
          })) || [],
          creator: updatedPlace.Creator ? {
            id: updatedPlace.Creator.id,
            name: `${updatedPlace.Creator.first_name} ${updatedPlace.Creator.last_name}`,
            email: updatedPlace.Creator.email,
            profile_image: updatedPlace.Creator.profile_image
          } : null,
          created_at: updatedPlace.createdAt,
          updated_at: updatedPlace.updatedAt
        }
      });
    } catch (error) {
      console.error('Error in updatePlaceStatus:', error);
      res.status(500).json({
        success: false,
        error: 'Error updating place status',
        details: error.message
      });
    }
  }
};

module.exports = placeController;
