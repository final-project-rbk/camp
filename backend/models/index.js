const { Sequelize, DataTypes } = require("sequelize");
require('dotenv').config();

// Initialize Sequelize connection
const connection = new Sequelize(process.env.Database, process.env.User, process.env.Password, {
  host: process.env.HOST,
  dialect: "mysql",
  logging: false
});

// Import all models
const models = {
  User: require("./User")(connection, DataTypes),
  Place: require("./Place")(connection, DataTypes),
  Event: require("./Event")(connection, DataTypes),
  Rank: require("./rank")(connection, DataTypes),
  Favorite: require("./Favorite")(connection, DataTypes),
  Media: require("./media")(connection, DataTypes),
  Categorie: require("./categorie")(connection, DataTypes),
  Chat: require("./Chat")(connection, DataTypes),
  Advisor: require("./advisor")(connection, DataTypes),
  Citiria: require("./critiria")(connection, DataTypes),
  Review: require("./review")(connection, DataTypes),
  PlaceUser: require("./PlaceUser")(connection, DataTypes),
  PlaceCategorie: require("./PlaceCategorie")(connection, DataTypes),
  Blog: require("./blog")(connection, DataTypes),
  PlaceCitiria: require("./placeCritiria")(connection, DataTypes)
};

// Destructure models for easier access
const {
  User,
  Place,
  Event,
  Rank,
  Favorite,
  Media,
  Categorie,
  Chat,
  Advisor,
  Citiria,
  Review,
  PlaceUser,
  PlaceCategorie,
  Blog,
  PlaceCitiria,
  
} = models;

// Define relationships with aliases
const defineAssociations = () => {
  // User relationships
  User.hasMany(Media, { foreignKey: "userId", as: "Media" });
  Media.belongsTo(User, { foreignKey: "userId", as: "User" });

  User.hasMany(Review, { foreignKey: "userId", as: "Reviews" });
  Review.belongsTo(User, { foreignKey: "userId", as: "User" });

  User.hasOne(Advisor, { foreignKey: "userId", as: "Advisor" });
  Advisor.belongsTo(User, { foreignKey: "userId", as: "User" });

  // Advisor relationships
  Advisor.hasMany(Event, { foreignKey: "advisorId", as: "Events" });
  Event.belongsTo(Advisor, { foreignKey: "advisorId", as: "Advisor" });

  Advisor.hasMany(Rank, { foreignKey: "advisorId", as: "Ranks" });
  Rank.belongsTo(Advisor, { foreignKey: "advisorId", as: "Advisor" });

  Advisor.hasMany(Review, { foreignKey: "advisorId", as: "Reviews" });
  Review.belongsTo(Advisor, { foreignKey: "advisorId", as: "Advisor" });

  // Event relationships
  Event.hasMany(Place, { foreignKey: "eventId", as: "Places" });
  Place.belongsTo(Event, { foreignKey: "eventId", as: "Event" });

  Event.hasMany(Review, { foreignKey: "eventId", as: "Reviews" });
  Review.belongsTo(Event, { foreignKey: "eventId", as: "Event" });

  Event.hasMany(Media, { foreignKey: "eventId", as: "Media" });
  Media.belongsTo(Event, { foreignKey: "eventId", as: "Event" });

  // Place relationships
  Place.hasMany(Review, { foreignKey: "placeId", as: "Reviews" });
  Review.belongsTo(Place, { foreignKey: "placeId", as: "Place" });

  Place.hasMany(Media, { foreignKey: "placeId", as: "Media" });
  Media.belongsTo(Place, { foreignKey: "placeId", as: "Place" });

  Place.belongsToMany(User, { through: PlaceUser, foreignKey: "placeId", as: "Users" });
  User.belongsToMany(Place, { through: PlaceUser, foreignKey: "userId", as: "Places" });

  Place.belongsToMany(Categorie, { through: PlaceCategorie, foreignKey: "placeId", as: "Categories" });
  Categorie.belongsToMany(Place, { through: PlaceCategorie, foreignKey: "categorieId", as: "Places" });

  Place.belongsToMany(Citiria, { through: PlaceCitiria, foreignKey: "placeId", as: "Citirias" });
  Citiria.belongsToMany(Place, { through: PlaceCitiria, foreignKey: "citiriaId", as: "Places" });

  // PlaceUser relationships
  PlaceUser.hasMany(Citiria, { foreignKey: "placeUserId", as: "Citirias" });
  Citiria.belongsTo(PlaceUser, { foreignKey: "placeUserId", as: "PlaceUser" });

  // Blog relationships
  User.hasMany(Blog, { foreignKey: "userId", as: "Blogs" });
  Blog.belongsTo(User, { foreignKey: "userId", as: "User" });

  // Favorite relationships
  User.hasMany(Favorite, { foreignKey: "userId", as: "Favorites" });
  Favorite.belongsTo(User, { foreignKey: "userId", as: "User" });
};

// Call the function to define associations
defineAssociations();

// Authenticate the connection
connection
  .authenticate()
  .then(() => {
    console.log("Database is connected 👌✅");
  })
  .catch((err) => {
    console.error("Unable to connect to the database ❌", err);
    throw err;
  });

// Sync the database (uncomment to create tables if needed)
// connection
//   .sync({ force: true }) // Use { force: true } to drop and recreate tables; remove in production
//   .then(() => console.log("Tables are created"))
//   .catch((err) => {
//     console.error("Error syncing tables:", err);
//     throw err;
//   });

// Export models and connection
module.exports = {
  connection,
  ...models
};