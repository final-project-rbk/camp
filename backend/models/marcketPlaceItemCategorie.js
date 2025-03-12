// models/marketplaceItemCategorie.js
module.exports = (sequelize, DataTypes) => {
    const MarketplaceItemCategorie = sequelize.define('marketplace_item_categorie', {
      marketplaceItemId: { type: DataTypes.INTEGER, allowNull: false },
      categorieId: { type: DataTypes.INTEGER, allowNull: false },
    }, {
      timestamps: true // Adds createdAt and updatedAt
    });
  
    return MarketplaceItemCategorie;
  };