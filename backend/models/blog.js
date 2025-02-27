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
        likes: { 
            type: DataTypes.INTEGER, 
            allowNull: true 
        }
    });

    return Blog;
};
