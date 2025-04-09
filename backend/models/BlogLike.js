module.exports = (sequelize, DataTypes) => {
    const BlogLike = sequelize.define('blog_like', {
        blogId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'blogs',
                key: 'id'
            },
            onDelete: 'CASCADE'
        },
        userId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'users',
                key: 'id'
            },
            onDelete: 'CASCADE'
        }
    }, {
        indexes: [
            {
                unique: true,
                fields: ['blogId', 'userId']
            }
        ]
    });

    return BlogLike;
}; 