const { Inventory } = require('../models');

// @desc    Get all inventory items
// @route   GET /api/inventory
// @access  Private
const getInventory = async (req, res) => {
    try {
        const items = await Inventory.findAll({ order: [['name', 'ASC']] });
        res.json(items);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Get single item
// @route   GET /api/inventory/:id
// @access  Private
const getItemById = async (req, res) => {
    const { id } = req.params;
    try {
        const item = await Inventory.findByPk(id);

        if (!item) {
            return res.status(404).json({ message: 'Item not found' });
        }

        res.json(item);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Create a new inventory item
// @route   POST /api/inventory
// @access  Private (Admin/Supervisor)
const createItem = async (req, res) => {
    const { name, code, description, current_stock, min_stock, cost, location, tech_specs } = req.body;

    try {
        const itemExists = await Inventory.findOne({ where: { code } });

        if (itemExists) {
            return res.status(400).json({ message: 'Item with this code already exists' });
        }

        const newItem = await Inventory.create({
            name,
            code,
            description,
            current_stock: current_stock || 0,
            min_stock: min_stock || 0,
            cost: cost || 0,
            location,
            tech_specs: tech_specs || {}
        });

        res.status(201).json(newItem);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Update an item
// @route   PUT /api/inventory/:id
// @access  Private (Admin/Supervisor)
const updateItem = async (req, res) => {
    const { id } = req.params;
    try {
        const item = await Inventory.findByPk(id);

        if (!item) {
            return res.status(404).json({ message: 'Item not found' });
        }

        await item.update(req.body);
        res.json(item);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Delete an item
// @route   DELETE /api/inventory/:id
// @access  Private (Admin)
const deleteItem = async (req, res) => {
    const { id } = req.params;

    try {
        const item = await Inventory.findByPk(id);

        if (!item) {
            return res.status(404).json({ message: 'Item not found' });
        }

        // Note: wo_spares check removed for now as we don't have that model yet, 
        // but Sequelize constraints will handle it if associations are defined.
        await item.destroy();
        res.json({ message: 'Item removed' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};


// @desc    Get items with low or zero stock
// @route   GET /api/inventory/alerts
// @access  Private
const getStockAlerts = async (req, res) => {
    try {
        const items = await Inventory.findAll({ order: [['name', 'ASC']] });
        const alerts = items
            .filter(item => item.current_stock <= item.min_stock)
            .map(item => ({
                id: item.id,
                code: item.code,
                name: item.name,
                current_stock: item.current_stock,
                min_stock: item.min_stock,
                location: item.location,
                alert_level: item.current_stock === 0 ? 'sin_stock' : 'bajo'
            }));
        res.json(alerts);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = { getInventory, getItemById, createItem, updateItem, deleteItem, getStockAlerts };
