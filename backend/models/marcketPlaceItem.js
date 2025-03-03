
module.exports = (sequelize, DataTypes) => {
    const MarketplaceItem = sequelize.define('marketplace_item', {
      title: { type: DataTypes.STRING, allowNull: false },
      description: { type: DataTypes.TEXT, allowNull: true },
      price: { type: DataTypes.DECIMAL(10, 2), allowNull: false }, // e.g., 29.99
      status: { type: DataTypes.ENUM('available', 'sold', 'pending'), defaultValue: 'available' },
      sellerId: { type: DataTypes.INTEGER, allowNull: false }, // Links to User
      buyerId: { type: DataTypes.INTEGER, allowNull: true }, // Null until sold
      location: { type: DataTypes.STRING, allowNull: true },
    });
  
    return MarketplaceItem;
  };