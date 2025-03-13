const { MarketplaceItem, User, Chat, Review, MarketplaceCategorie, Media ,MarketplaceItemCategorie} = require('../models');
const { connection } = require('../models'); 
const { Op, Sequelize } = require('sequelize');


// Get all available items

module.exports.getItemById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ error: 'Item ID is required' });
    }

    const item = await MarketplaceItem.findByPk(id, {
      include: [
        {
          model: User,
          as: 'seller',
          attributes: ['id', 'first_name', 'last_name', 'profile_image'],
        },
        {
          model: MarketplaceCategorie,
          as: 'categories',
          through: { attributes: [] },
          attributes: ['id', 'name'],
        },
      ],
    });

    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }

    res.status(200).json(item);
  } catch (error) {
    console.error('Error fetching item by ID:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};


module.exports.getAllItems = async (req, res) => {
  try {
    const items = await MarketplaceItem.findAll({
      where: { status: 'available' },
      include: [
        {
          model: User,
          as: 'seller',
          attributes: ['id', 'first_name', 'last_name', 'profile_image'],
        },
        {
          model: MarketplaceCategorie,
          as: 'categories',
          through: { attributes: [] },
          attributes: ['id', 'name'],
        },
        {
          model: Media,
          as: 'media',
        }
      ],
    });
    res.status(200).json(items);
  } catch (error) {
    console.error('Error fetching marketplace items:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports.getItemsByCategory = async (req, res) => {
  try {
    const { categoryId } = req.params;
    
    const category = await MarketplaceCategorie.findByPk(categoryId);
    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }

    const items = await MarketplaceItem.findAll({
      where: { 
        status: 'available'
      },
      include: [
        {
          model: User,
          as: 'seller',
          attributes: ['id', 'first_name', 'last_name', 'profile_image']
        },
        {
          model: MarketplaceCategorie,
          as: 'categories',
          where: { id: categoryId },
          through: { attributes: [] },
          attributes: ['id', 'name', 'icon']
        },
        {
          model: Media,
          as: 'media',
        }
      ]
    });

    res.status(200).json(items);
  } catch (error) {
    console.error('Error fetching items by category:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};


module.exports.createItem = async (req, res) => {
  try {
    const { title, description, price, location, categoryIds, images } = req.body;
    const sellerId = req.user.id; // Get from auth middleware instead of params

    // Input validation
    if (!title || !description || !price || !location) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Validate categoryIds
    if (!Array.isArray(categoryIds) || categoryIds.length === 0) {
      return res.status(400).json({ error: 'At least one category is required' });
    }

    // Validate images
    if (!Array.isArray(images) || images.length === 0) {
      return res.status(400).json({ error: 'At least one image is required' });
    }

    // Start transaction
    const result = await connection.transaction(async (t) => {
      const item = await MarketplaceItem.create({
        title,
        description,
        price: parseFloat(price),
        location,
        sellerId, // Using authenticated user's ID
        status: 'available',
        imageURL: images[0]
      }, { transaction: t });

      // Create media entries
      const mediaEntries = images.map((imageUrl) => ({
        url: imageUrl,
        type: 'image',
        marketplaceItemId: item.id
      }));
      await Media.bulkCreate(mediaEntries, { transaction: t });

      // Find and validate categories
      const categories = await MarketplaceCategorie.findAll({
        where: { id: categoryIds },
        transaction: t
      });

      if (categories.length !== categoryIds.length) {
        throw new Error('One or more invalid category IDs');
      }

      // Create category associations
      await Promise.all(categories.map(category =>
        MarketplaceItemCategorie.create({
          marketplaceItemId: item.id,
          marketplaceCategorieId: category.id
        }, { transaction: t })
      ));

      return await MarketplaceItem.findByPk(item.id, {
        include: [
          {
            model: User,
            as: 'seller',
            attributes: ['id', 'first_name', 'last_name', 'profile_image']
          },
          {
            model: MarketplaceCategorie,
            as: 'categories',
            through: { attributes: [] },
            attributes: ['id', 'name']
          },
          {
            model: Media,
            as: 'media',
            attributes: ['id', 'url', 'type']
          }
        ],
        transaction: t
      });
    });

    res.status(201).json(result);
  } catch (error) {
    console.error('Error creating item:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Buy item using auth header
module.exports.buyItem = async (req, res) => {
  try {
    const { itemId } = req.params;
    const buyerId = req.user.id; // Get from auth middleware

    const item = await MarketplaceItem.findByPk(itemId);
    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }

    if (item.status !== 'available') {
      return res.status(400).json({ error: 'Item not available' });
    }

    if (buyerId === item.sellerId) {
      return res.status(400).json({ error: 'Cannot buy your own item' });
    }

    await item.update({ 
      status: 'sold', 
      buyerId,
      soldAt: new Date()
    });

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

// Send chat message using auth header
module.exports.sendChatMessage = async (req, res) => {
  try {
    const { itemId, message } = req.body;
    const senderId = req.user.id; // Get from auth middleware

    const item = await MarketplaceItem.findByPk(itemId);
    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }

    const recipientId = item.sellerId === senderId ? item.buyerId : item.sellerId;

    const chat = await Chat.create({
      message,
      senderId,
      recipientId,
      itemId
    });

    res.status(201).json(chat);
  } catch (error) {
    console.error('Error sending chat message:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get chat history using auth header
module.exports.getChatHistory = async (req, res) => {
  try {
    const { itemId } = req.params;
    const userId = req.user.id; // Get from auth middleware

    const chats = await Chat.findAll({
      where: {
        itemId,
        [Op.or]: [
          { senderId: userId },
          { recipientId: userId }
        ]
      },
      include: [
        {
          model: User,
          as: 'sender',
          attributes: ['id', 'first_name', 'last_name', 'profile_image']
        },
        {
          model: User,
          as: 'recipient',
          attributes: ['id', 'first_name', 'last_name', 'profile_image']
        }
      ],
      order: [['createdAt', 'ASC']]
    });

    res.status(200).json(chats);
  } catch (error) {
    console.error('Error fetching chat history:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Search for an item by name
module.exports.searchItemByName = async (req, res) => {
  try {
    const { name, minPrice, maxPrice, category, status = 'available' } = req.query;

    const whereClause = {
      status: status
    };

    // Add title search if name is provided
    if (name) {
      whereClause.title = { [Sequelize.Op.like]: `%${name}%` };
    }

    // Add price range if provided
    if (minPrice || maxPrice) {
      whereClause.price = {};
      if (minPrice) whereClause.price[Op.gte] = minPrice;
      if (maxPrice) whereClause.price[Op.lte] = maxPrice;
    }

    // Add category filter if provided
    const includeClause = [
      {
        model: User,
        as: 'seller',
        attributes: ['id', 'first_name', 'last_name', 'profile_image']
      },
      {
        model: MarketplaceCategorie,
        as: 'categories',
        through: { attributes: [] },
        attributes: ['id', 'name']
      }
    ];

    if (category) {
      includeClause.push({
        model: MarketplaceCategorie,
        as: 'categories',
        where: { id: category },
        through: { attributes: [] },
        attributes: ['id', 'name']
      });
    }

    const items = await MarketplaceItem.findAll({
      where: whereClause,
      include: includeClause,
      order: [['createdAt', 'DESC']]
    });

    if (!items || items.length === 0) {
      return res.status(404).json({ error: 'No items found' });
    }

    return res.status(200).json(items);
  } catch (error) {
    console.error('Error searching for marketplace items:', error.message, error.stack);
    return res.status(500).json({ 
      error: 'Internal server error', 
      details: error.message
    });
  }
};

// Get all marketplace categories
module.exports.getAllMarketplaceCategories = async (req, res) => {
  try {
    const categories = await MarketplaceCategorie.findAll({
      attributes: ['id', 'name', 'icon', 'description'],
      include: [
        {
          model: MarketplaceItem,
          as: 'items',
          attributes: ['id', 'title'],
          through: { attributes: [] }
        }
        
      ]
    });
    res.status(200).json(categories);
  } catch (error) {
    console.error('Error fetching marketplace categories:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Create new marketplace category
module.exports.createMarketplaceCategory = async (req, res) => {
  try {
    const { name, icon, description } = req.body;

    // Check if category with same name exists
    const existingCategory = await MarketplaceCategorie.findOne({ where: { name } });
    if (existingCategory) {
      return res.status(400).json({ error: 'Category with this name already exists' });
    }

    const category = await MarketplaceCategorie.create({
      name,
      icon,
      description
    });

    res.status(201).json(category);
  } catch (error) {
    console.error('Error creating marketplace category:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Update marketplace category
module.exports.updateMarketplaceCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, icon, description } = req.body;

    const category = await MarketplaceCategorie.findByPk(id);
    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }

    // Check if new name conflicts with existing category
    if (name && name !== category.name) {
      const existingCategory = await MarketplaceCategorie.findOne({ where: { name } });
      if (existingCategory) {
        return res.status(400).json({ error: 'Category with this name already exists' });
      }
    }

    await category.update({
      name: name || category.name,
      icon: icon || category.icon,
      description: description || category.description
    });

    res.status(200).json(category);
  } catch (error) {
    console.error('Error updating marketplace category:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Delete marketplace category
module.exports.deleteMarketplaceCategory = async (req, res) => {
  try {
    const { id } = req.params;

    const category = await MarketplaceCategorie.findByPk(id);
    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }

    // Check if category has items
    const itemCount = await category.countItems();
    if (itemCount > 0) {
      return res.status(400).json({ 
        error: 'Cannot delete category with associated items. Please remove items first.' 
      });
    }

    await category.destroy();
    res.status(200).json({ message: 'Category deleted successfully' });
  } catch (error) {
    console.error('Error deleting marketplace category:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};