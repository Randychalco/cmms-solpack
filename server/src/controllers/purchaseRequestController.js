const { PurchaseRequest, Machine, Plant, Area, User } = require('../models');

// Obtener todos los pedidos
exports.getPurchaseRequests = async (req, res) => {
    try {
        const requests = await PurchaseRequest.findAll({
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
                },
                {
                    model: User,
                    as: 'Requester',
                    attributes: ['id', 'name', 'email']
                }
            ],
            order: [['createdAt', 'DESC']]
        });
        res.json(requests);
    } catch (error) {
        console.error('Error fetching purchase requests:', error);
        res.status(500).json({ message: 'Error retrieving purchase requests: ' + error.message });
    }
};

// Crear un nuevo pedido
exports.createPurchaseRequest = async (req, res) => {
    try {
        const {
            part_name,
            part_number,
            quantity,
            justification,
            machine_id,
            priority,
            suggested_supplier
        } = req.body;

        if (!part_name || !quantity || !justification) {
            return res.status(400).json({ message: 'Missing required fields (part_name, quantity, justification)' });
        }

        const newRequest = await PurchaseRequest.create({
            part_name,
            part_number: part_number || null,
            quantity,
            justification,
            machine_id: machine_id || null,
            priority: priority || 'MEDIA',
            suggested_supplier: suggested_supplier || null,
            status: 'PENDIENTE',
            requester_id: req.user ? req.user.id : null // Assuming auth middleware sets req.user
        });

        res.status(201).json(newRequest);
    } catch (error) {
        console.error('Error creating purchase request:', error);
        res.status(500).json({ message: 'Error creating purchase request: ' + error.message });
    }
};

// Actualizar el estado de un pedido
exports.updatePurchaseRequestStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, po_number } = req.body;

        const request = await PurchaseRequest.findByPk(id);

        if (!request) {
            return res.status(404).json({ message: 'Purchase request not found' });
        }

        if (status) request.status = status;
        if (po_number) request.po_number = po_number;

        await request.save();

        res.json(request);
    } catch (error) {
        console.error('Error updating purchase request status:', error);
        res.status(500).json({ message: 'Error updating status: ' + error.message });
    }
};
