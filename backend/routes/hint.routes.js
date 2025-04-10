const express = require('express');
const router = express.Router();
const hintController = require('../controlles/hint.controller');
const adminMiddleware = require('../middleware/admin.middleware');
const authMiddleware = require('../middleware/auth.middleware');

// Admin routes - require authentication and admin role
router.post('/', authMiddleware, adminMiddleware, hintController.createHint);
router.put('/:id', authMiddleware, adminMiddleware, hintController.updateHint);
router.delete('/:id', authMiddleware, adminMiddleware, hintController.deleteHint);
router.post('/bulk', authMiddleware, adminMiddleware, hintController.bulkInsertHints);

// Public routes
router.get('/', hintController.getAllHints);
router.get('/most-viewed', hintController.getMostViewedHints);
router.get('/:id', hintController.getHintById);

// View increment route
router.post('/:id/view', hintController.incrementViewCount);

module.exports = router; 