module.exports = (sequelize, DataTypes) => {
  const Message = sequelize.define('Message', {
    content: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    replyToId: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    mediaUrls: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: []
    },
    reactions: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: {}
    },
    isRead: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    }
  }, {
    timestamps: true
  });

  Message.associate = (models) => {
    Message.belongsTo(models.User, { foreignKey: 'userId' });
    Message.belongsTo(models.Room, { foreignKey: 'roomId' });
    Message.belongsTo(models.Message, { as: 'ReplyTo', foreignKey: 'replyToId' });
    Message.hasMany(models.Media, { foreignKey: 'messageId' });
  };

  return Message;
};

/*
// Migration script to be run manually

module.exports.updateMessageTable = async (sequelize) => {
  try {
    console.log('Starting Message table migration...');
    
    // Check if columns already exist
    const tableInfo = await sequelize.getQueryInterface().describeTable('Messages');
    
    // Add replyToId if it doesn't exist
    if (!tableInfo.replyToId) {
      console.log('Adding replyToId column to Messages table...');
      await sequelize.getQueryInterface().addColumn('Messages', 'replyToId', {
        type: DataTypes.INTEGER,
        allowNull: true
      });
    }
    
    // Add mediaUrls if it doesn't exist
    if (!tableInfo.mediaUrls) {
      console.log('Adding mediaUrls column to Messages table...');
      await sequelize.getQueryInterface().addColumn('Messages', 'mediaUrls', {
        type: DataTypes.JSON,
        allowNull: true,
        defaultValue: []
      });
    }
    
    // Add reactions if it doesn't exist
    if (!tableInfo.reactions) {
      console.log('Adding reactions column to Messages table...');
      await sequelize.getQueryInterface().addColumn('Messages', 'reactions', {
        type: DataTypes.JSON,
        allowNull: true,
        defaultValue: {}
      });
    }
    
    // Add isRead if it doesn't exist
    if (!tableInfo.isRead) {
      console.log('Adding isRead column to Messages table...');
      await sequelize.getQueryInterface().addColumn('Messages', 'isRead', {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
      });
    }
    
    console.log('Message table migration completed successfully!');
  } catch (error) {
    console.error('Error migrating Message table:', error);
  }
};
*/
