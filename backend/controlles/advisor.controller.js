const { User, Advisor, Event, Review } = require('../models');

// Get advisor profile with all related data
exports.getAdvisorProfile = async (req, res) => {
  try {
    const advisor = await Advisor.findOne({
      where: { userId: req.params.id },
      include: [{
        model: User,
        attributes: ['id', 'first_name', 'last_name', 'email', 'bio', 'experience', 'profile_image']
      }]
    });

    if (!advisor) {
      return res.status(404).json({ error: "Advisor not found" });
    }

    // Get advisor's reviews
    const reviews = await Review.findAll({
      where: { advisorId: advisor.id },
      include: [{
        model: User,
        attributes: ['first_name', 'last_name']
      }]
    });

    // Calculate average rating
    let rating = 0;
    if (reviews.length > 0) {
      rating = reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length;
    }

    // Get advisor's events count
    const eventsCount = await Event.count({
      where: { advisorId: advisor.id }
    });

    const advisorProfile = {
      id: advisor.id,
      userId: advisor.userId,
      currentRank: advisor.currentRank,
      points: advisor.points,
      isVerified: advisor.isVerified,
      first_name: advisor.User.first_name,
      last_name: advisor.User.last_name,
      email: advisor.User.email,
      bio: advisor.User.bio,
      experience: advisor.User.experience,
      profile_image: advisor.User.profile_image,
      rating: parseFloat(rating.toFixed(1)),
      reviews_count: reviews.length,
      events_count: eventsCount
    };

    return res.status(200).json({
      success: true,
      data: advisorProfile
    });
  } catch (error) {
    console.error("Error in getAdvisorProfile:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

// Update advisor profile
exports.updateAdvisorProfile = async (req, res) => {
  try {
    const { field, value } = req.body;
    const userId = req.params.id;

    const advisor = await Advisor.findOne({
      where: { userId },
      include: [{ model: User }]
    });

    if (!advisor) {
      return res.status(404).json({ error: "Advisor not found" });
    }

    // Fields that belong to the User model
    const userFields = ['first_name', 'last_name', 'email', 'bio', 'experience', 'profile_image'];

    if (userFields.includes(field)) {
      // Update User model
      await advisor.User.update({ [field]: value });
      console.log(`Updated user field ${field}`);
    } else {
      // Update Advisor model
      await advisor.update({ [field]: value });
      console.log(`Updated advisor field ${field}`);
    }

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully"
    });
  } catch (error) {
    console.error("Error updating advisor profile:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

// Get advisor stats
exports.getAdvisorStats = async (req, res) => {
  try {
    const advisor = await Advisor.findOne({
      where: { userId: req.params.id },
      attributes: ['currentRank', 'points', 'isVerified']
    });

    if (!advisor) {
      return res.status(404).json({ error: "Advisor not found" });
    }

    return res.status(200).json({
      success: true,
      data: {
        currentRank: advisor.currentRank,
        points: advisor.points,
        isVerified: advisor.isVerified
      }
    });
  } catch (error) {
    console.error("Error getting advisor stats:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

// Add a specific method for updating advisor experience
exports.updateAdvisorExperience = async (req, res) => {
  try {
    const { experience } = req.body;
    const userId = req.params.id;

    console.log('updateAdvisorExperience called with:', { userId, experience, body: req.body });

    if (!experience && experience !== '') {
      return res.status(400).json({ 
        success: false, 
        error: "Experience field is required" 
      });
    }

    // Find the advisor first
    const advisor = await Advisor.findOne({
      where: { userId }
    });

    if (!advisor) {
      console.log('Advisor not found for userId:', userId);
      return res.status(404).json({ 
        success: false, 
        error: "Advisor not found" 
      });
    }

    console.log('Found advisor with id:', advisor.id);

    // Find the associated user
    const user = await User.findByPk(userId);
    
    if (!user) {
      console.log('User not found with id:', userId);
      return res.status(404).json({
        success: false,
        error: "Associated user not found"
      });
    }
    
    console.log('Found user with id:', user.id);
    console.log('Current experience:', user.experience);
    console.log('New experience:', experience);

    // Update the experience field directly on the user
    await user.update({ experience: experience });
    
    console.log('User updated, new experience:', user.experience);

    return res.status(200).json({
      success: true,
      message: "Experience updated successfully",
      data: {
        id: advisor.id,
        userId: userId,
        experience: experience
      }
    });
  } catch (error) {
    console.error("Error updating advisor experience:", error);
    return res.status(500).json({ 
      success: false, 
      error: "Internal server error: " + error.message 
    });
  }
};
