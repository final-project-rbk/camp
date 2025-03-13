module.exports = (sequelize, DataTypes) => {
    const PlaceCritiria = sequelize.define('placeCritiria', {
      placeId: { type: DataTypes.INTEGER, allowNull: false },
      critiriaId: { type: DataTypes.INTEGER, allowNull: false },
      value: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 }
    });

    return PlaceCritiria;
}; 