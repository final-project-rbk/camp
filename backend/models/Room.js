module.exports = (sequelize, DataTypes) => {
  const Room = sequelize.define('Room', {
    name: {
      type: DataTypes.STRING,
      allowNull: false
    }
  }, {
    timestamps: true
  });

  Room.associate = (models) => {
    Room.belongsToMany(models.User, { through: 'RoomUser', foreignKey: 'roomId' });
    Room.hasMany(models.Message, { foreignKey: 'roomId' });
  };

  return Room;
};
