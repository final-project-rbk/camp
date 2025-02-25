module.exports = (sequelize, DataTypes) => {
    const Categorie = sequelize.define('categorie', {
      name: { type: DataTypes.STRING, allowNull: false },
      icon: { type: DataTypes.STRING, allowNull: false },


    });

    return Categorie;
};
