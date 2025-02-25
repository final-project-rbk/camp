module.exports = (sequelize, DataTypes) => {
    const Media = sequelize.define('media', {
      url: { type: DataTypes.STRING, allowNull: false },
      type: { type: DataTypes.STRING, allowNull: false },


    });

    return Media;
};
