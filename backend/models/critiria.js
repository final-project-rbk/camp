module.exports = (sequelize, DataTypes) => {
    const Critiria = sequelize.define('critiria', {
      name: { type: DataTypes.STRING, allowNull: false },
      purcent: { type: DataTypes.INTEGER, allowNull: false },
      

    });

    return Critiria;
};
