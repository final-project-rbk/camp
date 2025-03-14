'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('hints', 'category', {
      type: Sequelize.ENUM('fire', 'shelter', 'food', 'gear'),
      allowNull: false, // Set to true if the field can be null
      defaultValue: 'fire' // Optional: Set a default value
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('hints', 'category');
  }
}; 