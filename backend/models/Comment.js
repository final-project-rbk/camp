module.exports = (sequelize, DataTypes) => {
    const Comment = sequelize.define('comment', {
        content: {
            type: DataTypes.TEXT,
            allowNull: false
        },
        created_at: {
            type: DataTypes.DATE,
            defaultValue: sequelize.literal('CURRENT_TIMESTAMP')
        },
        userId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'users',
                key: 'id'
            }
        },
        blogId: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: {
                model: 'blogs',
                key: 'id'
            }
        },
        placeId: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: {
                model: 'places',
                key: 'id'
            }
        },
        eventId: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: {
                model: 'events',
                key: 'id'
            }
        },
        disabled: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
            allowNull: false
        }
    });

    Comment.associate = function(models) {
        Comment.belongsTo(models.User, { foreignKey: 'userId' });
        Comment.belongsTo(models.Blog, { foreignKey: 'blogId' });
        Comment.belongsTo(models.Place, { foreignKey: 'placeId' });
        Comment.belongsTo(models.Event, { foreignKey: 'eventId' });
    };

    return Comment;
};