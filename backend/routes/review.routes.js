const express = require('express');
const router = express.Router();
const reviewController = require('../controlles/review.controller');

// Get reviews for a place
router.get('/place/:placeId', reviewController.getPlaceReviews);

// Get a user's review for a specific place
router.get('/place/:placeId/user/:userId', reviewController.getUserPlaceReview);

// Get review by ID
router.get('/:id', reviewController.getReviewById);

// Create or update a review
router.post('/', reviewController.createOrUpdateReview);

// Delete a review
router.delete('/:id', reviewController.deleteReview);

module.exports = router;
