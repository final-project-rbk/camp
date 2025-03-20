const { Critiria, PlaceUser } = require('../models');

const critiriaController = {
  // Get all criteria
  getAllCritiria: async (req, res) => {
    try {
      const critirias = await Critiria.findAll();
      
      res.status(200).json({
        success: true,
        data: critirias
      });
    } catch (error) {
      console.error('Error in getAllCritiria:', error);
      res.status(500).json({
        success: false,
        error: 'Error fetching criteria',
        details: error.message
      });
    }
  },

  // Get criteria by ID
  getCritiriaById: async (req, res) => {
    try {
      const { id } = req.params;
      const critiria = await Critiria.findByPk(id);
      
      if (!critiria) {
        return res.status(404).json({
          success: false,
          error: 'Criteria not found'
        });
      }
      
      res.status(200).json({
        success: true,
        data: critiria
      });
    } catch (error) {
      console.error('Error in getCritiriaById:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        details: error.message
      });
    }
  },

  // Get criteria for a specific place
  getPlaceCritiria: async (req, res) => {
    try {
      const { placeId } = req.params;
      
      const placeVotes = await PlaceUser.findAll({
        where: { placeId },
        include: [{
          model: Critiria,
          required: true
        }]
      });
      
      // Format the response
      const formattedCriteria = placeVotes.map(vote => ({
        id: vote.Critiria.id,
        name: vote.Critiria.name,
        percentage: vote.Critiria.purcent,
        value: vote.value || 0
      }));
      
      res.status(200).json({
        success: true,
        data: formattedCriteria
      });
    } catch (error) {
      console.error('Error in getPlaceCritiria:', error);
      res.status(500).json({
        success: false,
        error: 'Error fetching place criteria',
        details: error.message
      });
    }
  }
};

module.exports = critiriaController;
