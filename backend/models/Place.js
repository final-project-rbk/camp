module.exports = (sequelize, DataTypes) => {
  const Place = sequelize.define('Place', {
    name: { type: DataTypes.STRING, allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: false },
    location: { type: DataTypes.STRING, allowNull: false },
    images: { 
      type: DataTypes.JSON, 
      allowNull: true,
      defaultValue: [],
      get() {
        const rawValue = this.getDataValue('images');
        if (!rawValue) return [];
        if (Array.isArray(rawValue)) return rawValue;
        try {
          return JSON.parse(rawValue);
        } catch {
          return Array.isArray(rawValue) ? rawValue : [rawValue];
        }
      },
      set(value) {
        this.setDataValue('images', Array.isArray(value) ? value : []);
      }
    },
    status: { type: DataTypes.ENUM('pending', 'approved', 'rejected'), defaultValue: 'pending' },
    exclusive_details: { type: DataTypes.TEXT, allowNull: true },
    creatorId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      }
    }
  }, {
    tableName: 'places',
    timestamps: true,
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  });

  Place.associate = function(models) {
    Place.hasMany(models.Media, { foreignKey: 'placeId', as: 'Media' });
    Place.hasMany(models.Review, { foreignKey: 'placeId', as: 'Reviews' });
    Place.belongsToMany(models.Categorie, { 
      through: 'placeCategorie',
      foreignKey: 'placeId',
      as: 'Categories'
    });
    Place.belongsTo(models.User, { foreignKey: 'creatorId', as: 'Creator' });
  };

  return Place;
};