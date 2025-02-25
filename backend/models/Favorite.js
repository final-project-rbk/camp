module.exports = (sequelize, DataTypes) => {
    const Favorite = sequelize.define('favorite', {
      userId: { type: DataTypes.INTEGER, allowNull: false },
      placeId: { type: DataTypes.INTEGER, allowNull: false },


    });

    return Favorite;
};
