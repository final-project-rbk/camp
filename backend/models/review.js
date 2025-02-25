module.exports = (sequelize, DataTypes) => {
    const Review = sequelize.define('review', {
      rating: { type: DataTypes.INTEGER, allowNull: false, validate: { min: 1, max: 5 } },
     
  
    });

    return Review;
};
