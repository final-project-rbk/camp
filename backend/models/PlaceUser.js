module.exports = (sequelize, DataTypes) => {
    const PlaceUser = sequelize.define('placeUser', {
      placeId: { type: DataTypes.INTEGER, allowNull: false },
      userId: { type: DataTypes.INTEGER, allowNull: false },
     
      rating: { 
        type: DataTypes.INTEGER, 
        allowNull: false, 
        validate: { min: 1, max: 5 } 
      },
    });

    return PlaceUser;
};
