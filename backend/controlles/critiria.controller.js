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
  },

  // Submit a new criteria rating
  submitCritiriaRating: async (req, res) => {
    try {
      const { userId, placeId, ratings } = req.body;
      
      console.log('Rating submission received:', { userId, placeId, ratingsCount: ratings?.length });
      
      // Validate PlaceUser model
      if (!PlaceUser) {
        console.error('PlaceUser model is not defined');
        return res.status(500).json({
          success: false,
          error: 'Server configuration error: PlaceUser model not found'
        });
      }
      
      if (!userId || !placeId || !ratings || !Array.isArray(ratings)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid request. Required fields: userId, placeId, ratings (array)'
        });
      }

      // Process each rating
      const results = await Promise.all(
        ratings.map(async ({ criteriaId, value }) => {
          console.log('Processing rating:', { criteriaId, value });
          
          if (!criteriaId || typeof value !== 'number') {
            return { error: true, message: 'Invalid rating data' };
          }

          try {
            // Find or create a PlaceUser record
            const [placeUser, created] = await PlaceUser.findOrCreate({
              where: {
                userId,
                placeId,
                critiriaId: criteriaId
              },
              defaults: {
                value
              }
            });

            // Update if it already exists
            if (!created) {
              await placeUser.update({ value });
            }

            return { criteriaId, success: true };
          } catch (err) {
            console.error('Error processing individual rating:', err);
            return { 
              criteriaId, 
              success: false, 
              error: err.message,
              errorDetail: err.toString()
            };
          }
        })
      );

      res.status(200).json({
        success: true,
        data: results
      });
    } catch (error) {
      console.error('Error in submitCritiriaRating:', error);
      res.status(500).json({
        success: false,
        error: 'Error submitting ratings',
        details: error.message,
        stack: process.env.NODE_ENV !== 'production' ? error.stack : undefined
      });
    }
  }
};

module.exports = critiriaController;
