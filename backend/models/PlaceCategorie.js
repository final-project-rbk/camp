module.exports = (sequelize, DataTypes) => {
    const PlaceCategorie = sequelize.define('placeCategorie', {
      placeId: { type: DataTypes.INTEGER, allowNull: false },
      categorieId: { type: DataTypes.INTEGER, allowNull: false },


    });

    return PlaceCategorie;
};

