module.exports = (sequelize, DataTypes) => {
    const PlaceUser = sequelize.define('placeUser', {
      placeId: { type: DataTypes.INTEGER, allowNull: false },
      userId: { type: DataTypes.INTEGER, allowNull: false },
     

    });

    return PlaceUser;
};
