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
        if (place.Media && place.Media.length > 0) {
          imageUrl = place.Media[0].url;
        } else if (place.images && Array.isArray(place.images) && place.images.length > 0) {
          imageUrl = place.images[0];
        } else if (place.images && typeof place.images === 'string') {
          imageUrl = place.images;
        }

        const rating = place.Reviews && place.Reviews.length > 0
          ? Number((place.Reviews.reduce((acc, rev) => acc + (rev.rating || 0), 0) / place.Reviews.length).toFixed(1))
          : 0;

        return {
          id: place.id,
          name: place.name,
          description: place.description,
          location: place.location,
          image: imageUrl,
          rating: rating,
          status: place.status || 'pending',
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
            user: review.User ? {
              id: review.User.id,
              name: `${review.User.first_name} ${review.User.last_name}`,
              profile_image: review.User.profile_image || 'https://via.placeholder.com/40'
            } : {
              name: 'Anonymous',
              profile_image: 'https://via.placeholder.com/40'
            }
          })) || [],
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
  }
};

module.exports = placeController;
