module.exports = (sequelize, DataTypes) => {
    const Advisor = sequelize.define('advisor', {
      isVerified: { type: DataTypes.BOOLEAN, defaultValue: false },
      tokenVerification: { type: DataTypes.STRING, allowNull: true },
      currentRank: { type: DataTypes.ENUM('bronze', 'silver', 'gold', 'platinum'), defaultValue: 'bronze' },
      cin: { type: DataTypes.STRING, allowNull: true },
      points: { type: DataTypes.INTEGER, defaultValue: 0 },

    });

    return Advisor;
};
