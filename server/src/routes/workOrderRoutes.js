const express = require('express');
const router = express.Router();
const { getWorkOrders, getWorkOrderById, createWorkOrder, updateWorkOrder, updateWorkOrderStatus, addSignature, deleteWorkOrder } = require('../controllers/workOrderController');
const { protect } = require('../middleware/authMiddleware');

router.get('/', protect, getWorkOrders);
router.get('/:id', protect, getWorkOrderById);
router.post('/', protect, createWorkOrder);
router.put('/:id', protect, updateWorkOrder);
router.put('/:id/status', protect, updateWorkOrderStatus);
router.put('/:id/signature', protect, addSignature);
router.delete('/:id', protect, deleteWorkOrder);

module.exports = router;
