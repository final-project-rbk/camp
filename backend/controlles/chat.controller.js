const { Room, Message, RoomUser, User, Media } = require('../models');
const {Sequelize}=require('sequelize');
const media = require('../models/media');
const sequelize = require('sequelize');

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

    // Don't allow chat with self
    if (currentUserId === userId) {
      return res.status(400).json({ message: "Cannot create chat with yourself" });
    }

    // Check if users exist
    const [currentUser, otherUser] = await Promise.all([
      User.findByPk(currentUserId),
      User.findByPk(userId)
    ]);

    if (!otherUser) {
      return res.status(404).json({ message: "User not found" });
    }

    // Find existing room between these users
    const existingRoom = await Room.findOne({
      include: [{
        model: User,
        attributes: ['id', 'first_name', 'last_name', 'profile_image'],
        where: {
          id: [currentUserId, userId]
        },
        through: { attributes: [] }
      }],
      having: Sequelize.literal('COUNT(DISTINCT Users.id) = 2'),
      group: ['Room.id']
    });

    if (existingRoom) {
      // Return existing room with users
      return res.json({
        ...existingRoom.toJSON(),
        isExisting: true
      });
    }

    // Create new room if none exists
    const newRoom = await sequelize.transaction(async (t) => {
      const room = await Room.create({
        name: `Chat between ${currentUser.first_name} and ${otherUser.first_name}`
      }, { transaction: t });

      // Add both users to the room
      await Promise.all([
        RoomUser.create({
          userId: currentUserId,
          roomId: room.id
        }, { transaction: t }),
        RoomUser.create({
          userId: userId,
          roomId: room.id
        }, { transaction: t })
      ]);

      // Fetch the room with users
      const roomWithUsers = await Room.findOne({
        where: { id: room.id },
        include: [{
          model: User,
          attributes: ['id', 'first_name', 'last_name', 'profile_image']
        }],
        transaction: t
      });

      return {
        ...roomWithUsers.toJSON(),
        isNew: true
      };
    });

    res.status(201).json(newRoom);
  } catch (error) {
    console.error('Error in getOrCreateRoom:', error);
    res.status(500).json({ message: "Error creating chat room", error: error.message });
  }
};

module.exports = {
  createRoom,
  sendMessage,
  getMessages,
  getRooms,
  getOrCreateRoom
};
