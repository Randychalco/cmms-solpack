const express = require('express');
const router = express.Router();
const exportController = require('../controllers/exportController');

// Rutas de exportación
router.get('/work-orders', exportController.exportWorkOrders);
router.get('/dashboard', exportController.exportDashboard);
router.get('/inventory', exportController.exportInventory);
router.get('/checklists', exportController.exportChecklists);
router.get('/material-requests', exportController.exportMaterialRequests);
router.get('/repairs', exportController.exportRepairs);
router.get('/purchase-requests', exportController.exportPurchaseRequests);
router.get('/preventive-orders', exportController.exportPreventiveOrders);
router.get('/preventive-order/:id', exportController.exportSinglePreventiveOrder);
router.get('/preventive-plans-master', exportController.exportPreventivePlansMaster);

module.exports = router;
