module.exports = (sequelize, DataTypes) => {
    const Comment = sequelize.define('comment', {
        content: {
            type: DataTypes.TEXT,
            allowNull: false
        },
        created_at: {
            type: DataTypes.DATE,
            defaultValue: sequelize.literal('CURRENT_TIMESTAMP')
        }
    });
    return Comment;
};