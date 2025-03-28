require('dotenv').config();

const express = require('express');
const advisorRoutes = require('./routes/advisor.routes');
const cors = require('cors');
const db = require("./models/index");
const blogRoutes = require('./routes/blogs.routes');
const marcketPlaceRoutes = require('./routes/marchetPlace.routes');
const placeRoutes = require('./routes/Place.routes');
const critiriaRoutes = require('./routes/critiria.routes');
const advisorDashboardRoutes = require('./routes/advisor.dashbored.routes');
const adminRoutes = require('./routes/admin.routes');
const eventRoutes = require('./routes/event.routes');

const userRoutes = require('./routes/user.routes');
const formularAdvisorRoutes = require('./routes/formularAdvisor.routes');
const authRoutes = require('./routes/auth.routes');
const chatRoutes = require('./routes/chat.routes');
const jwt = require('jsonwebtoken');

// const advisorMediaRoutes = require('./routes/advisorMedia.routes');

const adminPlaceRoutes = require('./routes/admin.place.routes');
const app = express();


const server = require('http').createServer(app);

// Configure Socket.IO with proper settings for mobile
const io = require('socket.io')(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
    allowedHeaders: ["Authorization", "Content-Type"],
    credentials: true
  },
  pingTimeout: 120000, // Increase ping timeout further
  pingInterval: 10000, // Decrease ping interval
  connectTimeout: 60000, // Increase connection timeout
  transports: ['websocket', 'polling'], // Prefer WebSocket, fallback to polling
  allowEIO3: true, // Allow Engine.IO 3 compatibility
  maxHttpBufferSize: 1e8 // Increase buffer size for larger payloads
});

// Configure CORS for Express
app.use(cors({
  origin: "*",
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Authorization', 'Content-Type'],
  credentials: true,
  maxAge: 86400 // CORS preflight cache for 24 hours
}));

// Increase payload size limit
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

app.use(express.static(__dirname + '/../client/dist'));

// Connect all our routes to our application
app.use('/api/advisor', advisorRoutes);

// app.use('/api/marketplace', marcketPlaceRoutes);
app.use('/api/chat', chatRoutes);

// Store active users and their socket IDs
const activeUsers = new Map();

