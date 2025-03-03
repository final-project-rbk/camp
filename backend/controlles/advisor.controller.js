const { User, Advisor, Place, Event,Review } = require('../models'); // Adjust the path as necessary

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
    const where = advisorId ? { advisorId } : {};
    const events = await Event.findAll({
      where,
      include: [{ model: Advisor, include: [User] }], // Include advisor and user details
    });
    return res.status(200).json(events);
  } catch (error) {
    console.error("Error fetching events:", error);
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

// Get advisor profile with related data
module.exports.getAdvisorProfile = async (req, res) => {
  try {
    const advisorId = req.params.id;
    const advisor = await Advisor.findOne({
      where: { id: advisorId },
      include: [
        {
          model: User,
          attributes: ['first_name', 'last_name', 'email', 'bio', 'experience', 'points', 'profile_image']
        },
        {
          model: Event,
          include: [{ model: Review }]
        },
        {
          model: Review,
          attributes: ['rating', 'comment'],
          include: [{
            model: User,
            attributes: ['first_name', 'last_name']
          }]
        }
      ]
    });

    if (!advisor) {
      return res.status(404).json({ message: 'Advisor not found' });
    }

    // Format the response to match the frontend expected structure
    const response = {
      advisorId: advisor.id,
      user: {
        first_name: advisor.User.first_name,
        last_name: advisor.User.last_name,
        email: advisor.User.email,
        profile_image: advisor.User.profile_image || null,
        bio: advisor.User.bio || '',
        points: advisor.User.points || 0,
        experience: advisor.User.experience || ''
      },
      currentRank: advisor.currentRank,
      events: advisor.Events || [],
      reviews: advisor.Reviews ? advisor.Reviews.map(review => ({
        rating: review.rating,
        comment: review.comment || '',
        reviewer: review.User ? `${review.User.first_name} ${review.User.last_name}` : 'Anonymous'
      })) : []
    };

    res.json(response);
  } catch (error) {
    console.error('Error fetching advisor profile:', error);
    res.status(500).json({ message: 'Error fetching advisor profile' });
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

// Add new event
module.exports.addEvent = async (req, res) => {
  try {
    const { title, date, description, location } = req.body;
    const advisorId = req.body.advisorId || 1; // Default to 1 for testing, should come from auth

    // Validate required fields
    if (!title || !date || !description || !location) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const event = await Event.create({
      title,
      date,
      description,
      location,
      advisorId,
      status: 'pending'
    });

    res.status(201).json(event);
  } catch (error) {
    console.error('Error creating event:', error);
    res.status(500).json({ message: 'Error creating event' });
  }
};

// Delete event
module.exports.deleteEvent = async (req, res) => {
  try {
    const eventId = req.params.id;
    const result = await Event.destroy({ where: { id: eventId } });

    if (result === 0) {
      return res.status(404).json({ message: 'Event not found' });
    }

    res.json({ message: 'Event deleted successfully' });
  } catch (error) {
    console.error('Error deleting event:', error);
    res.status(500).json({ message: 'Error deleting event' });
  }
};

// Update event
module.exports.updateEvent = async (req, res) => {
    try {
        const eventId = req.params.id;
        const event = await Event.findByPk(eventId);

        if (!event) {
            return res.status(404).json({ message: 'Event not found' });
        }

        await event.update(req.body);
        res.json(event);
    } catch (error) {
        console.error('Error updating event:', error);
        res.status(500).json({ message: 'Error updating event' });
    }
};