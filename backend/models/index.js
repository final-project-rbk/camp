const { Sequelize, DataTypes } = require("sequelize");
const critiria = require("./critiria");


// Initialize Sequelize connection
const connection = new Sequelize(process.env.Database, process.env.User, process.env.Password, {
  host: process.env.Host,
  dialect: "mysql",
});

// Import all models
const User = require("./user")(connection, DataTypes);
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
const PlaceCitiria=require("./placeCritiria")(connection,DataTypes)
const MarketplaceItem = require("./marcketPlaceItem")(connection, DataTypes);
const MarketplaceItemCategorie = require("./marcketPlaceItemCategorie")(connection, DataTypes);
// Define relationships
const defineAssociations = () => {
  // User relationships
  User.hasMany(Media, { foreignKey: "userId" });
  Media.belongsTo(User, { foreignKey: "userId" });

  User.hasMany(Review, { foreignKey: "userId" });
  Review.belongsTo(User, { foreignKey: "userId" });

  User.hasOne(Advisor, { foreignKey: "userId" });
  Advisor.belongsTo(User, { foreignKey: "userId" });

  Advisor.hasMany(Event, { foreignKey: "advisorId" });
  Event.belongsTo(Advisor, { foreignKey: "advisorId" });

  Event.hasMany(Place, { foreignKey: "eventId" });
  Place.belongsTo(Event, { foreignKey: "eventId" });

  Advisor.hasMany(Rank, { foreignKey: "advisorId" });
  Rank.belongsTo(Advisor, { foreignKey: "advisorId" });

  Advisor.hasMany(Review, { foreignKey: "advisorId" });
  Review.belongsTo(Advisor, { foreignKey: "advisorId" });

  Event.hasMany(Review, { foreignKey: "eventId" });
  Review.belongsTo(Event, { foreignKey: "eventId" });

  Place.hasMany(Review, { foreignKey: "placeId" });
  Review.belongsTo(Place, { foreignKey: "placeId" });

 User.belongsToMany(Place, { through: PlaceUser, foreignKey: "userId" });
 Place.belongsToMany(User, { through: PlaceUser, foreignKey: "placeId" });

 PlaceUser.hasMany(Citiria, { foreignKey: "placeUserId" });
 Citiria.belongsTo(PlaceUser, { foreignKey: "placeUserId" });

 Event.hasMany(Media, { foreignKey: "eventId" });
 Media.belongsTo(Event, { foreignKey: "eventId" });

Place.hasMany(Media, { foreignKey: "placeId" });
Media.belongsTo(Place, { foreignKey: "placeId" });

Categorie.belongsToMany(Place, { through: PlaceCategorie, foreignKey: "categorieId" });
Place.belongsToMany(Categorie, { through: PlaceCategorie, foreignKey: "placeId" });

User.hasMany(Favorite, { foreignKey: "userId" });
Favorite.belongsTo(User, { foreignKey: "userId" });

User.hasMany(Blog, { foreignKey: "userId" });
Blog.belongsTo(User, { foreignKey: "userId" });

// Place.belongsToMany(Citiria, { through: PlaceUser, foreignKey: "placeId" });
// Citiria.belongsToMany(Place, { through: PlaceUser, foreignKey: "citiriaId" });
  
  
Place.belongsToMany(Citiria, { through: PlaceCitiria, foreignKey: "placeId" });
Citiria.belongsToMany(Place, { through: PlaceCitiria, foreignKey: "citiriaId" });

// In defineAssociations function
User.hasMany(MarketplaceItem, { foreignKey: 'sellerId', as: 'itemsSold' });
MarketplaceItem.belongsTo(User, { foreignKey: 'sellerId', as: 'seller' });

User.hasMany(MarketplaceItem, { foreignKey: 'buyerId', as: 'itemsBought' });
MarketplaceItem.belongsTo(User, { foreignKey: 'buyerId', as: 'buyer' });

// Leverage existing Chat model for negotiations
User.hasMany(Chat, { foreignKey: 'userId' });
Chat.belongsTo(User, { foreignKey: 'userId' });

// Optionally link chats to marketplace items
MarketplaceItem.hasMany(Chat, { foreignKey: 'itemId' });
Chat.belongsTo(MarketplaceItem, { foreignKey: 'itemId' });

MarketplaceItem.belongsToMany(Categorie, { 
  through: 'marketplace_item_categorie', 
  as: 'categories', 
  foreignKey: 'marketplaceItemId' 
});

Categorie.belongsToMany(MarketplaceItem, { 
  through: 'marketplace_item_categorie', 
  as: 'items', 
  foreignKey: 'categorieId' 
});

  
  

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
    console.error("Unable to connect to the database ❌:", err);
    throw err;
  });

// Sync the database (uncomment to create tables)
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
  MarketplaceItem,
  MarketplaceItemCategorie
 
};