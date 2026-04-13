const express = require('express');
const router = express.Router();
const {
    getPreventivePlans,
    getPreventivePlanById,
    createPreventivePlan,
    updatePreventivePlan,
    deletePreventivePlan,
    getExecutions,
    getExecutionById,
    createExecution,
    updateExecution,
    deleteExecution
} = require('../controllers/preventiveController');
const { protect, authorize } = require('../middleware/authMiddleware');

// Plans
router.get('/plans', protect, getPreventivePlans);
router.get('/plans/:id', protect, getPreventivePlanById);
router.post('/plans', protect, authorize('admin', 'supervisor'), createPreventivePlan);
router.put('/plans/:id', protect, authorize('admin', 'supervisor'), updatePreventivePlan);
router.delete('/plans/:id', protect, authorize('admin', 'supervisor'), deletePreventivePlan);

// Executions
router.get('/executions', protect, getExecutions);
router.get('/executions/:id', protect, getExecutionById);
router.post('/executions', protect, createExecution);
router.put('/executions/:id', protect, updateExecution);
router.delete('/executions/:id', protect, deleteExecution);

module.exports = router;
