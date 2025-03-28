module.exports = (sequelize, DataTypes) => {
    const Chat = sequelize.define('chat', {
      message: { type: DataTypes.TEXT, allowNull: false },
      created_at: { type: DataTypes.DATE, defaultValue: sequelize.literal('CURRENT_TIMESTAMP') }
    });
  
    return Chat;
  };