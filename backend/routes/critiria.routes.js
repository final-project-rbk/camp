const express = require('express');
const router = express.Router();
const critiriaController = require('../controlles/critiria.controller');

// Debug route to test accessibility
router.get('/debug', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Criteria routes are accessible',
    timestamp: new Date().toISOString()
  });
});

// POST route for rating submission
router.post('/rate', critiriaController.submitCritiriaRating);

// GET routes for specific patterns
router.get('/place/:placeId', critiriaController.getPlaceCritiria);

// Generic ID route should come after more specific routes
router.get('/', critiriaController.getAllCritiria);
router.get('/:id', critiriaController.getCritiriaById);

module.exports = router;
