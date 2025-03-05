module.exports = (sequelize, DataTypes) => {
    const Media = sequelize.define('media', {
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
        allowNull: true,
        references: {
          model: 'places',
          key: 'id'
        }
      },
      eventId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: 'events',
          key: 'id'
        }
      }
    });

    Media.associate = function(models) {
      Media.belongsTo(models.Place, { 
        foreignKey: 'placeId',
        onDelete: 'CASCADE'
      });
      Media.belongsTo(models.Event, {
        foreignKey: 'eventId',
        onDelete: 'CASCADE'
      });
    };

    return Media;
};
