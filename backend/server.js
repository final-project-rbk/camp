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


// const advisorMediaRoutes = require('./routes/advisorMedia.routes');
const adminRoutes = require('./routes/admin.routes');
const chatRoutes = require('./routes/chat.routes'); // Ensure this path is correct
const eventRoutes = require('./routes/event.routes');

const app = express();
const server = require('http').createServer(app);
const io = require('socket.io')(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// Configure CORS
app.use(cors({
  origin: '*',  // Be careful with this in production
  credentials: true
}));

app.use(express.static(__dirname + '/../client/dist'));
app.use(express.json())
app.use(express.urlencoded({extended: true}))

// Connect all our routes to our application
app.use('/api/advisor', advisorRoutes);

// app.use('/api/marketplace', marcketPlaceRoutes);
app.use('/api/chat', chatRoutes);

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Join a chat room
  socket.on('join_room', (roomId) => {
    socket.join(roomId);
    console.log(`User ${socket.id} joined room ${roomId}`);
  });

  // Handle new message
  socket.on('send_message', async (data) => {
    try {
      const { senderId, receiverId, message, productId, roomId } = data;
      
      // Save message to database
      const newMessage = await db.Chat.create({
        senderId,
        receiverId,
        message,
        productId
      });

      // Broadcast message to room
      io.to(roomId).emit('receive_message', {
        ...newMessage.toJSON(),
        createdAt: new Date()
      });
    } catch (error) {
      console.error('Error sending message:', error);
    }
  });

  // Handle typing status
  socket.on('typing', (data) => {
    const { roomId, username } = data;
    socket.to(roomId).emit('typing_status', { username, isTyping: true });
  });

  socket.on('stop_typing', (data) => {
    const { roomId, username } = data;
    socket.to(roomId).emit('typing_status', { username, isTyping: false });
  });

  // Handle disconnect
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
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

// Add a basic route
app.get('/', (req, res) => {
  res.send('Server is running!');
});
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

server.listen(port, '0.0.0.0', () => {
  console.log(`Server running on port ${port}`);
});

