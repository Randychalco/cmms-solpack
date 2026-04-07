const { Plant, Area, Machine, SubMachine } = require('../models');
const MasterDataSeeder = require('../services/masterDataSeeder');

const MasterDataController = {
    // Get all Plants
    async getPlants(req, res) {
        try {
            const plants = await Plant.findAll({
                order: [['name', 'ASC']]
            });
            res.json(plants);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    // Get Areas by Plant ID
    async getAreas(req, res) {
        try {
            const { plantId } = req.params;
            const areas = await Area.findAll({
                where: { plantId },
                order: [['name', 'ASC']]
            });
            res.json(areas);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    // Get Machines by Area ID
    async getMachines(req, res) {
        try {
            const { areaId } = req.params;
            const machines = await Machine.findAll({
                where: { areaId },
                order: [['name', 'ASC']]
            });
            res.json(machines);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    // Get SubMachines by Machine ID
    async getSubMachines(req, res) {
        try {
            const { machineId } = req.params;
            const subMachines = await SubMachine.findAll({
                where: { machineId },
                order: [['name', 'ASC']]
            });
            res.json(subMachines);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    // Trigger Sync from AppSheet
    async syncFromAppSheet(req, res) {
        try {
            const result = await MasterDataSeeder.seedFromAppSheet();
            if (result.success) {
                res.json({ message: 'Sync complete', stats: result.stats });
            } else {
                res.status(500).json({ error: result.error });
            }
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
};

module.exports = MasterDataController;
