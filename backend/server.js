require('dotenv').config();

const express = require('express');
const advisorRoutes = require('./routes/advisor.routes');
const cors = require('cors');
const db = require("./models/index");
const blogRoutes = require('./routes/blogs.routes');
const marcketPlaceRoutes = require('./routes/marchetPlace.routes');
const placeRoutes = require('./routes/Place.routes');
const app = express();

// Configure CORS
app.use(cors());

app.use(express.static(__dirname + '/../client/dist'));
app.use(express.json())
app.use(express.urlencoded({extended: true}))

// Connect all our routes to our application
app.use('/api/', advisorRoutes);
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

const port = process.env.PORT || 3000;

app.listen(port, '0.0.0.0', () => {
  console.log(`Server running on port ${port}`);
});

