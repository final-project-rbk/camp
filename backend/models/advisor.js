module.exports = (sequelize, DataTypes) => {
  const Advisor = sequelize.define('advisor', {
    isVerified: { type: DataTypes.BOOLEAN, defaultValue: false },
    tokenVerification: { type: DataTypes.STRING, allowNull: true },
    currentRank: { type: DataTypes.ENUM('bronze', 'silver', 'gold', 'platinum'), defaultValue: 'bronze' },
    cin: { type: DataTypes.STRING, allowNull: true },
    points: { type: DataTypes.INTEGER, defaultValue: 0 },
    userId: { type: DataTypes.INTEGER, allowNull: false } // Explicitly define the foreign key
  });

  // Define association within the model
  Advisor.associate = (models) => {
    Advisor.belongsTo(models.User, { foreignKey: 'userId', as: 'User' });
    Advisor.hasMany(models.Event, { foreignKey: 'advisorId', as: 'Events' });
    Advisor.hasMany(models.Review, { foreignKey: 'advisorId', as: 'Reviews' });
  };

  return Advisor;
};