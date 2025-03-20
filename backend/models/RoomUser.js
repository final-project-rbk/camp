module.exports = (sequelize, DataTypes) => {
  const RoomUser = sequelize.define('RoomUser', {
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      references: {
        model: 'Users',
        key: 'id'
      }
    },
    roomId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      references: {
        model: 'Rooms',
        key: 'id'
      }
    }
  }, {
    tableName: 'roomusers',
    timestamps: true
  })

  return RoomUser;
};
