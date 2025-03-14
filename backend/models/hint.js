module.exports = (sequelize, DataTypes) => {
    const Hint = sequelize.define('hint', {
        title: {
            type: DataTypes.STRING,
            allowNull: false
        },
        description: {
            type: DataTypes.TEXT,
            allowNull: false
        },
        difficulty: {
            type: DataTypes.ENUM('beginner', 'intermediate', 'advanced'),
            defaultValue: 'beginner'
        },
        timeToComplete: {
            type: DataTypes.STRING,
            allowNull: false
        },
        image: {
            type: DataTypes.STRING,
            allowNull: false
        },
        gallerySteps: {
            type: DataTypes.JSON,
            allowNull: true
        },
        views: {
            type: DataTypes.INTEGER,
            defaultValue: 0
        },
        category: {
            type: DataTypes.ENUM('fire', 'shelter', 'food', 'gear'),
            allowNull: false,
            defaultValue: 'fire'
        }
    });

    return Hint;
}; 