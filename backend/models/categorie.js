module.exports = (sequelize, DataTypes) => {
  const Categorie = sequelize.define('categorie', {
    name: { type: DataTypes.STRING, allowNull: false },
    icon: { type: DataTypes.STRING, allowNull: false },
  }, {
    tableName: 'categories' // Explicitly match the existing table
  });
  return Categorie;
};