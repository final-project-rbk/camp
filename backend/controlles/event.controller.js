const { Event, Advisor, User } = require('../models');

exports.getEvents = async (req, res) => {
  try {
    const events = await Event.findAll({
      order: [['date', 'ASC']],
      attributes: ['id', 'title', 'description', 'date', 'location', 'images', 'status'],
      where: {
        status: 'approved'
      }
    });
    res.json({ success: true, data: events });
  } catch (error) {
    console.error('Error fetching events:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch events' });
  }
};

exports.getEventById = async (req, res) => {
  try {
    const event = await Event.findByPk(req.params.id, {
      include: [
        {
          model: Advisor,
          attributes: ['id'],
          include: [
            {
              model: User,
              attributes: ['id', 'first_name', 'last_name', 'profile_image']
            }
          ]
        }
      ]
    });
    
    if (!event) {
      return res.status(404).json({ success: false, error: 'Event not found' });
    }
    res.json({ success: true, data: event });
  } catch (error) {
    console.error('Error fetching event:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch event' });
  }
}; 