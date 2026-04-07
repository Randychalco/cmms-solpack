const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { Plant, Area, Machine, SubMachine } = require('../models');

// @desc    Get all plants
// @route   GET /api/master/plants
// @access  Private
router.get('/plants', protect, async (req, res) => {
    try {
        const plants = await Plant.findAll({ order: [['name', 'ASC']] });
        res.json(plants);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @desc    Get all areas or filter by plantId
// @route   GET /api/master/areas?plantId=X
// @access  Private
router.get('/areas', protect, async (req, res) => {
    try {
        const { plantId } = req.query;
        const whereClause = plantId ? { plantId } : {};
        const areas = await Area.findAll({
            where: whereClause,
            order: [['name', 'ASC']]
        });
        res.json(areas);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @desc    Get areas by plant (path param)
// @route   GET /api/master/areas/:plantId
// @access  Private
router.get('/areas/:plantId', protect, async (req, res) => {
    try {
        const areas = await Area.findAll({
            where: { plantId: req.params.plantId },
            order: [['name', 'ASC']]
        });
        res.json(areas);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @desc    Get all machines
// @route   GET /api/master/machines
// @access  Private
router.get('/machines', protect, async (req, res) => {
    try {
        const machines = await Machine.findAll({ order: [['name', 'ASC']] });
        res.json(machines);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @desc    Get machines by area
// @route   GET /api/master/machines/:areaId
// @access  Private
router.get('/machines/:areaId', protect, async (req, res) => {
    try {
        const machines = await Machine.findAll({
            where: { areaId: req.params.areaId },
            order: [['name', 'ASC']]
        });
        res.json(machines);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @desc    Get sub-machines by machine
// @route   GET /api/master/sub-machines/:machineId
// @access  Private
router.get('/sub-machines/:machineId', protect, async (req, res) => {
    try {
        const subMachines = await SubMachine.findAll({
            where: { machineId: req.params.machineId },
            order: [['name', 'ASC']]
        });
        res.json(subMachines);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @desc    Get standard tasks by machine
// @route   GET /api/master/standard-tasks/:machineId
// @access  Private
router.get('/standard-tasks/:machineId', protect, async (req, res) => {
    try {
        const { StandardTask } = require('../models');
        const tasks = await StandardTask.findAll({
            where: { machine_id: req.params.machineId },
            order: [['task_code', 'ASC']]
        });
        res.json(tasks);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
