const { User, Advisor, Place, Event } = require('../models'); // Adjust the path as necessary

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
      const advisor = await Advisor.findByPk(req.params.id, {
        include: [
          { 
            model: User, 
            attributes: ["first_name", "last_name", "bio", "experience", "points", "rank"] 
          },
          { 
            model: Event, 
            attributes: ["title", "date", "status"],
            include: [{ model: Review, attributes: ["rating", "comment", "created_at"] }]
          },
          { 
            model: Review, 
            attributes: ["rating", "comment", "created_at"],
            include: [{ model: User, attributes: ["first_name", "last_name"] }]
          },
        ],
      });
  
      if (!advisor) {
        return res.status(404).json({ error: "Advisor not found" });
      }
  
      // Build the profile response
      const profile = {
        advisorId: advisor.id,
        user: advisor.User,
        events: advisor.Events.map(event => ({
          title: event.title,
          date: event.date,
          status: event.status,
          reviews: event.Reviews.map(review => ({
            rating: review.rating,
            comment: review.comment || "No comment provided",
            created_at: review.created_at,
          })),
        })),
        points: advisor.points, // Use advisor.points only, since User.points is synced
        rank: advisor.currentRank,
        reviews: advisor.Reviews.map(review => ({
          rating: review.rating,
          comment: review.comment || "No comment provided",
          reviewer: `${review.User.first_name} ${review.User.last_name}`,
          created_at: review.created_at,
        })),
      };
  
      return res.status(200).json(profile);
    } catch (error) {
      console.error("Error fetching advisor profile:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  };
// Update points dynamically (e.g., after a review or event completion)
module.exports.updatePoints = async (req, res) => {
    try {
      const { advisorId, points } = req.body; // This can still be used for manual updates
      const advisor = await Advisor.findByPk(advisorId);
      if (!advisor) {
        return res.status(404).json({ error: "Advisor not found" });
      }
  
      const newPoints = advisor.points + points;
      await advisor.update({ points: newPoints });
  
      // Update rank based on points
      let newRank;
      if (newPoints >= 500) newRank = "platinum";
      else if (newPoints >= 250) newRank = "gold";
      else if (newPoints >= 100) newRank = "silver";
      else newRank = "bronze";
  
      await advisor.update({ currentRank: newRank });
    //   await advisor.User.update({ points: newPoints, rank: newRank });
  
      return res.status(200).json({ message: "Points and rank updated", points: newPoints, rank: newRank });
    } catch (error) {
      console.error("Error updating points:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  };