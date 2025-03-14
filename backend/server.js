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
const eventRoutes = require('./routes/event.routes');
const app = express();
const hintRoutes = require('./routes/hintRoutes');

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

app.use('/api/marketplace', marcketPlaceRoutes);

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
app.use('/api/favorites', require('./routes/Favorite.routes'));
app.use('/api/users', userRoutes);
app.use('/api/formularAdvisor', formularAdvisorRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/hints', hintRoutes);
app.use('/api/marketplace', marcketPlaceRoutes);

app.use('/api/events', eventRoutes);

const port = process.env.PORT || 3000;

app.listen(port, '0.0.0.0', () => {
  console.log(`Server running on port ${port}`);
});

