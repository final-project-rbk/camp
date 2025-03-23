const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth.middleware');
const { createRoom, sendMessage, getMessages, getRooms, getOrCreateRoom } = require('../controlles/chat.controller');
const { Room } = require('../models');

router.post('/rooms', authMiddleware, createRoom);
router.post('/messages', authMiddleware, sendMessage);
router.get('/rooms/:roomId/messages', authMiddleware, getMessages);
router.get('/rooms', authMiddleware, getRooms);
router.post('/rooms/get-or-create', authMiddleware, getOrCreateRoom);

// Check if room exists
router.get('/rooms/:roomId/validate', authMiddleware, async (req, res) => {
  try {
    const roomId = parseInt(req.params.roomId, 10);
    
    if (isNaN(roomId)) {
      return res.status(400).json({ exists: false, error: 'Invalid room ID' });
    }
    
    const room = await Room.findByPk(roomId);
    
    return res.status(200).json({
      exists: !!room,
      room: room ? { id: room.id, name: room.name } : null
    });
  } catch (error) {
    console.error('Error validating room:', error);
    return res.status(500).json({ exists: false, error: error.message });
  }
});

module.exports = router;