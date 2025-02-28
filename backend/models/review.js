module.exports = (sequelize, DataTypes) => {
  const Review = sequelize.define('Review', {
    rating: { 
      type: DataTypes.INTEGER, 
      allowNull: false, 
      validate: { min: 1, max: 5 } 
    },
    comment: { type: DataTypes.TEXT, allowNull: true },
    created_at: { 
      type: DataTypes.DATE, 
      defaultValue: DataTypes.NOW 
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    placeId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'places',
        key: 'id'
      }
    }
  });

  Review.associate = function(models) {
    Review.belongsTo(models.User, { foreignKey: 'userId' });
    Review.belongsTo(models.Place, { foreignKey: 'placeId' });
  };

  return Review;
};

// Helper function to calculate points from rating
const calculatePoints = (rating) => {
  switch (rating) {
    case 1: return -2;
    case 2: return -1;
    case 3: return 1;
    case 4: return 2;
    case 5: return 3;
    default: return 0; // Shouldn't happen due to validation
  }
};

// Helper function to update advisor rank
const updateAdvisorRank = async (advisor, newPoints) => {
  let newRank;
  if (newPoints >= 1000) newRank = "platinum";
  else if (newPoints >= 500) newRank = "gold";
  else if (newPoints >= 200) newRank = "silver";
  else newRank = "bronze";

  await advisor.update({ currentRank: newRank });
  await advisor.User.update({ points: newPoints, rank: newRank });
};