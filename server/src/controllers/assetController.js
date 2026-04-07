const { Asset } = require('../models');
const { Op } = require('sequelize');

// @desc    Get all assets
// @route   GET /api/assets
// @access  Private
const getAssets = async (req, res) => {
    try {
        const { plant, search } = req.query;
        let where = {};

        if (plant) {
            where.plant_name = plant;
        }

        if (search) {
            where[Op.or] = [
                { name: { [Op.iLike]: `%${search}%` } },
                { code: { [Op.iLike]: `%${search}%` } },
                { brand: { [Op.iLike]: `%${search}%` } }
            ];
        }

        const assets = await Asset.findAll({
            where,
            order: [['name', 'ASC']]
        });

        res.json(assets);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Get single asset
// @route   GET /api/assets/:id
// @access  Private
const getAssetById = async (req, res) => {
    try {
        const asset = await Asset.findByPk(req.params.id);
        if (!asset) return res.status(404).json({ message: 'Asset not found' });
        res.json(asset);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Create a new asset
// @route   POST /api/assets
// @access  Private
const createAsset = async (req, res) => {
    try {
        const asset = await Asset.create(req.body);
        res.status(201).json(asset);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Update an asset
// @route   PUT /api/assets/:id
// @access  Private
const updateAsset = async (req, res) => {
    try {
        const asset = await Asset.findByPk(req.params.id);
        if (!asset) return res.status(404).json({ message: 'Asset not found' });
        await asset.update(req.body);
        res.json(asset);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Delete an asset
// @route   DELETE /api/assets/:id
// @access  Private
const deleteAsset = async (req, res) => {
    try {
        const asset = await Asset.findByPk(req.params.id);
        if (!asset) return res.status(404).json({ message: 'Asset not found' });
        await asset.destroy();
        res.json({ message: 'Asset deleted' });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = { getAssets, getAssetById, createAsset, updateAsset, deleteAsset };

