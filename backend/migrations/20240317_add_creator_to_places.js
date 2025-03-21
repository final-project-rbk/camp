'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('places', 'creatorId', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      },
      after: 'exclusive_details'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('places', 'creatorId');
  }
}; 