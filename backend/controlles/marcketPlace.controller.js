const { MarketplaceItem, User, Chat, Review,MarketplaceItemCategorie,Categorie, Media } = require('../models');

// Get all available items
module.exports.getAllItems = async (req, res) => {
    try {
      const items = await MarketplaceItem.findAll({
        where: { status: 'available' },
        include: [
          {
            model: User,
            as: 'seller',
            attributes: ['id', 'first_name', 'last_name', 'profile_image']
          },
          {
            model: Categorie,
            as: 'categories', // Add this line to specify the alias
            through: { attributes: [] },
            attributes: ['id', 'name']
          }
        ],
      });
      res.status(200).json(items);
    } catch (error) {
      console.error('Error fetching marketplace items:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },
module.exports.getItemsByCategory = async (req, res) => {
    try {
      const { categoryId } = req.params;
      const items = await MarketplaceItem.findAll({
        where: { 
          status: 'available',
          '$categories.id$': categoryId // This assumes the alias is 'categories'
        },
        include: [
          {
            model: User,
            as: 'seller',
            attributes: ['id', 'first_name', 'last_name', 'profile_image']
          },
          {
            model: Categorie, // Fixed typo from Category to Categorie
            as: 'categories', // Add the alias here
            through: { attributes: [] }
          }
        ]
      });
      res.status(200).json(items);
    } catch (error) {
      console.error('Error fetching items by category:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };

// Create a new item listing
module.exports.createItem = async (req, res) => {
    try {
      const { title, description, price, location, categoryIds } = req.body; // Added location and categoryIds
      const sellerId = req.user.id; // Requires auth middleware
  
      const item = await MarketplaceItem.create({ 
        title, 
        description, 
        price, 
        location, // New field
        sellerId, 
        status: 'available' 
      });
  
      // Associate categories if provided
      if (categoryIds && Array.isArray(categoryIds)) {
        await MarketplaceItemCategorie.bulkCreate(
          categoryIds.map(categorieId => ({
            marketplaceItemId: item.id,
            categorieId
          }))
        );
      }
  
      res.status(201).json(item);
    } catch (error) {
      console.error('Error creating item:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };

// Purchase an item
module.exports.buyItem = async (req, res) => {
  try {
    const item = await MarketplaceItem.findByPk(req.params.id);
    if (!item) return res.status(404).json({ error: 'Item not found' });
    if (item.status !== 'available') return res.status(400).json({ error: 'Item not available' });

    const buyerId = req.user.id; // Requires auth middleware
    if (buyerId === item.sellerId) return res.status(400).json({ error: 'Cannot buy your own item' });

    await item.update({ status: 'sold', buyerId });
    res.status(200).json({ message: 'Item purchased successfully', item });
  } catch (error) {
    console.error('Error buying item:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get seller profile
module.exports.getSellerProfile = async (req, res) => {
  try {
    const seller = await User.findByPk(req.params.sellerId, {
      attributes: ['id', 'first_name', 'last_name', 'bio', 'experience'],
      include: [
        { model: Review, attributes: ['rating', 'comment', 'created_at'] },
        { model: Advisor, attributes: ['currentRank', 'points'], required: false },
        { model: MarketplaceItem, as: 'itemsSold', attributes: ['title', 'status'] },
      ],
    });
    if (!seller) return res.status(404).json({ error: 'Seller not found' });
    res.status(200).json(seller);
  } catch (error) {
    console.error('Error fetching seller profile:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Start or send a chat message
module.exports.sendChatMessage = async (req, res) => {
  try {
    const { itemId, message } = req.body;
    const senderId = req.user.id; // Requires auth middleware
    const item = await MarketplaceItem.findByPk(itemId);
    if (!item) return res.status(404).json({ error: 'Item not found' });

    const chat = await Chat.create({
      message,
      senderId,
      recipientId: item.sellerId === senderId ? item.buyerId : item.sellerId, // Chat with buyer or seller
      itemId,
    });
    res.status(201).json(chat);
  } catch (error) {
    console.error('Error sending chat message:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get chat history for an item
module.exports.getChatHistory = async (req, res) => {
  try {
    const itemId = req.params.itemId;
    const userId = req.user.id; // Requires auth middleware
    const chats = await Chat.findAll({
      where: { itemId },
      include: [
        { model: User, as: 'sender', attributes: ['id', 'first_name', 'last_name'] },
        { model: User, as: 'recipient', attributes: ['id', 'first_name', 'last_name'] },
      ],
    });

    // Filter chats to only those involving the current user
    const userChats = chats.filter(chat => 
      chat.senderId === userId || chat.recipientId === userId
    );
    res.status(200).json(userChats);
  } catch (error) {
    console.error('Error fetching chat history:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Search for an item by name
module.exports.searchItemByName = async (req, res) => {
  try {
    const { name } = req.query; // Assuming the name comes from the query string (e.g., /search?name=someItem)

    if (!name) {
      return res.status(400).json({ error: 'Please provide a name to search for' });
    }

    const item = await MarketplaceItem.findOne({
      where: {
        title: {
          [Sequelize.Op.like]: `%${name}%` // Case-insensitive partial match
        },
        status: 'available' // Optionally restrict to available items
      },
      include: [
        {
          model: User,
          as: 'seller',
          attributes: ['id', 'first_name', 'last_name', 'profile_image']
        },
        {
          model: Categorie,
          as: 'categories',
          through: { attributes: [] },
          attributes: ['id', 'name']
        }
      ]
    });

    if (!item) {
      return res.status(404).json({ error: 'No item found with that name' });
    }

    return res.status(200).json(item);
  } catch (error) {
    console.error('Error searching for marketplace item:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};