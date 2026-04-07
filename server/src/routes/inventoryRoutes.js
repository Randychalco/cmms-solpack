const express = require('express');
const router = express.Router();
const { getInventory, getItemById, createItem, updateItem, deleteItem, getStockAlerts } = require('../controllers/inventoryController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.get('/', protect, getInventory);
router.get('/alerts', protect, getStockAlerts);
router.get('/:id', protect, getItemById);
router.post('/', protect, authorize('admin', 'supervisor'), createItem);
router.put('/:id', protect, authorize('admin', 'supervisor'), updateItem);
router.delete('/:id', protect, authorize('admin'), deleteItem);

module.exports = router;
