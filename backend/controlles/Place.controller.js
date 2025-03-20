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
