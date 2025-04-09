module.exports = (sequelize, DataTypes) => {
    const Blog = sequelize.define('blog', {
        title: { 
            type: DataTypes.STRING, 
            allowNull: false 
        },
        content: { 
            type: DataTypes.TEXT, 
            allowNull: false 
        },
        image: { 
            type: DataTypes.STRING, 
            allowNull: false 
        },
        userId: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        disabled: {
            type: DataTypes.BOOLEAN,
            defaultValue: false
        }
    });

    return Blog;
};
