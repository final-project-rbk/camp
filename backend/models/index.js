const { Sequelize, DataTypes } = require("sequelize");
require('dotenv').config();

// Initialize Sequelize connection
const connection = new Sequelize(process.env.Database, process.env.User, process.env.Password, {
  host: process.env.HOST,
  dialect: "mysql",
  logging: false
});

// Import all models
const User = require("./User")(connection, DataTypes);
const Place = require("./Place")(connection, DataTypes);
const Event = require("./Event")(connection, DataTypes);
const Rank = require("./rank")(connection, DataTypes);
const Favorite = require("./Favorite")(connection, DataTypes);
const Media = require("./media")(connection, DataTypes);
const Categorie = require("./categorie")(connection, DataTypes);
const Chat = require("./Chat")(connection, DataTypes);
const Advisor = require("./advisor")(connection, DataTypes);
const Citiria=require("./critiria")(connection,DataTypes)
const Review=require("./review")(connection,DataTypes)
const PlaceUser=require("./PlaceUser")(connection,DataTypes)
const PlaceCategorie = require("./PlaceCategorie")(connection,DataTypes)
const Blog = require("./blog")(connection,DataTypes)
const Comment = require("./Comment")(connection, DataTypes);

const MarketplaceItem = require("./marcketPlaceItem")(connection, DataTypes);
const MarketplaceCategorie = require("./marcketPlaceCategorie")(connection, DataTypes);
const MarketplaceItemCategorie = require("./marcketPlaceItemCategorie")(connection, DataTypes);

const FormularAdvisor = require("./FormularAdvisor")(connection, DataTypes);
const AdvisorMedia = require("./AdvisorMedia")(connection, DataTypes);

// Define relationships with aliases
const defineAssociations = () => {
  // User relationships
  User.hasMany(Media, { foreignKey: "userId", as: "Media" });
  Media.belongsTo(User, { foreignKey: "userId", as: "User" });

  User.hasMany(Review, { foreignKey: "userId", as: "Reviews" });
  Review.belongsTo(User, { foreignKey: "userId", as: "User" });

  // Add Place-Review association
  Place.hasMany(Review, { foreignKey: "placeId", as: "Reviews" });
  Review.belongsTo(Place, { foreignKey: "placeId", as: "Place" });

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

  User.belongsToMany(Place, { through: PlaceUser, foreignKey: "userId" });
  Place.belongsToMany(User, { through: PlaceUser, foreignKey: "placeId" });

  // Add Creator association
  Place.belongsTo(User, { foreignKey: "creatorId", as: "Creator" });
  User.hasMany(Place, { foreignKey: "creatorId", as: "CreatedPlaces" });

  Citiria.hasMany(PlaceUser, { foreignKey: "critiriaId" });
  PlaceUser.belongsTo(Citiria, { foreignKey: "critiriaId" });

  Event.hasMany(Media, { foreignKey: "eventId" });
  Media.belongsTo(Event, { foreignKey: "eventId" });

  Place.hasMany(Media, { foreignKey: "placeId" });
  Media.belongsTo(Place, { foreignKey: "placeId" });

  Categorie.belongsToMany(Place, { through: PlaceCategorie, foreignKey: "categorieId", as: "Places" });
  Place.belongsToMany(Categorie, { through: PlaceCategorie, foreignKey: "placeId", as: "Categories" });

  User.hasMany(Favorite, { foreignKey: "userId" });
  Favorite.belongsTo(User, { foreignKey: "userId" });

  User.hasMany(Blog, { foreignKey: "userId" });
  Blog.belongsTo(User, { foreignKey: "userId" });

Blog.hasMany(Comment, { foreignKey: "blogId" });
Comment.belongsTo(Blog, { foreignKey: "blogId" });

User.hasMany(Comment, { foreignKey: "userId" });
Comment.belongsTo(User, { foreignKey: "userId" });

User.hasMany(MarketplaceItem, { foreignKey: 'sellerId', as: 'itemsSold' });
MarketplaceItem.belongsTo(User, { foreignKey: 'sellerId', as: 'seller' });

  User.hasMany(MarketplaceItem, { foreignKey: "buyerId", as: "itemsBought" });
  MarketplaceItem.belongsTo(User, { foreignKey: "buyerId", as: "buyer" });

  // MarketPlace Item and Categories relationship
  MarketplaceItem.belongsToMany(MarketplaceCategorie, {
    through: MarketplaceItemCategorie,
    foreignKey: "marketplaceItemId",
    otherKey: "marketplaceCategorieId",
    as: "categories",
    constraints: true
  });

  MarketplaceCategorie.belongsToMany(MarketplaceItem, {
    through: MarketplaceItemCategorie,
    foreignKey: "marketplaceCategorieId",
    otherKey: "marketplaceItemId",
    as: "items",
    constraints: true
  });

  // Explicit foreign key relationships for MarketplaceItemCategorie
  MarketplaceItemCategorie.belongsTo(MarketplaceItem, {
    foreignKey: "marketplaceItemId",
    targetKey: "id",
    onDelete: "CASCADE",
    constraint: true,
    foreignKeyConstraint: true
  });

  MarketplaceItemCategorie.belongsTo(MarketplaceCategorie, {
    foreignKey: "marketplaceCategorieId",
    targetKey: "id",
    onDelete: "CASCADE",
    constraint: true,
    foreignKeyConstraint: true
  });

  // Chat relationships for marketplace
  MarketplaceItem.hasMany(Chat, { foreignKey: "itemId", onDelete: "CASCADE" });
  Chat.belongsTo(MarketplaceItem, { foreignKey: "itemId" });
// FormularAdvisor associations
User.hasOne(FormularAdvisor, { foreignKey: "userId" });
FormularAdvisor.belongsTo(User, { foreignKey: "userId" });

// AdvisorMedia associations
FormularAdvisor.hasOne(AdvisorMedia, { foreignKey: "formularId" });
AdvisorMedia.belongsTo(FormularAdvisor, { foreignKey: "formularId" });

// Link FormularAdvisor to Advisor
Advisor.hasOne(FormularAdvisor, { foreignKey: "advisorId" });
FormularAdvisor.belongsTo(Advisor, { foreignKey: "advisorId" });

Place.hasMany(Favorite, { foreignKey: "placeId" });
Favorite.belongsTo(Place, { foreignKey: "placeId" });

  User.hasMany(Chat, { foreignKey: "senderId", as: "sentChats" });
  Chat.belongsTo(User, { foreignKey: "senderId", as: "sender" });

  User.hasMany(Chat, { foreignKey: "recipientId", as: "receivedChats" });
  Chat.belongsTo(User, { foreignKey: "recipientId", as: "recipient" });

  MarketplaceItem.hasMany(Media, { foreignKey: 'marketplaceItemId', as: 'media',onDelete: 'CASCADE' });
  Media.belongsTo(MarketplaceItem, { foreignKey: 'marketplaceItemId',as: 'marketplaceItem',onDelete: 'CASCADE'});
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

// Sync the database
// connection
//   .sync({ force: true }) // Use alter: true to update tables without dropping them
//   .then(() => console.log("Tables are created or updated"))
//   .catch((err) => {
//     console.error("Error syncing tables:", err);
//     throw err;
//   });

// Export models and connection
module.exports = {
  connection,
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
  Comment,
  MarketplaceItem,
  MarketplaceCategorie,
  MarketplaceItemCategorie,
  FormularAdvisor,
  AdvisorMedia
};