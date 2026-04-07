const { RepairRecord, Machine, Plant, Area } = require('../models');

// Obtener todas las reparaciones, opcionalmente filtradas por máquina o fecha
exports.getRepairs = async (req, res) => {
    try {
        const repairs = await RepairRecord.findAll({
            include: [
                {
                    model: Machine,
                    attributes: ['id', 'name'],
                    include: [
                        {
                            model: Area,
                            attributes: ['id', 'name'],
                            include: [
                                {
                                    model: Plant,
                                    attributes: ['id', 'name']
                                }
                            ]
                        }
                    ]
                }
            ],
            order: [['createdAt', 'DESC']]
        });
        res.json(repairs);
    } catch (error) {
        console.error('Error fetching repairs:', error);
        res.status(500).json({ message: 'Error retrieving repair records: ' + error.message, stack: error.stack });
    }
};

// Crear un nuevo registro de envío a reparación
exports.createRepair = async (req, res) => {
    try {
        const { machine_id, part_name, issue_description, supplier_name, sent_date, expected_return_date } = req.body;

        if (!machine_id || !part_name || !supplier_name || !sent_date) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        const newRepair = await RepairRecord.create({
            machine_id,
            part_name,
            issue_description,
            supplier_name,
            sent_date,
            expected_return_date,
            status: 'ENVIADO'
        });

        res.status(201).json(newRepair);
    } catch (error) {
        console.error('Error creating repair record:', error);
        res.status(500).json({ message: 'Error creating repair record.' });
    }
};

// Actualizar para marcar como devuelto (Recibir)
exports.receiveRepair = async (req, res) => {
    try {
        const { id } = req.params;
        const { return_date, repair_cost, repair_notes } = req.body;

        const repair = await RepairRecord.findByPk(id);

        if (!repair) {
            return res.status(404).json({ message: 'Repair record not found' });
        }

        if (repair.status === 'DEVUELTO') {
            return res.status(400).json({ message: 'Repair is already marked as returned' });
        }

        repair.return_date = return_date || new Date();
        repair.repair_cost = repair_cost || 0;
        repair.repair_notes = repair_notes || null;
        repair.status = 'DEVUELTO';

        await repair.save();

        res.json(repair);
    } catch (error) {
        console.error('Error updating repair record:', error);
        res.status(500).json({ message: 'Error updating repair record.' });
    }
};
