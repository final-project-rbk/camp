  module.exports = (sequelize, DataTypes) => {
      const Place = sequelize.define('place', {
        name: { type: DataTypes.STRING, allowNull: false },
        description: { type: DataTypes.TEXT, allowNull: false },
        location: { type: DataTypes.STRING, allowNull: false },
        images: { type: DataTypes.JSON, allowNull: true },
        status: { type: DataTypes.ENUM('pending', 'approved', 'rejected'), defaultValue: 'pending' },
        exclusive_details: { type: DataTypes.TEXT, allowNull: true },
        created_at: { type: DataTypes.DATE, defaultValue: sequelize.literal('CURRENT_TIMESTAMP') },
        updated_at: { type: DataTypes.DATE, defaultValue: sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP') }
      });
    
      // Place.associate = function(models) {
      //   Place.hasMany(models.Media, { foreignKey: 'placeId' });
      //   Place.hasMany(models.Review, { foreignKey: 'placeId' });
      //   Place.belongsToMany(models.Categorie, { 
      //     through: 'placeCategorie',
      //     foreignKey: 'placeId'
      //   });
      // };
    
      return Place;
    };