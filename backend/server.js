require('dotenv').config();

const express = require('express');
const advisorRoutes = require('./routes/advisor.routes');
let app = express();
const cors = require("cors");
const db = require("./models/index");
const blogRoutes = require('./routes/blogs.router');
app.use(express.static(__dirname + '/../client/dist'));
app.use(express.json())
app.use(cors({
  origin: '*', // In production, replace with your specific domain
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.urlencoded({extended: true}))

// Connect all our routes to our application
app.use('/api', advisorRoutes);



// Add a basic route
app.get('/', (req, res) => {
  res.send('Server is running!');
});
app.use('/api/blogs', blogRoutes);

let port = 3000;

app.listen(port, function() {
  console.log(`listening on port ${port}`);
});

