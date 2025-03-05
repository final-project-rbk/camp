const { User, Advisor, Place, Event, Review, Media } = require('../models');
const { sequelize } = require('../models');

// Create a controller object to hold all functions
const advisorController = {
  migrateUserToAdvisor: async (req, res) => {
    try {
      const { userId } = req.body;
      const user = await User.findByPk(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      const existingAdvisor = await Advisor.findOne({ where: { userId: user.id } });
      if (existingAdvisor) {
        return res.status(400).json({ error: "User is already an advisor" });
      }

      const advisor = await Advisor.create({ userId: user.id });
      await user.update({ role: "advisor" });

      return res.status(201).json({ message: `User with ID ${userId} migrated to advisor with ID ${advisor.id}`, advisor });
    } catch (error) {
      console.error("Error migrating user to advisor:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  },

  getAllPlaces: async (req, res) => {
    try {
      const places = await Place.findAll({
        include: [{ model: Event, include: [Advisor] }],
      });
      return res.status(200).json(places);
    } catch (error) {
      console.error("Error fetching places:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  },

  getAllEvents: async (req, res) => {
    try {
      const advisorId = req.query.advisorId;
      const upcoming = req.query.upcoming === 'true';
      
      let where = {};
      if (advisorId) {
        where.advisorId = advisorId;
      }
      
      if (upcoming) {
        where.date = {
          [sequelize.Op.gte]: new Date()
        };
      }
      
      const events = await Event.findAll({
        where,
        include: [{ 
          model: Advisor, 
          include: [User] 
        }],
        order: [['date', 'ASC']],
      });
      
      return res.status(200).json({
        success: true,
        data: events
      });
    } catch (error) {
      console.error("Error fetching events:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  },

  getUpcomingEvents: async (req, res) => {
    try {
      const events = await Event.findAll({
        where: {
          date: {
            [sequelize.Op.gte]: new Date()
          },
          status: 'approved'
        },
        include: [{ 
          model: Advisor,
          include: [User]
        },
        {
          model: Media,
          attributes: ['url', 'type'],
          required: false
        }],
        order: [['date', 'ASC']],
        limit: req.query.limit ? parseInt(req.query.limit) : undefined
      });
      
      const formattedEvents = events.map(event => {
        let images = ['https://via.placeholder.com/400'];
        if (event.Media && event.Media.length > 0) {
          images = event.Media.map(media => media.url);
        } else if (event.images) {
          if (Array.isArray(event.images)) {
            images = event.images;
          } else if (typeof event.images === 'string') {
            try {
              images = JSON.parse(event.images);
            } catch {
              images = [event.images];
            }
          }
        }

        return {
          id: event.id,
          title: event.title,
          description: event.description,
          date: event.date,
          location: event.location,
          images: images,
          status: event.status,
          advisor: event.Advisor ? {
            id: event.Advisor.id,
            name: `${event.Advisor.User.first_name} ${event.Advisor.User.last_name}`,
            profile_image: event.Advisor.User.profile_image
          } : null
        };
      });

      return res.status(200).json({
        success: true,
        data: formattedEvents
      });
    } catch (error) {
      console.error("Error fetching upcoming events:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  },

  updateAdvisorProfile: async (req, res) => {
    try {
      const advisor = await Advisor.findByPk(req.params.id, { include: [User] });
      if (!advisor) {
        return res.status(404).json({ error: "Advisor not found" });
      }

      await advisor.update(req.body.advisor || {});
      await advisor.User.update(req.body.user || {});

      return res.status(200).json({ advisor, user: advisor.User });
    } catch (error) {
      console.error("Error updating advisor profile:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  },

  addPlace: async (req, res) => {
    try {
      const { name, location, description, images, exclusive_details, eventId, advisorId } = req.body;
      if (!advisorId) {
        return res.status(400).json({ error: "Advisor ID is required" });
      }

      const advisor = await Advisor.findByPk(advisorId);
      if (!advisor) {
        return res.status(404).json({ error: "Advisor not found" });
      }

      const place = await Place.create({
        name,
        location,
        description,
        images,
        exclusive_details,
        eventId: eventId || null,
        advisorId,
      });

      return res.status(201).json(place);
    } catch (error) {
      console.error("Error adding place:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  },

  updatePlace: async (req, res) => {
    try {
      const place = await Place.findByPk(req.params.id);
      if (!place) {
        return res.status(404).json({ error: "Place not found" });
      }

      await place.update(req.body);
      return res.status(200).json(place);
    } catch (error) {
      console.error("Error updating place:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  },

  deletePlace: async (req, res) => {
    try {
      const place = await Place.findByPk(req.params.id);
      if (!place) {
        return res.status(404).json({ error: "Place not found" });
      }

      await place.destroy();
      return res.status(200).json({ message: "Place deleted successfully" });
    } catch (error) {
      console.error("Error deleting place:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  },

  addEvent: async (req, res) => {
    try {
      const { title, date, description, location, images, exclusive_details, advisorId } = req.body;
      if (!advisorId) {
        return res.status(400).json({ error: "Advisor ID is required" });
      }

      const advisor = await Advisor.findByPk(advisorId);
      if (!advisor) {
        return res.status(404).json({ error: "Advisor not found" });
      }

      const event = await Event.create({
        title,
        date,
        description,
        location,
        images,
        exclusive_details,
        advisorId,
      });

      return res.status(201).json(event);
    } catch (error) {
      console.error("Error adding event:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  },

  updateEvent: async (req, res) => {
    try {
      const event = await Event.findByPk(req.params.id);
      if (!event) {
        return res.status(404).json({ error: "Event not found" });
      }

      await event.update(req.body);
      return res.status(200).json(event);
    } catch (error) {
      console.error("Error updating event:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  },

  deleteEvent: async (req, res) => {
    try {
      const event = await Event.findByPk(req.params.id);
      if (!event) {
        return res.status(404).json({ error: "Event not found" });
      }

      await event.destroy();
      return res.status(200).json({ message: "Event deleted successfully" });
    } catch (error) {
      console.error("Error deleting event:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  },

  getAdvisorProfile: async (req, res) => {
    try {
      const { id } = req.params;

      const advisor = await Advisor.findOne({
        where: { id },
        include: [
          {
            model: User,
            as: 'User',
            required: true,
            attributes: ["email", "first_name", "last_name", "bio", "experience", "profile_image"]
          },
          {
            model: Event,
            as: 'Events',
            attributes: ["title", "date", "status"],
            include: [{ model: Review, as: 'Reviews', attributes: ["rating", "comment", "created_at"] }]
          },
          {
            model: Review,
            as: 'Reviews',
            attributes: ["rating", "comment", "created_at"],
            include: [{ model: User, as: 'User', attributes: ["first_name", "last_name"] }]
          }
        ]
      });

      if (!advisor) {
        return res.status(404).json({ error: `Advisor with ID ${id} not found` });
      }

      const profile = {
        advisorId: advisor.id,
        user: advisor.User
          ? {
              email: advisor.User.email,
              first_name: advisor.User.first_name,
              last_name: advisor.User.last_name,
              bio: advisor.User.bio,
              experience: advisor.User.experience || null,
              profile_image: advisor.User.profile_image
            }
          : null,
        events: advisor.Events?.map(event => ({
          title: event.title,
          date: event.date,
          status: event.status,
          reviews: event.Reviews?.map(review => ({
            rating: review.rating,
            comment: review.comment || "No comment provided",
            created_at: review.created_at,
          })) || [],
        })) || [],
        points: advisor.points,
        rank: advisor.currentRank,
        reviews: advisor.Reviews?.map(review => ({
          rating: review.rating,
          comment: review.comment || "No comment provided",
          reviewer: review.User ? `${review.User.first_name} ${review.User.last_name}` : "Anonymous",
          created_at: review.created_at,
        })) || [],
      };

      return res.status(200).json(profile);
    } catch (error) {
      console.error(`Error fetching advisor profile for ID ${req.params.id}:`, error);
      return res.status(500).json({ error: "Internal server error" });
    }
  },

  updatePoints: async (req, res) => {
    try {
      const { advisorId, points } = req.body;
      const advisor = await Advisor.findByPk(advisorId);
      if (!advisor) {
        return res.status(404).json({ error: "Advisor not found" });
      }

      const newPoints = advisor.points + points;
      await advisor.update({ points: newPoints });

      const ranks = await sequelize.models.event_rating.findAll({
        order: [['targetPoints', 'ASC']]
      });

      let newRank = "bronze";
      for (const rank of ranks) {
        if (newPoints >= rank.targetPoints && (rank.totalPoints === null || newPoints <= rank.totalPoints)) {
          newRank = rank.name;
        } else if (newPoints > rank.totalPoints) {
          continue;
        } else {
          break;
        }
      }

      await advisor.update({ currentRank: newRank });

      return res.status(200).json({
        message: "Points and rank updated",
        points: newPoints,
        rank: newRank
      });
    } catch (error) {
      console.error("Error updating points:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  },

  updateProfileImage: async (req, res) => {
    try {
      const { id } = req.params;
      const { profile_image } = req.body;

      const advisor = await Advisor.findByPk(id, {
        include: [{ model: User, as: 'User' }]
      });

      if (!advisor) {
        return res.status(404).json({ success: false, message: 'Advisor not found' });
      }

      await advisor.User.update({ profile_image });

      res.json({ 
        success: true, 
        message: 'Profile image updated successfully',
        data: { profile_image }
      });
    } catch (error) {
      console.error('Error updating profile image:', error);
      res.status(500).json({ success: false, message: 'Failed to update profile image' });
    }
  }
};

// Export the controller object
module.exports = advisorController;