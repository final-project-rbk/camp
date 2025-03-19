const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class MarketplaceCategorie extends Model {
    static associate(models) {
      // Define associations
      MarketplaceCategorie.belongsToMany(models.MarketplaceItem, {
        through: 'marketplace_item_categories',
        foreignKey: 'marketplaceCategorieId',
        otherKey: 'marketplaceItemId',
        as: 'items'
      });
    }
  }

  MarketplaceCategorie.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    icon: {
      type: DataTypes.STRING,
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  }, {
    sequelize,
    modelName: 'MarketplaceCategorie',
    tableName: 'marketplace_categorie',
    timestamps: true
  });

  return MarketplaceCategorie;
}; 