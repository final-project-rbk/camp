const express = require('express');
const router = express.Router();
const hintController = require('../controlles/hint.controller');
const adminMiddleware = require('../middleware/admin.middleware');

// Admin routes
router.post('/', hintController.createHint);
router.put('/:id',  hintController.updateHint);
router.delete('/:id',  hintController.deleteHint);

// Public routes
router.get('/', hintController.getAllHints);
router.get('/most-viewed', hintController.getMostViewedHints);
router.get('/:id', hintController.getHintById);

module.exports = router;