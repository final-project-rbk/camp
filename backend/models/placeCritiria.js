module.exports = (sequelize, DataTypes) => {
    const PlaceCitiria = sequelize.define("PlaceCitiria", {
      placeId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "Places",
          key: "id",
        },
      },
      citiriaId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "Citirias",
          key: "id",
        },
      },
    }, {
      timestamps: false, // Adjust based on your needs
    });
  
    return PlaceCitiria;
  };