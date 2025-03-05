module.exports = (sequelize, DataTypes) => {
    const Event = sequelize.define('event', {
      title: { type: DataTypes.STRING, allowNull: false },
      description: { type: DataTypes.TEXT, allowNull: false },
      date: { type: DataTypes.DATE, allowNull: false },
      location: { type: DataTypes.STRING, allowNull: false },
      images: { type: DataTypes.JSON, allowNull: true },
      status: { type: DataTypes.ENUM('pending', 'approved', 'rejected'), defaultValue: 'pending' },
      exclusive_details: { type: DataTypes.TEXT, allowNull: true },
      created_at: { type: DataTypes.DATE, defaultValue: sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: DataTypes.DATE, defaultValue: sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP') }
    });
  
    Event.associate = function(models) {
      Event.belongsTo(models.Advisor, { foreignKey: 'advisorId', as: 'Advisor' });
      Event.hasMany(models.Media, { foreignKey: 'eventId', as: 'Media' });
      Event.hasMany(models.Review, { foreignKey: 'eventId', as: 'Reviews' });
    };
  
    return Event;
  };