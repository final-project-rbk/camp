const { Place, Media, Review, Categorie } = require('../models');

const placeController = {
  // Get all places with related data
  getAllPlaces: async (req, res) => {
    try {
      const { limit, category } = req.query;
      console.log('Attempting to fetch places...');
      
      // First, verify our models are properly imported
      console.log('Models available:', {
        Place: !!Place,
        Media: !!Media,
        Review: !!Review,
        Categorie: !!Categorie
      });

      const queryOptions = {
        include: [
          {
            model: Media,
            attributes: ['url', 'type'],
            required: false
          },
          {
            model: Review,
            attributes: ['rating'],
            required: false
          },
          {
            model: Categorie,
            through: { attributes: [] },
            attributes: ['name', 'icon'],
            required: category ? true : false,
            where: category ? { name: category } : undefined
          }
        ],
        where: {
          status: 'approved'
        },
        raw: false,
        nest: true
      };

      const places = await Place.findAll(queryOptions);

      console.log('Places fetched:', places.length);

      // Format and sort places by rating
      const formattedPlaces = places
        .map(place => ({
          id: place.id,
          name: place.name,
          location: place.location,
          image: place.images?.[0] || place.Media?.[0]?.url,
          rating: Number(
            (place.Reviews?.reduce((acc, rev) => acc + rev.rating, 0) / 
             (place.Reviews?.length || 1)).toFixed(1)
          ),
          categories: place.Categories?.map(cat => ({
            name: cat.name,
            icon: cat.icon
          })) || [],
          status: place.status
        }))
        .filter(place => place.status === 'approved')
        .sort((a, b) => b.rating - a.rating);

      // Return top 5 if limit is specified
      const limitedPlaces = limit ? formattedPlaces.slice(0, parseInt(limit)) : formattedPlaces;

      console.log('Sending response with places:', limitedPlaces.length);

      res.status(200).json({
        success: true,
        data: limitedPlaces
      });
    } catch (error) {
      console.error('Detailed error in getAllPlaces:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
      
      res.status(500).json({
        success: false,
        error: 'Error fetching places',
        details: error.message
      });
    }
  }
};

module.exports = placeController;
