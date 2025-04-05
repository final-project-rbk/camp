const { Room, Message, RoomUser, User, Media, connection } = require('../models');
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
      senderId: req.user.id
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
      include: [
        { 
          model: User, 
          as: 'sender',
          attributes: ['id', 'first_name', 'last_name', 'profile_image']
        }
      ],
      order: [['createdAt', 'ASC']]
    });
    res.status(200).json(messages);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getRooms = async (req, res) => {
  try {
    console.log("Getting rooms for user:", req.user.id);
    
    // Log all available models
    console.log("Available models:", Object.keys(require('../models')));
    
    const rooms = await Room.findAll({
      include: [
        {
          model: User,
          through: RoomUser,
          attributes: ['id', 'first_name', 'last_name', 'profile_image']
        }
      ]
    });
    
    console.log("Total rooms found:", rooms.length);

    // Filter rooms to include only those where the authenticated user is a member
    const userRooms = rooms.filter(room => 
      room.users.some(user => user.id === req.user.id)
    );
    
    console.log("User rooms after filtering:", userRooms.length);

    // Add last message to each room
    const roomsWithLastMessage = await Promise.all(userRooms.map(async (room) => {
      try {
        const lastMessage = await Message.findOne({
          where: { roomId: room.id },
          order: [['createdAt', 'DESC']],
          include: [
            { 
              model: User, 
              as: 'sender',
              attributes: ['id', 'first_name', 'last_name', 'profile_image']
            }
          ]
        });
        
        const roomData = room.toJSON();
        roomData.lastMessage = lastMessage;
        return roomData;
      } catch (error) {
        console.error(`Error getting last message for room ${room.id}:`, error);
        // Return room without last message in case of error
        const roomData = room.toJSON();
        roomData.lastMessage = null;
        return roomData;
      }
    }));

    res.status(200).json(roomsWithLastMessage);
  } catch (error) {
    console.error("Error in getRooms:", error);
    res.status(500).json({ error: error.message });
  }
};

const getOrCreateRoom = async (req, res) => {
  // Use a transaction to ensure data consistency
  const transaction = await connection.transaction();
  
  try {
    const { userId } = req.body;
    const currentUserId = req.user.id;
    
    console.log("GetOrCreateRoom request - User IDs:", userId, currentUserId);
    
    // Validate input
    if (!userId || !currentUserId) {
      console.log("Invalid user IDs provided");
      await transaction.rollback();
      return res.status(400).json({ error: "Invalid user IDs" });
    }
    
    // Convert to integers for consistency
    const userIdInt = parseInt(userId, 10);
    const currentUserIdInt = parseInt(currentUserId, 10);
    
    if (isNaN(userIdInt) || isNaN(currentUserIdInt)) {
      console.log("User IDs are not valid integers");
      await transaction.rollback();
      return res.status(400).json({ error: "User IDs must be valid integers" });
    }

    // Find a room that includes both users
    const rooms = await Room.findAll({
      include: [{
        model: User,
        where: { id: [currentUserIdInt, userIdInt] },
        through: { attributes: [] }
      }],
      transaction
    });
    
    console.log("Rooms found:", rooms.length);
    if (rooms.length > 0) {
      console.log("Room details:", JSON.stringify(rooms.map(r => ({ 
        id: r.id, 
        name: r.name, 
        userCount: r.users?.length || 0 
      }))));
    }

    // Find a room where both users are members (has exactly 2 users)
    let room = rooms.find(r => r.users && r.users.length === 2);
    
    // Create response object
    let responseRoom = null;
    let isNewRoom = false;

    // If no room exists, create a new one
    if (!room) {
      console.log("No existing room found, creating new room");
      responseRoom = await Room.create({ 
        name: `Room_${currentUserIdInt}_${userIdInt}` 
      }, { transaction });
      
      const roomId = responseRoom.id;
      console.log("New room created with ID:", roomId);
      
      // Create room user relationships
      await RoomUser.bulkCreate([
        { roomId, userId: currentUserIdInt }, 
        { roomId, userId: userIdInt }
      ], { transaction });
      
      console.log("RoomUser associations created");
      isNewRoom = true;
    } else {
      console.log("Existing room found with ID:", room.id);
      responseRoom = room;
      isNewRoom = false;
    }

    // Commit the transaction
    await transaction.commit();

    // Add isNew property to response
    const response = responseRoom.toJSON();
    response.isNew = isNewRoom;

    res.status(200).json(response);
  } catch (error) {
    console.error("Error in getOrCreateRoom:", error);
    
    // Rollback the transaction
    await transaction.rollback();
    
    res.status(500).json({ 
      error: error.message,
      details: error.name || 'Unknown error type'
    });
  }
};

module.exports = {
  createRoom,
  sendMessage,
  getMessages,
  getRooms,
  getOrCreateRoom
};
