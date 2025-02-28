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
        allowNull: false,
        references: {
          model: 'places',
          key: 'id'
        }
      }
    });

    Media.associate = function(models) {
      Media.belongsTo(models.Place, { 
        foreignKey: 'placeId',
        onDelete: 'CASCADE'
      });
    };

    return Media;
};
