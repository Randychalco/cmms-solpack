const express = require('express');
const router = express.Router();
const repairController = require('../controllers/repairController');
const { protect } = require('../middleware/authMiddleware');

// Get all repairs
router.get('/', protect, repairController.getRepairs);

// Create a new repair sending record
router.post('/', protect, repairController.createRepair);

// Mark repair as received/returned
router.put('/:id/receive', protect, repairController.receiveRepair);

// Delete repair record
router.delete('/:id', protect, repairController.deleteRepair);

module.exports = router;
