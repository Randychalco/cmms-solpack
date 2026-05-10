const express = require('express');
const router = express.Router();
const purchaseRequestController = require('../controllers/purchaseRequestController');
const { protect } = require('../middleware/authMiddleware');

// Obtener todas las solicitudes
router.get('/', protect, purchaseRequestController.getPurchaseRequests);

// Crear una nueva solicitud
router.post('/', protect, purchaseRequestController.createPurchaseRequest);

// Cambiar el estado de la solicitud
router.put('/:id/status', protect, purchaseRequestController.updatePurchaseRequestStatus);

// Eliminar pedido
router.delete('/:id', protect, purchaseRequestController.deletePurchaseRequest);

module.exports = router;
