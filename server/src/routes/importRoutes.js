const express = require('express');
const router = express.Router();
const multer = require('multer');
const importController = require('../controllers/importController');
const { protect } = require('../middleware/authMiddleware');

// Configuración de Multer (almacenamiento en memoria para procesar directamente)
const storage = multer.memoryStorage();
const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// Rutas
router.post('/work-orders', protect, upload.single('file'), importController.importWorkOrders);
router.get('/template/work-orders', protect, importController.downloadTemplate);

router.post('/inventory', protect, upload.single('file'), importController.importInventory);
router.get('/template/inventory', protect, importController.downloadInventoryTemplate);

module.exports = router;
