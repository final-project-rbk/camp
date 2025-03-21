module.exports = (sequelize, DataTypes) => {
    const EventRating = sequelize.define('event_rating', {
     name: { type: DataTypes.STRING, allowNull: false },
     targetPoints: { type: DataTypes.INTEGER, allowNull: false },
     totalPoints: { type: DataTypes.INTEGER, allowNull: false },
    });
  
    return EventRating;
  };