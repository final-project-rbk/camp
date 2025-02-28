require('dotenv').config();

const express = require('express');
const advisorRoutes = require('./routes/advisor.routes');
const cors = require('cors');
const db = require("./models/index");
const blogRoutes = require('./routes/blogs.router');
const placeRoutes = require('./routes/Place');
const app = express();

// Configure CORS
app.use(cors({
  origin: [
    'http://localhost:19006', 
    'http://localhost:19000', 
    'http://localhost:8081',
    'http://192.168.11.49',
    'http://192.168.11.49:19006',
    'http://192.168.11.49:19000',
    'http://192.168.11.49:8081'
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.static(__dirname + '/../client/dist'));
app.use(express.json())
app.use(express.urlencoded({extended: true}))

// Connect all our routes to our application
app.use('/api/advisor', advisorRoutes);

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
app.use('/api/categories', require('./routes/categorie')); 

const port = process.env.PORT || 3000;

app.listen(port, '0.0.0.0', () => {
  console.log(`Server running on port ${port}`);
});

