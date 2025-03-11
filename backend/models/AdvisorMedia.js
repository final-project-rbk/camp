module.exports = (sequelize, DataTypes) => {
    const AdvisorMedia = sequelize.define('advisor_media', {
        cinFront: { 
            type: DataTypes.STRING, 
            allowNull: false 
        },
        cinBack: { 
            type: DataTypes.STRING, 
            allowNull: false 
        },
        certificate: { 
            type: DataTypes.STRING, 
            allowNull: true 
        },
        faceImage: {
            type: DataTypes.STRING,
            allowNull: false
        },
        formularId: {
            type: DataTypes.INTEGER,
            allowNull: false
        }
    });

    return AdvisorMedia;
}; 