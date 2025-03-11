module.exports = (sequelize, DataTypes) => {
    const User = sequelize.define('user', {
      email: { type: DataTypes.STRING, unique: true, allowNull: false },
      password: { type: DataTypes.STRING, allowNull: false },
      first_name: { type: DataTypes.STRING, allowNull: false },
      last_name: { type: DataTypes.STRING, allowNull: false },
      role: { type: DataTypes.ENUM('user', 'advisor', 'admin'), defaultValue: 'user' },
     
      points: { type: DataTypes.INTEGER, defaultValue: 0 },
      profile_image: { type: DataTypes.TEXT, allowNull: true },
      bio: { type: DataTypes.TEXT, allowNull: true },
      experience: { type: DataTypes.TEXT, allowNull: true },
      token: { type: DataTypes.STRING, allowNull: true },
     
    
      created_at: { type: DataTypes.DATE, defaultValue: sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: DataTypes.DATE, defaultValue: sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP') },
      isBanned: { 
        type: DataTypes.BOOLEAN, 
        defaultValue: false,
        allowNull: false
      }
    });
  
    return User;
  };