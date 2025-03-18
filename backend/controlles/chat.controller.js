const { Room, Message, RoomUser, User, Media } = require('../models');
const {Sequelize}=require('sequelize');
const media = require('../models/media');

const createRoom = async (req, res) => {
  try {
    const { name, userIds } = req.body;
    const room = await Room.create({ name });
    await room.addUsers(userIds);
    res.status(201).json(room);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const sendMessage = async (req, res) => {
  try {
    const { roomId, content, mediaUrls } = req.body;
    const message = await Message.create({
      content,
      roomId,
      userId: req.user.id
    });

    if (mediaUrls && mediaUrls.length > 0) {
      const mediaPromises = mediaUrls.map(url => Media.create({ url, messageId: message.id }));
      await Promise.all(mediaPromises);
    }

    res.status(201).json(message);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getMessages = async (req, res) => {
  try {
    const { roomId } = req.params;
    const messages = await Message.findAll({
      where: { roomId },
      include: [{ model: Media }, { model: User, attributes: ['id', 'first_name', 'last_name','profile_image'] }]
    });
    res.status(200).json(messages);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getRooms = async (req, res) => {
  try {
    const rooms = await Room.findAll({
      include: [
        {
          model: User,
          through: RoomUser,
          attributes: ['id', 'first_name', 'last_name', 'profile_image']
        }
      ]
    });

    // Filter rooms to include only those where the authenticated user is a member
    const userRooms = rooms.filter(room => 
      room.users.some(user => user.id === req.user.id)
    );

    res.status(200).json(userRooms);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getOrCreateRoom = async (req, res) => {
  try {
    const { userId } = req.body;
    const currentUserId = req.user.id;
    console.log(userId,currentUserId,"hhhh");
    

    // Find a room that includes both users
    const rooms = await Room.findAll({

      include: [{
        model: User,
        where: { id: [currentUserId, userId] },
        through: { attributes: [] }
      }]
    });
console.log("rooms",rooms);

    let room = rooms.find(r => r.users ?r.users.length===2:false) 
    

    // If no room exists, create a new one
    if (!room) {
      room = await Room.create({ name: `Room_${currentUserId}_${userId}` });
      await RoomUser.bulkCreate([{ roomId: room.id, userId: currentUserId }, { roomId: room.id, userId }]);
    }

    res.status(200).json(room);
  } catch (error) {
    throw error
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  createRoom,
  sendMessage,
  getMessages,
  getRooms,
  getOrCreateRoom
};
