module.exports = (sequelize, DataTypes) => {
  const Room = sequelize.define('room', {
    name: { 
      type: DataTypes.STRING, 
      allowNull: false 
    },
    createdAt: {
      field: 'created_at',
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    updatedAt: {
      field: 'updated_at',
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  });

  return Room;
}; 