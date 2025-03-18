module.exports = (sequelize, DataTypes) => {
  const RoomUser = sequelize.define('RoomUser', {}, { timestamps: true });

  RoomUser.associate = (models) => {
    RoomUser.belongsTo(models.User, { foreignKey: 'userId' });
    RoomUser.belongsTo(models.Room, { foreignKey: 'roomId' });
  };

  return RoomUser;
};
