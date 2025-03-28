module.exports = (sequelize, DataTypes) => {
  const Message = sequelize.define('message', {
    content: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    senderId: {
      field: 'sender_id',
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    roomId: {
      field: 'room_id',
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'rooms',
        key: 'id'
      }
    },
    isRead: {
      field: 'is_read',
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    readAt: {
      field: 'read_at',
      type: DataTypes.DATE,
      allowNull: true
    },
    replyToId: {
      field: 'reply_to_id',
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'messages',
        key: 'id'
      }
    },
    mediaUrls: {
      field: 'media_urls',
      type: DataTypes.JSON,
      allowNull: true
    },
    reaction: {
      type: DataTypes.STRING,
      allowNull: true
    },
    createdAt: {
      field: 'created_at',
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    updatedAt: {
      field: 'updated_at',
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  });

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
