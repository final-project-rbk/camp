// Get advisor profile
exports.getAdvisorProfile = async (req, res) => {
  try {
    console.log('Fetching user profile by ID:', req.params.id);
    
    const user = await User.findByPk(req.params.id, {
      include: [
        {
          model: Place,
          as: 'Places',
          include: [
            {
              model: Review,
              as: 'Reviews',
              attributes: ['rating']
            }
          ]
        }
      ]
    });

    if (!user) {
      console.log('No user found with ID:', req.params.id);
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    console.log('Found user:', user.id);

    // Calculate average rating and review count for each place
    const places = user.Places.map(place => {
      const ratings = place.Reviews.map(review => review.rating);
      const averageRating = ratings.length > 0 
        ? ratings.reduce((a, b) => a + b, 0) / ratings.length 
        : 0;

      return {
        id: place.id,
        name: place.name,
        description: place.description,
        location: place.location,
        images: place.images,
        status: place.status,
        exclusive_details: place.exclusive_details,
        rating: averageRating,
        reviewCount: ratings.length,
        createdAt: place.createdAt,
        updatedAt: place.updatedAt
      };
    });

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          first_name: user.first_name,
          last_name: user.last_name,
          email: user.email,
          profile_image: user.profile_image,
          bio: user.bio,
          experience: user.experience,
          role: user.role,
          points: user.points
        },
        places
      }
    });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching user profile',
      error: error.message
    });
  }
};

// Add a new place
exports.addPlace = async (req, res) => {
  try {
    const { name, location, description, images } = req.body;
    
    // Create the place with the authenticated user's ID
    const place = await Place.create({
      name,
      location,
      description,
      images,
      creatorId: req.user.id,
      status: 'pending'
    });

    res.status(201).json({
      success: true,
      data: place
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
}; 