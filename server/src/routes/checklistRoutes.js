const express = require('express');
const router = express.Router();
const {
    getTemplates,
    createTemplate,
    getExecutionByWO,
    getExecutionById,
    getExecutions,
    deleteExecution,
    saveExecution
} = require('../controllers/checklistController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.get('/templates', protect, getTemplates);
router.post('/templates', protect, authorize('admin', 'supervisor'), createTemplate);

// List all executions
router.get('/executions', protect, getExecutions);
// Get execution by execution ID
router.get('/execution/:id', protect, getExecutionById);
// Get execution by WO ID
router.get('/execution/wo/:woId', protect, getExecutionByWO);

router.post('/execution', protect, saveExecution);
router.delete('/execution/:id', protect, authorize('admin', 'supervisor'), deleteExecution);

module.exports = router;
