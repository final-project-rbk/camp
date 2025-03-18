module.exports = (sequelize, DataTypes) => {
  const Message = sequelize.define('Message', {
    content: {
      type: DataTypes.TEXT,
      allowNull: false
    }
  }, {
    timestamps: true
  });

  Message.associate = (models) => {
    Message.belongsTo(models.User, { foreignKey: 'userId' });
    Message.belongsTo(models.Room, { foreignKey: 'roomId' });
    Message.hasMany(models.Media, { foreignKey: 'messageId' });
  };

  return Message;
};
