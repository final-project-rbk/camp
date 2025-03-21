module.exports = (sequelize, DataTypes) => {
    const PlaceUser = sequelize.define('placeUser', {
      placeId: { type: DataTypes.INTEGER, allowNull: false },
      userId: { type: DataTypes.INTEGER, allowNull: false },
      critiriaId: { type: DataTypes.INTEGER, allowNull: true },
      rating: { 
        type: DataTypes.INTEGER, 
        allowNull: true, 
        validate: { min: 1, max: 5 } 
      },
      value: { 
        type: DataTypes.INTEGER, 
        allowNull: true,
        validate: { min: 0, max: 100 }
      },
    });

    return PlaceUser;
};
