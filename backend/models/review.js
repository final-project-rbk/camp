module.exports = (sequelize, DataTypes) => {
  const Review = sequelize.define('Review', {  // Capitalized for consistency
    rating: { 
      type: DataTypes.INTEGER, 
      allowNull: false, 
      validate: { min: 1, max: 5 } 
    },
   
    
    created_at: { 
      type: DataTypes.DATE, 
      defaultValue: DataTypes.NOW 
    },
    advisorId: { 
      type: DataTypes.INTEGER, 
      allowNull: true 
    },
    eventId: { 
      type: DataTypes.INTEGER, 
      allowNull: true 
    },
    placeId: { 
      type: DataTypes.INTEGER, 
      allowNull: true 
    }
  }, {
    hooks: {
      afterCreate: async (review, options) => {
        // Calculate points based on rating
        const pointsChange = calculatePoints(review.rating);
        
        // Find the associated advisor
        let advisor;
        if (review.advisorId) {
          advisor = await sequelize.models.Advisor.findByPk(review.advisorId);
        } else if (review.eventId) {
          const event = await sequelize.models.Event.findByPk(review.eventId);
          advisor = await sequelize.models.Advisor.findByPk(event.advisorId);
        } else if (review.placeId) {
          const place = await sequelize.models.Place.findByPk(review.placeId);
          const event = await sequelize.models.Event.findOne({ where: { id: place.eventId } });
          advisor = event ? await sequelize.models.Advisor.findByPk(event.advisorId) : null;
        }

        if (advisor) {
          const newPoints = advisor.points + pointsChange;
          await advisor.update({ points: newPoints });
          await updateAdvisorRank(advisor, newPoints); // Update rank based on new points
        }
      }
    }
  });

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
    default: return 0; // Shouldn’t happen due to validation
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