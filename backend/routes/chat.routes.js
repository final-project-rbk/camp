const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth.middleware');
const { createRoom, sendMessage, getMessages, getRooms, getOrCreateRoom } = require('../controlles/chat.controller');

router.post('/rooms', authMiddleware, createRoom);
router.post('/messages', authMiddleware, sendMessage);
router.get('/rooms/:roomId/messages', authMiddleware, getMessages);
router.get('/rooms', authMiddleware, getRooms);
router.post('/rooms/get-or-create', authMiddleware, getOrCreateRoom);

module.exports = router;