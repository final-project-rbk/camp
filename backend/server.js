require('dotenv').config();

const express = require('express');
let app = express();
const cors = require("cors");
const db = require("./models/index");
app.use(express.static(__dirname + '/../client/dist'));
app.use(express.json())
app.use(cors())
app.use(express.urlencoded({extended: true}))

// Add a basic route
app.get('/', (req, res) => {
  res.send('Server is running!');
});

let port = 3000;

app.listen(port, function() {
  console.log(`listening on port ${port}`);
});

