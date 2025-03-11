const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class MarketplaceItemCategorie extends Model {
    static associate(models) {
      MarketplaceItemCategorie.belongsTo(models.MarketplaceItem, {
        foreignKey: 'marketplaceItemId',
      });
      MarketplaceItemCategorie.belongsTo(models.MarketplaceCategorie, {
        foreignKey: 'marketplaceCategorieId',
      });
    }
  }

  MarketplaceItemCategorie.init({
    marketplaceItemId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    marketplaceCategorieId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  }, {
    sequelize,
    modelName: 'MarketplaceItemCategorie',
    tableName: 'marketplace_item_categories',
    uniqueKeys: {
      items_categories_unique: {
        fields: ['marketplaceItemId', 'marketplaceCategorieId'],
      },
    },
  });

  return MarketplaceItemCategorie;
};