// Socket.IO middleware for authentication
io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth.token || socket.handshake.query.token;
    
    if (!token) {
      console.log('Socket auth failed: Token not provided');
      return next(new Error('Authentication error: Token not provided'));
    }

    // Verify token
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Find user and exclude sensitive data
      const user = await db.User.findByPk(decoded.id, {
        attributes: { 
          exclude: ['password', 'tokenVerification'],
          include: ['id', 'email', 'role', 'first_name', 'last_name', 'profile_image'] 
        }
      });

      if (!user) {
        console.log('Socket auth failed: User not found');
        return next(new Error('Authentication error: User not found'));
      }

      if (user.isBanned) {
        console.log('Socket auth failed: User is banned');
        return next(new Error('Authentication error: Account is banned'));
      }

      // Attach user to socket
      socket.user = user;
      console.log('Socket authenticated successfully for user:', user.first_name);
      next();
    } catch (jwtError) {
      console.log('Socket auth failed: JWT verification failed -', jwtError.message);
      return next(new Error('Authentication error: Invalid token'));
    }
  } catch (error) {
    console.error('Socket authentication error:', error);
    next(new Error('Authentication error: ' + error.message));
  }
});

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('User connected:', socket.id, 'User:', socket.user.first_name);

  // Add user to active users
  activeUsers.set(socket.user.id, socket.id);
  
  // Broadcast user's online status
  io.emit('user_status', {
    userId: socket.user.id,
    status: 'online'
  });

  // Handle connection error
  socket.on('error', (error) => {
    console.error('Socket error:', error);
  });

  // Join a chat room
  socket.on('join_room', async (roomId) => {
    try {
      console.log(`Attempting to join room with ID: ${roomId}`);
      
      // Convert roomId to number to ensure type consistency
      const roomIdInt = parseInt(roomId, 10);
      
      if (isNaN(roomIdInt)) {
        console.error(`Invalid room ID: ${roomId}`);
        socket.emit('room_error', { message: 'Invalid room ID format' });
        return;
      }
      
      // First check if the room exists
      let roomExists = await db.Room.findByPk(roomIdInt);
      
      // If room doesn't exist, try to create it
      if (!roomExists) {
        console.log(`Room with ID ${roomIdInt} does not exist - attempting to recreate`);
        
        try {
          roomExists = await db.Room.create({
            id: roomIdInt,
            name: `Room_recovered_${Date.now()}`
          });
          
          console.log(`Successfully recreated room with ID ${roomIdInt}`);
        } catch (recreateError) {
          console.error(`Failed to recreate room: ${recreateError.message}`);
          socket.emit('room_error', { message: 'Room does not exist and could not be recreated' });
          return;
        }
      }

      // Check if user is already in the room
      const existingMember = await db.RoomUser.findOne({
        where: {
          userId: socket.user.id,
          roomId: roomIdInt
        }
      });

      // If user is not in the room, add them
      if (!existingMember) {
        await db.RoomUser.create({
          userId: socket.user.id,
          roomId: roomIdInt
        });
      }

      socket.join(roomIdInt.toString());
      console.log(`User ${socket.user.first_name} (${socket.id}) joined room ${roomIdInt}`);
      
      // Notify others in the room
      socket.to(roomIdInt.toString()).emit('user_joined', {
        user: {
          id: socket.user.id,
          first_name: socket.user.first_name,
          last_name: socket.user.last_name,
          profile_image: socket.user.profile_image
        },
        timestamp: new Date()
      });
    } catch (error) {
      console.error('Error joining room:', error);
      let errorMessage = 'Failed to join room';
      
      if (error.name === 'SequelizeUniqueConstraintError') {
        errorMessage = 'You are already a member of this room';
      } else if (error.name === 'SequelizeForeignKeyConstraintError') {
        errorMessage = 'The room you\'re trying to join does not exist';
      } else {
        errorMessage = error.message;
      }
      
      socket.emit('room_error', { message: errorMessage });
    }
  });

  // Handle new message with error handling and acknowledgment
  socket.on('send_message', async (data, callback) => {
    try {
      const { roomId, message, mediaUrls, replyToId } = data;
      
      console.log(`Attempting to send message to room: ${roomId}, content: ${message?.substring(0, 20)}..., Media URLs: ${JSON.stringify(mediaUrls || [])}`);
      
      // Convert roomId to number to ensure type consistency
      const roomIdInt = parseInt(roomId, 10);
      
      if (isNaN(roomIdInt)) {
        console.error(`Invalid room ID for message: ${roomId}`);
        if (callback) callback({ success: false, error: 'Invalid room ID format' });
        return;
      }
      
      // First check if the room exists
      const roomExists = await db.Room.findByPk(roomIdInt);
      if (!roomExists) {
        console.error(`Cannot send message - Room with ID ${roomIdInt} does not exist`);
        if (callback) callback({ success: false, error: 'Room does not exist' });
        return;
      }

      // Ensure mediaUrls is always an array
      const normalizedMediaUrls = Array.isArray(mediaUrls) ? mediaUrls : [];
      
      // Save message to database
      const newMessage = await db.Message.create({
        senderId: parseInt(socket.user.id, 10),
        roomId: roomIdInt,
        content: message,
        mediaUrls: normalizedMediaUrls,
        replyToId: replyToId ? parseInt(replyToId, 10) : null // Add reply support
      });

      const messageWithUser = await db.Message.findOne({
        where: { id: newMessage.id },
        include: [{
          model: db.User,
          as: 'sender',
          attributes: ['id', 'first_name', 'last_name', 'profile_image']
        }]
      });

      // Convert to JSON and ensure mediaUrls is present
      const messageJSON = messageWithUser.toJSON();
      if (!messageJSON.mediaUrls) {
        messageJSON.mediaUrls = normalizedMediaUrls;
      }

      // Broadcast message to room
      io.to(roomIdInt.toString()).emit('receive_message', {
        ...messageJSON,
        createdAt: new Date()
      });

      console.log(`Message successfully sent to room ${roomIdInt}`);
      
      // Send delivery confirmation
      if (callback) callback({ success: true, messageId: newMessage.id });
    } catch (error) {
      console.error('Error sending message:', error);
      
      let errorMessage = 'Failed to send message';
      if (error.name === 'SequelizeForeignKeyConstraintError') {
        errorMessage = 'The room you\'re trying to message does not exist';
      } else {
        errorMessage = error.message;
      }
      
      if (callback) callback({ success: false, error: errorMessage });
      socket.emit('message_error', {
        error: errorMessage,
        timestamp: new Date()
      });
    }
  });

  // Handle message reactions
  socket.on('add_reaction', async (data) => {
    try {
      const { messageId, reaction, roomId } = data;
      
      // Validate the reaction
      const validReactions = ['like', 'love', 'laugh', 'surprised', 'sad', 'angry'];
      if (!validReactions.includes(reaction)) {
        socket.emit('reaction_error', { error: 'Invalid reaction type' });
        return;
      }
      
      // Update the message with the reaction
      await db.Message.update(
        { reaction },
        { where: { id: messageId } }
      );
      
      // Broadcast the reaction to the room
      io.to(roomId.toString()).emit('message_reaction', {
        messageId,
        reaction,
        userId: socket.user.id,
        timestamp: new Date()
      });
      
    } catch (error) {
      console.error('Error adding reaction:', error);
      socket.emit('reaction_error', { error: 'Failed to add reaction' });
    }
  });

  // Handle typing status with error handling
  socket.on('typing', (data) => {
    try {
      const { roomId } = data;
      socket.to(roomId).emit('typing_status', { 
        user: {
          id: socket.user.id,
          first_name: socket.user.first_name,
          last_name: socket.user.last_name
        },
        isTyping: true,
        timestamp: new Date()
      });
    } catch (error) {
      console.error('Error handling typing status:', error);
    }
  });

  socket.on('stop_typing', (data) => {
    try {
      const { roomId } = data;
      socket.to(roomId).emit('typing_status', { 
        user: {
          id: socket.user.id,
          first_name: socket.user.first_name,
          last_name: socket.user.last_name
        },
        isTyping: false,
        timestamp: new Date()
      });
    } catch (error) {
      console.error('Error handling stop typing:', error);
    }
  });

  // Handle read receipts with error handling
  socket.on('message_read', async (data) => {
    try {
      const { messageId, roomId } = data;
      await db.Message.update(
        { isRead: true, readAt: new Date() },
        { where: { id: messageId } }
      );
      
      io.to(roomId).emit('message_status_update', {
        messageId,
        isRead: true,
        readAt: new Date(),
        userId: socket.user.id
      });
    } catch (error) {
      console.error('Error updating message status:', error);
      socket.emit('read_receipt_error', {
        error: 'Failed to update message status',
        messageId: data.messageId
      });
    }
  });

  // Handle disconnect
  socket.on('disconnect', () => {
    try {
      // Remove user from active users
      activeUsers.delete(socket.user.id);
      
      // Broadcast user's offline status
      io.emit('user_status', {
        userId: socket.user.id,
        status: 'offline'
      });
      
      console.log('User disconnected:', socket.id);
    } catch (error) {
      console.error('Error handling disconnect:', error);
    }
  });
});

// Test database connection
db.connection.authenticate()
  .then(() => {
    console.log('Database connection established successfully.');
  })
  .catch(err => {
    console.error('Unable to connect to the database:', err);
  });

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date() });
});

// Add all routes
app.use('/api/blogs', blogRoutes);
app.use('/api/places', placeRoutes);
app.use('/api/categories', require('./routes/categorie.routes')); 
app.use('/api/users', userRoutes);
app.use('/api/criteria', critiriaRoutes);
app.use('/api/reviews', require('./routes/review.routes'));
app.use('/api/formularAdvisor', formularAdvisorRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/marketplace', marcketPlaceRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/favorites', require('./routes/Favorite.routes'));
app.use('/api/advisor', advisorRoutes);
// Add advisor dashboard routes
app.use('/api/advisor/dashboard', advisorDashboardRoutes);

// Add the admin place routes
app.use('/api/admin', adminPlaceRoutes);

const port = process.env.PORT || 3000;

// Start server with proper host binding
server.listen(port, '0.0.0.0', () => {
  console.log(`Server running on port ${port}`);
  console.log(`API available at http://localhost:${port}/api`);
  console.log(`Socket.IO available at http://localhost:${port}`);
}).on('error', (error) => {
  console.error('Server error:', error);
});

