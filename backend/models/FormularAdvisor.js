module.exports = (sequelize, DataTypes) => {
    const FormularAdvisor = sequelize.define('formular_advisor', {
        address: { 
            type: DataTypes.STRING, 
            allowNull: false 
        },
        phoneNumber: { 
            type: DataTypes.STRING, 
            allowNull: false 
        },
        cin: { 
            type: DataTypes.STRING, 
            allowNull: false,
            unique: true 
        },
        motivation: { 
            type: DataTypes.TEXT, 
            allowNull: false 
        },
        eventTypes: { 
            type: DataTypes.STRING, 
            allowNull: false 
        },
        experience: { 
            type: DataTypes.TEXT, 
            allowNull: true 
        },
        socialMediaLinks: { 
            type: DataTypes.JSON, 
            allowNull: true,
            defaultValue: {} 
        },
        termsAccepted: { 
            type: DataTypes.BOOLEAN, 
            allowNull: false,
            defaultValue: false 
        },
        genuineInfoAgreed: { 
            type: DataTypes.BOOLEAN, 
            allowNull: false,
            defaultValue: false 
        },
        status: { 
            type: DataTypes.ENUM('pending', 'approved', 'rejected'), 
            defaultValue: 'pending' 
        },
        userId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            unique: true
        }
    });

    return FormularAdvisor;
}; 