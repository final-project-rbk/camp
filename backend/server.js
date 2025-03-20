require('dotenv').config();

const express = require('express');
const advisorRoutes = require('./routes/advisor.routes');
const cors = require('cors');
const db = require("./models/index");
const blogRoutes = require('./routes/blogs.routes');
const marcketPlaceRoutes = require('./routes/marchetPlace.routes');
const placeRoutes = require('./routes/Place.routes');
const userRoutes = require('./routes/user.routes');
const formularAdvisorRoutes = require('./routes/formularAdvisor.routes');
const authRoutes = require('./routes/auth.routes');
const adminRoutes = require('./routes/admin.routes');
const chatRoutes = require('./routes/chat.routes');
const eventRoutes = require('./routes/event.routes');
const jwt = require('jsonwebtoken');

// const advisorMediaRoutes = require('./routes/advisorMedia.routes');

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
  pingTimeout: 60000, // Increase ping timeout
  pingInterval: 25000, // Increase ping interval
  connectTimeout: 30000, // Connection timeout
  transports: ['websocket', 'polling'] // Prefer WebSocket, fallback to polling
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
      return next(new Error('Authentication error: Token not provided'));
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Find user and exclude sensitive data
    const user = await db.User.findByPk(decoded.id, {
      attributes: { 
        exclude: ['password', 'tokenVerification'],
        include: ['id', 'email', 'role', 'first_name', 'last_name', 'profile_image'] 
      }
    });

    if (!user) {
      return next(new Error('Authentication error: User not found'));
    }

    if (user.isBanned) {
      return next(new Error('Authentication error: Account is banned'));
    }

    // Attach user to socket
    socket.user = user;
    next();
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
      // Check if user is already in the room
      const existingMember = await db.RoomUser.findOne({
        where: {
          userId: socket.user.id,
          roomId: roomId
        }
      });

      // If user is not in the room, add them
      if (!existingMember) {
        await db.RoomUser.create({
          userId: socket.user.id,
          roomId: roomId
        });
      }

      socket.join(roomId);
      console.log(`User ${socket.user.first_name} (${socket.id}) joined room ${roomId}`);
      
      // Notify others in the room
      socket.to(roomId).emit('user_joined', {
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
      socket.emit('room_error', { 
        message: 'Failed to join room: ' + (error.name === 'SequelizeUniqueConstraintError' 
          ? 'You are already a member of this room' 
          : error.message)
      });
    }
  });

  // Handle new message with error handling and acknowledgment
  socket.on('send_message', async (data, callback) => {
    try {
      const { roomId, message, mediaUrls } = data;
      
      // Save message to database
      const newMessage = await db.Message.create({
        senderId: socket.user.id,
        roomId,
        content: message,
        mediaUrls: mediaUrls || []
      });

      const messageWithUser = await db.Message.findOne({
        where: { id: newMessage.id },
        include: [{
          model: db.User,
          attributes: ['id', 'first_name', 'last_name', 'profile_image']
        }]
      });

      // Broadcast message to room
      io.to(roomId).emit('receive_message', {
        ...messageWithUser.toJSON(),
        createdAt: new Date()
      });

      // Send delivery confirmation
      if (callback) callback({ success: true, messageId: newMessage.id });
    } catch (error) {
      console.error('Error sending message:', error);
      if (callback) callback({ success: false, error: error.message });
      socket.emit('message_error', {
        error: 'Failed to send message: ' + error.message,
        timestamp: new Date()
      });
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
app.use('/api/formularAdvisor', formularAdvisorRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/marketplace', marcketPlaceRoutes);
app.use('/api/events', eventRoutes);

const port = process.env.PORT || 3000;

// Start server with proper host binding
server.listen(port, '0.0.0.0', () => {
  console.log(`Server running on port ${port}`);
  console.log(`API available at http://localhost:${port}/api`);
  console.log(`Socket.IO available at http://localhost:${port}`);
}).on('error', (error) => {
  console.error('Server error:', error);
});

