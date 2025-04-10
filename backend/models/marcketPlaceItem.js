module.exports = (sequelize, DataTypes) => {
  const MarketplaceItem = sequelize.define('MarketplaceItem', {
    title: { type: DataTypes.STRING, allowNull: false },
    imageURL: { type: DataTypes.TEXT, allowNull: true },
    description: { type: DataTypes.TEXT, allowNull: true },
    price: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
    status: { type: DataTypes.ENUM('available', 'sold', 'pending'), defaultValue: 'available' },
    sellerId: { type: DataTypes.INTEGER, allowNull: false },
    buyerId: { type: DataTypes.INTEGER, allowNull: true },
    location: { type: DataTypes.STRING, allowNull: true },
  });

  MarketplaceItem.associate = (models) => {
    MarketplaceItem.belongsTo(models.User, { foreignKey: 'sellerId', as: 'seller' });
    MarketplaceItem.belongsTo(models.User, { foreignKey: 'buyerId', as: 'buyer' });
    MarketplaceItem.belongsToMany(models.MarketplaceCategorie, {
      through: models.MarketplaceItemCategorie,
      foreignKey: 'marketplaceItemId',
      otherKey: 'marketplaceCategorieId',
      as: 'categories',
    });
    MarketplaceItem.hasMany(models.Chat, { foreignKey: 'itemId', onDelete: 'CASCADE' });
  };

  return MarketplaceItem;
};