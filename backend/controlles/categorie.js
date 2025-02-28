const { Categorie, Place } = require('../models');

const categorieController = {
  getAllCategories: async (req, res) => {
    try {
      const categories = await Categorie.findAll({
        attributes: ['id', 'name', 'icon']
      });
      
      res.status(200).json({
        success: true,
        data: categories
      });
    } catch (error) {
      console.error('Error fetching categories:', error);
      res.status(500).json({
        success: false,
        error: 'Error fetching categories'
      });
    }
  },

  getPlacesByCategory: async (req, res) => {
    try {
      const { categoryName } = req.params;
      
      const places = await Place.findAll({
        include: [{
          model: Categorie,
          where: { name: categoryName },
          through: { attributes: [] }
        }],
        where: { status: 'approved' }
      });

      res.status(200).json({
        success: true,
        data: places
      });
    } catch (error) {
      console.error('Error fetching places by category:', error);
      res.status(500).json({
        success: false,
        error: 'Error fetching places by category'
      });
    }
  }
};

module.exports = categorieController;
