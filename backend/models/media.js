
module.exports = (sequelize, DataTypes) => {
  const Media = sequelize.define('Media', {
      url: { 
          type: DataTypes.STRING, 
          allowNull: false,
          validate: {
              isUrl: true
          }
      },
      type: { 
          type: DataTypes.STRING, 
          allowNull: false,
          defaultValue: 'image'
      },
      placeId: {
          type: DataTypes.INTEGER,
          allowNull: true,  // Ensure it can be null
          references: {
              model: 'places',
              key: 'id'
          },
          onDelete: 'SET NULL', // Ensures deletion doesn't break constraint
          onUpdate: 'CASCADE'
      },
      marketplaceItemId: {
          type: DataTypes.INTEGER,
          allowNull: true,
          references: {
              model: 'MarketplaceItems',
              key: 'id'
          },
          onDelete: 'CASCADE',
          onUpdate: 'CASCADE'
      }
  });

  Media.associate = function(models) {
      Media.belongsTo(models.Place, { 
          foreignKey: 'placeId',
          onDelete: 'SET NULL'
      });

      Media.belongsTo(models.MarketplaceItem, { 
          foreignKey: 'marketplaceItemId',
          as: 'marketplaceItem',
          onDelete: 'CASCADE'
      });
  };

  return Media;
};
