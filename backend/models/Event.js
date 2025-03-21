module.exports = (sequelize, DataTypes) => {
    const Event = sequelize.define('Event', {
      title: { type: DataTypes.STRING, allowNull: false },
      description: { type: DataTypes.TEXT, allowNull: false },
      date: { type: DataTypes.DATE, allowNull: false },
      location: { type: DataTypes.STRING, allowNull: false },
      images: { type: DataTypes.JSON, allowNull: true, defaultValue: [] },
      status: { type: DataTypes.ENUM('pending', 'approved', 'rejected'), defaultValue: 'pending' },
      exclusive_details: { type: DataTypes.TEXT, allowNull: true },
    }, {
      tableName: 'events',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at'
    });
  
    Event.associate = function(models) {
      Event.belongsTo(models.Advisor, { foreignKey: 'advisorId', as: 'Advisor' });
      Event.hasMany(models.Media, { foreignKey: 'eventId', as: 'Media' });
      Event.hasMany(models.Review, { foreignKey: 'eventId', as: 'Reviews' });
    };
  
    return Event;
  };