const { User, Advisor, Place, Event,Review, Media } = require('../models'); // Adjust the path as necessary
const { sequelize } = require('../models'); // Assuming sequelize is imported from models

// Migrate user to advisor
module.exports.migrateUserToAdvisor = async (req, res) => {
  try {
    const { userId } = req.body; // Expect userId in request body
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Check if user is already an advisor
    const existingAdvisor = await Advisor.findOne({ where: { userId: user.id } });
    if (existingAdvisor) {
      return res.status(400).json({ error: "User is already an advisor" });
    }

    // Create advisor and update user role
    const advisor = await Advisor.create({ userId: user.id });
    await user.update({ role: "advisor" });

    return res.status(201).json({ message: `User with ID ${userId} migrated to advisor with ID ${advisor.id}`, advisor });
  } catch (error) {
    console.error("Error migrating user to advisor:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

// Get all places (with advisor relation if applicable)
module.exports.getAllPlaces = async (req, res) => {
  try {
    const places = await Place.findAll({
      include: [{ model: Event, include: [Advisor] }], // Include related event and advisor
    });
    return res.status(200).json(places);
  } catch (error) {
    console.error("Error fetching places:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

// Get all events for an advisor
module.exports.getAllEvents = async (req, res) => {
  try {
    const advisorId = req.query.advisorId; // Optional filter by advisor
    const upcoming = req.query.upcoming === 'true'; // Filter for upcoming events
    
    let where = {};
    if (advisorId) {
      where.advisorId = advisorId;
    }
    
    // If upcoming is true, only get events with dates in the future
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
      order: [['date', 'ASC']], // Order by date ascending
    });
    
    return res.status(200).json({
      success: true,
      data: events
    });
  } catch (error) {
    console.error("Error fetching events:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

// Get upcoming events
module.exports.getUpcomingEvents = async (req, res) => {
  try {
    const events = await Event.findAll({
      where: {
        date: {
          [sequelize.Op.gte]: new Date() // Only get events with dates in the future
        },
        status: 'approved' // Only get approved events
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
      order: [['date', 'ASC']], // Order by date ascending
      limit: req.query.limit ? parseInt(req.query.limit) : undefined // Optional limit
    });
    
    const formattedEvents = events.map(event => {
      // Handle images from both Media and images field
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
};

// Update advisor profile
module.exports.updateAdvisorProfile = async (req, res) => {
  try {
    const advisor = await Advisor.findByPk(req.params.id, { include: [User] });
    if (!advisor) {
      return res.status(404).json({ error: "Advisor not found" });
    }

    // Update advisor and related user fields
    await advisor.update(req.body.advisor || {});
    await advisor.User.update(req.body.user || {});

    return res.status(200).json({ advisor, user: advisor.User });
  } catch (error) {
    console.error("Error updating advisor profile:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

// Add a camping place
module.exports.addPlace = async (req, res) => {
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
      advisorId, // Assuming Place has an advisorId field (add to schema if needed)
    });

    return res.status(201).json(place);
  } catch (error) {
    console.error("Error adding place:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

// Update a camping place
module.exports.updatePlace = async (req, res) => {
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
};

// Delete a camping place
module.exports.deletePlace = async (req, res) => {
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
};

// Add a camping event
module.exports.addEvent = async (req, res) => {
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
};

// Update a camping event
module.exports.updateEvent = async (req, res) => {
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
};

// Delete a camping event
module.exports.deleteEvent = async (req, res) => {
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
};

// Get advisor profile with reviews and points
module.exports.getAdvisorProfile = async (req, res) => {
  try {
    const { id } = req.params;

    const advisor = await Advisor.findOne({
      where: { id },
      include: [
        {
          model: User,
          as: 'User', // Explicitly use the alias defined in the association
          required: true,
          attributes: ["email", "first_name", "last_name", "bio", "experience", "profile_image"]
        },
        {
          model: Event,
          as: 'Events', // Match the alias from association (if defined)
          attributes: ["title", "date", "status"],
          include: [{ model: Review, as: 'Reviews', attributes: ["rating", "comment", "created_at"] }]
        },
        {
          model: Review,
          as: 'Reviews', // Match the alias from association (if defined)
          attributes: ["rating", "comment", "created_at"],
          include: [{ model: User, as: 'User', attributes: ["first_name", "last_name"] }]
        }
      ]
    });

    // Add debugging
    console.log("Raw advisor data:", JSON.stringify(advisor, null, 2));

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
            experience: advisor.User.experience || null, // Handle missing experience
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
};
// Update points dynamically (e.g., after a review or event completion)
module.exports.updatePoints = async (req, res) => {
  try {
    const { advisorId, points } = req.body;
    const advisor = await Advisor.findByPk(advisorId);
    if (!advisor) {
      return res.status(404).json({ error: "Advisor not found" });
    }

    // Calculate new points
    const newPoints = advisor.points + points;
    await advisor.update({ points: newPoints });

    // Fetch all ranks from EventRating (assuming it's the rank table)
    const ranks = await sequelize.models.event_rating.findAll({
      order: [['targetPoints', 'ASC']] // Order by targetPoints ascending
    });

    // Determine the new rank based on newPoints
    let newRank = "bronze"; // Default to lowest rank
    for (const rank of ranks) {
      if (newPoints >= rank.targetPoints && (rank.totalPoints === null || newPoints <= rank.totalPoints)) {
        newRank = rank.name;
      } else if (newPoints > rank.totalPoints) {
        // Continue to next rank if points exceed this rank's totalPoints
        continue;
      } else {
        // Stop if points are below targetPoints of next rank
        break;
      }
    }

    // Update advisor's rank
    await advisor.update({ currentRank: newRank });
    // Optionally sync User model (commented out as per your latest code)
    // await advisor.User.update({ points: newPoints, rank: newRank });

    return res.status(200).json({
      message: "Points and rank updated",
      points: newPoints,
      rank: newRank
    });
  } catch (error) {
    console.error("Error updating points:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};