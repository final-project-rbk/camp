const { Review, User, Place } = require('../models');

const reviewController = {
  // Get reviews for a specific place
  getPlaceReviews: async (req, res) => {
    try {
      const { placeId } = req.params;
      
      const reviews = await Review.findAll({
        where: { placeId },
        include: [{
          model: User,
          attributes: ['id', 'username', 'avatar']
        }],
        order: [['created_at', 'DESC']]
      });
      
      res.status(200).json({
        success: true,
        data: reviews
      });
    } catch (error) {
      console.error('Error in getPlaceReviews:', error);
      res.status(500).json({
        success: false,
        error: 'Error fetching place reviews',
        details: error.message
      });
    }
  },
  
  // Get a specific review
  getReviewById: async (req, res) => {
    try {
      const { id } = req.params;
      const review = await Review.findByPk(id, {
        include: [{
          model: User,
          attributes: ['id', 'username', 'avatar']
        }]
      });
      
      if (!review) {
        return res.status(404).json({
          success: false,
          error: 'Review not found'
        });
      }
      
      res.status(200).json({
        success: true,
        data: review
      });
    } catch (error) {
      console.error('Error in getReviewById:', error);
      res.status(500).json({
        success: false,
        error: 'Error fetching review',
        details: error.message
      });
    }
  },
  
  // Get a user's review for a specific place
  getUserPlaceReview: async (req, res) => {
    try {
      const { placeId, userId } = req.params;
      
      const review = await Review.findOne({
        where: {
          placeId,
          userId
        }
      });
      
      res.status(200).json({
        success: true,
        data: review || null
      });
    } catch (error) {
      console.error('Error in getUserPlaceReview:', error);
      res.status(500).json({
        success: false,
        error: 'Error fetching user review',
        details: error.message
      });
    }
  },
  
  // Create or update a review
  createOrUpdateReview: async (req, res) => {
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
      
      // Update the place's average rating
      await updatePlaceRating(placeId);
      
      res.status(200).json({
        success: true,
        data: review
      });
    } catch (error) {
      console.error('Error in createOrUpdateReview:', error);
      res.status(500).json({
        success: false,
        error: 'Error saving review',
        details: error.message
      });
    }
  },
  
  // Delete a review
  deleteReview: async (req, res) => {
    try {
      const { id } = req.params;
      const review = await Review.findByPk(id);
      
      if (!review) {
        return res.status(404).json({
          success: false,
          error: 'Review not found'
        });
      }
      
      const placeId = review.placeId;
      
      await review.destroy();
      
      // Update the place's average rating
      await updatePlaceRating(placeId);
      
      res.status(200).json({
        success: true,
        message: 'Review deleted successfully'
      });
    } catch (error) {
      console.error('Error in deleteReview:', error);
      res.status(500).json({
        success: false,
        error: 'Error deleting review',
        details: error.message
      });
    }
  }
};

// Helper function to update a place's average rating
async function updatePlaceRating(placeId) {
  try {
    const reviews = await Review.findAll({
      where: { placeId },
      attributes: ['rating']
    });
    
    if (reviews.length === 0) {
      // No reviews, set rating to 0
      await Place.update({ rating: 0 }, { where: { id: placeId } });
      return;
    }
    
    // Calculate average rating
    const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
    const averageRating = parseFloat((totalRating / reviews.length).toFixed(1));
    
    // Update the place's rating
    await Place.update({ rating: averageRating }, { where: { id: placeId } });
  } catch (error) {
    console.error('Error updating place rating:', error);
    throw error;
  }
}

module.exports = reviewController;
