const { Place, Media, Review, Categorie, User, Event, Advisor, PlaceUser } = require('../models');
const { Op } = require('sequelize');

const advisorDashboardController = {
  // Get all places
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
          },
          {
            model: User,
            attributes: ['id', 'first_name', 'last_name'],
            required: false,
            through: { attributes: [] }
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
            })),
            creator: plainPlace.Users && plainPlace.Users.length > 0 ? {
              id: plainPlace.Users[0].id,
              first_name: plainPlace.Users[0].first_name,
              last_name: plainPlace.Users[0].last_name
            } : null
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

  // Get places created by the advisor
  getAdvisorPlaces: async (req, res) => {
    try {
      const userId = req.user.id;
      
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
            through: { attributes: [] },
            attributes: ['id', 'name', 'icon'],
            required: false
          },
          {
            model: User,
            where: { id: userId },
            attributes: ['id', 'first_name', 'last_name'],
            required: true,
            through: { attributes: [] }
          }
        ]
      });

      const formattedPlaces = places.map(place => {
        try {
          const plainPlace = place.get({ plain: true });
          
          // Handle image URL
          let imageUrl = null;
          if (plainPlace.Media?.length > 0 && plainPlace.Media[0].url) {
            imageUrl = plainPlace.Media[0].url;
          } else if (plainPlace.images) {
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
          console.error('Error formatting place:', error);
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
      console.error('Error in getAdvisorPlaces:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch advisor places',
        details: error.message
      });
    }
  },

  // Create a new place
  createPlace: async (req, res) => {
    try {
      console.log('Starting createPlace with body:', req.body);
      const { name, description, location, image, categoryIds } = req.body;
      const userId = req.user.id;

      // Validate required fields
      if (!name || !description || !location) {
        return res.status(400).json({
          success: false,
          error: 'Name, description, and location are required'
        });
      }

      // For advisors, places are created with 'pending' status
      const place = await Place.create({
        name,
        description,
        location,
        status: 'pending', // Advisor created places need approval
        images: image ? [image] : [],
        created_at: new Date(),
        updated_at: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      });

      // Associate the place with the advisor/user
      await place.addUser(userId);

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
            model: User,
            where: { id: userId },
            attributes: ['id', 'first_name', 'last_name'],
            through: { attributes: [] }
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
        categories: createdPlace.Categories || []
      };

      return res.status(201).json({
        success: true,
        message: 'Place created successfully and pending approval',
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

  // Update place
  updatePlace: async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      const { name, description, location, image, images } = req.body;

      // Get advisor profile
      const advisor = await Advisor.findOne({
        where: { userId }
      });

      if (!advisor) {
        return res.status(404).json({
          success: false,
          error: 'Advisor profile not found'
        });
      }

      // First, find the place to make sure it exists
      const place = await Place.findByPk(id);
      
      if (!place) {
        return res.status(404).json({
          success: false,
          error: 'Place not found'
        });
      }
      
      // Check place ownership through PlaceUsers table
      const placeUser = await PlaceUser.findOne({
        where: {
          placeId: id,
          userId: userId
        }
      });
      
      if (!placeUser) {
        console.log(`User ${userId} is not authorized to update place ${id}`);
        return res.status(403).json({
          success: false,
          error: 'You are not authorized to update this place'
        });
      }
      
      // If we get here, the user is associated with the place and can update it
      // Update the place with the new data
      const updateData = {};
      if (name) updateData.name = name;
      if (description) updateData.description = description;
      if (location) updateData.location = location;
      
      // Handle images correctly
      if (image || (images && images.length > 0)) {
        // If images is provided as an array, use it
        if (images && Array.isArray(images)) {
          updateData.images = images;
        } 
        // If only image is provided, make it an array
        else if (image) {
          updateData.images = [image];
        }
      }
      
      console.log('Applying updates:', updateData);
      
      // Update the place
      await place.update(updateData);
      
      res.json({
        success: true,
        message: 'Place updated successfully',
        data: {
          id: place.id,
          name: place.name,
          description: place.description,
          location: place.location,
          status: place.status,
          image: place.images && place.images.length > 0 ? place.images[0] : null
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

  // Delete place
  deletePlace: async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      // Find the place first
      const place = await Place.findOne({
        where: { id },
        include: [
          {
            model: User,
            attributes: ['id'],
            through: { attributes: [] }
          }
        ]
      });

      if (!place) {
        return res.status(404).json({
          success: false,
          error: 'Place not found'
        });
      }

      // Verify that this place belongs to the advisor
      const isOwner = place.Users && place.Users.some(user => user.id === userId);
      if (!isOwner) {
        return res.status(403).json({
          success: false,
          error: 'You are not authorized to delete this place'
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
        error: 'Failed to delete place',
        details: error.message
      });
    }
  },

  // Get all events
  getAllEvents: async (req, res) => {
    try {
      const events = await Event.findAll({
        order: [['created_at', 'DESC']]
      });
      
      const formattedEvents = events.map(event => {
        const plainEvent = event.get({ plain: true });
        
        // Handle image URL
        let imageUrl = null;
        if (plainEvent.images && Array.isArray(plainEvent.images) && plainEvent.images.length > 0) {
          imageUrl = plainEvent.images[0];
        }
        
        return {
          id: plainEvent.id,
          title: plainEvent.title,
          description: plainEvent.description,
          date: plainEvent.date,
          location: plainEvent.location,
          image: imageUrl,
          status: plainEvent.status,
          created_at: plainEvent.created_at
        };
      });
      
      res.json({
        success: true,
        data: formattedEvents
      });
    } catch (error) {
      console.error('Error in getAllEvents:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch events',
        details: error.message
      });
    }
  },

  // Get events created by the advisor
  getAdvisorEvents: async (req, res) => {
    try {
      const userId = req.user.id;
      
      // Find advisor ID from user ID
      const advisor = await Advisor.findOne({
        where: { userId }
      });
      
      if (!advisor) {
        return res.status(404).json({
          success: false,
          error: 'Advisor profile not found'
        });
      }
      
      // Get events created by this advisor
      const events = await Event.findAll({
        where: { advisorId: advisor.id },
        order: [['created_at', 'DESC']]
      });
      
      const formattedEvents = events.map(event => {
        const plainEvent = event.get({ plain: true });
        
        // Handle image URL
        let imageUrl = null;
        if (plainEvent.images && Array.isArray(plainEvent.images) && plainEvent.images.length > 0) {
          imageUrl = plainEvent.images[0];
        }
        
        return {
          id: plainEvent.id,
          title: plainEvent.title,
          description: plainEvent.description,
          date: plainEvent.date,
          location: plainEvent.location,
          image: imageUrl,
          status: plainEvent.status,
          created_at: plainEvent.created_at
        };
      });
      
      res.json({
        success: true,
        data: formattedEvents
      });
    } catch (error) {
      console.error('Error in getAdvisorEvents:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch advisor events',
        details: error.message
      });
    }
  },

  // Create a new event
  createEvent: async (req, res) => {
    try {
      const userId = req.user.id;
      const { title, description, location, date } = req.body;
      
      console.log('Creating event with data:', { userId, title, description, location, date });

      // Validate required fields
      if (!title || !description || !location || !date) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields'
        });
      }

      // Get advisor profile
      const advisor = await Advisor.findOne({
        where: { userId }
      });

      console.log('Found advisor:', advisor ? { id: advisor.id } : 'Not found');

      if (!advisor) {
        return res.status(404).json({
          success: false,
          error: 'Advisor profile not found'
        });
      }

      // Ensure date is properly formatted
      let eventDate;
      try {
        eventDate = new Date(date);
        if (isNaN(eventDate.getTime())) {
          throw new Error('Invalid date format');
        }
      } catch (error) {
        return res.status(400).json({
          success: false,
          error: `Invalid date format: ${error.message}`
        });
      }

      // Process images - use empty array if not provided
      const images = req.body.images || [];
      const image = req.body.image;
      
      let eventImages = [];
      if (Array.isArray(images) && images.length > 0) {
        eventImages = images;
      } else if (image) {
        eventImages = [image];
      }

      console.log('Creating event with images:', eventImages);

      // Create the event with explicit field mapping
      const event = await Event.create({
        title,
        description,
        location,
        date: eventDate,
        images: eventImages,
        status: 'pending',
        advisorId: advisor.id,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      console.log('Event created successfully:', { id: event.id });

      res.status(201).json({
        success: true,
        message: 'Event created successfully and pending approval',
        data: {
          id: event.id,
          title: event.title,
          description: event.description,
          date: event.date,
          location: event.location,
          status: event.status,
          image: event.images && event.images.length > 0 ? event.images[0] : null
        }
      });
    } catch (error) {
      console.error('Error in createEvent:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to create event',
        details: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  },

  // Update event
  updateEvent: async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      const { title, description, date, location, image } = req.body;

      console.log('Update event request received:');
      console.log('Event ID:', id);
      console.log('User ID:', userId);
      console.log('Request body:', JSON.stringify(req.body));
      console.log('Date value:', date);

      // Get advisor id
      const advisor = await Advisor.findOne({
        where: { userId }
      });

      if (!advisor) {
        console.log('Advisor not found for user ID:', userId);
        return res.status(404).json({
          success: false,
          error: 'Advisor profile not found'
        });
      }

      // Find the event
      const event = await Event.findOne({
        where: { 
          id,
          advisorId: advisor.id
        }
      });

      if (!event) {
        console.log(`Event with ID ${id} not found for advisor ${advisor.id}`);
        return res.status(404).json({
          success: false,
          error: 'Event not found or you are not authorized to update it'
        });
      }

      console.log('Found event before update:', JSON.stringify(event.get({ plain: true })));

      // Try a more direct approach to update the date
      if (date) {
        try {
          console.log('Original date from database:', event.date);
          // Force date update with raw SQL
          await Event.sequelize.query(
            'UPDATE events SET date = ? WHERE id = ?',
            {
              replacements: [date, id],
              type: Event.sequelize.QueryTypes.UPDATE
            }
          );
          console.log('Date updated directly in database to:', date);
        } catch (dateError) {
          console.error('Error updating date directly:', dateError);
        }
      }

      // Continue with the regular update for other fields
      const updateData = {};
      if (title !== undefined) updateData.title = title;
      if (description !== undefined) updateData.description = description;
      if (location !== undefined) updateData.location = location;
      
      // Handle image updates
      if (image !== undefined) {
        if (Array.isArray(event.images)) {
          updateData.images = [image];
        } else {
          updateData.image = image;
        }
      }
      
      // Always update status to 'pending' when an advisor updates
      updateData.status = 'pending';
      updateData.updatedAt = new Date();
      
      console.log('Updating other fields with:', JSON.stringify(updateData));

      // Update other fields if there are any
      if (Object.keys(updateData).length > 0) {
        await event.update(updateData);
      }
      
      // Fetch the updated event to verify changes
      const updatedEvent = await Event.findByPk(event.id);
      console.log('Event after complete update:', JSON.stringify(updatedEvent.get({ plain: true })));

      res.json({
        success: true,
        message: 'Event updated successfully and pending approval',
        data: {
          id: updatedEvent.id,
          title: updatedEvent.title,
          description: updatedEvent.description,
          date: updatedEvent.date,
          location: updatedEvent.location,
          status: updatedEvent.status,
          image: updatedEvent.images && updatedEvent.images.length > 0 ? updatedEvent.images[0] : null
        }
      });
    } catch (error) {
      console.error('Error in updateEvent:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update event',
        details: error.message
      });
    }
  },

  // Delete event
  deleteEvent: async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      // Get advisor id
      const advisor = await Advisor.findOne({
        where: { userId }
      });

      if (!advisor) {
        return res.status(404).json({
          success: false,
          error: 'Advisor profile not found'
        });
      }

      // Find the event
      const event = await Event.findOne({
        where: { 
          id,
          advisorId: advisor.id
        }
      });

      if (!event) {
        return res.status(404).json({
          success: false,
          error: 'Event not found or you are not authorized to delete it'
        });
      }

      await event.destroy();

      res.json({
        success: true,
        message: 'Event deleted successfully'
      });
    } catch (error) {
      console.error('Error in deleteEvent:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to delete event',
        details: error.message
      });
    }
  },

  // Get dashboard stats
  getDashboardStats: async (req, res) => {
    try {
      const userId = req.user.id;

      // Get advisor id
      const advisor = await Advisor.findOne({
        where: { userId }
      });

      if (!advisor) {
        return res.status(404).json({
          success: false,
          error: 'Advisor profile not found'
        });
      }

      // Get total events and places
      const [totalEvents, advisorEvents, totalPlaces, advisorPlaces] = await Promise.all([
        Event.count(),
        Event.count({ where: { advisorId: advisor.id } }),
        Place.count(),
        Place.findAll({
          include: [
            {
              model: User,
              where: { id: userId },
              attributes: [],
              through: { attributes: [] }
            }
          ]
        })
      ]);

      res.json({
        success: true,
        data: {
          totalEvents,
          myEvents: advisorEvents,
          totalPlaces,
          myPlaces: advisorPlaces.length
        }
      });
    } catch (error) {
      console.error('Error in getDashboardStats:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch dashboard stats',
        details: error.message
      });
    }
  }
};

module.exports = advisorDashboardController;
