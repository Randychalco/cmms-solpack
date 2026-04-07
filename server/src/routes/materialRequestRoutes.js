const express = require('express');
const router = express.Router();
const materialRequestController = require('../controllers/materialRequestController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/', materialRequestController.getMaterialRequests);
router.post('/', materialRequestController.createMaterialRequest);
router.put('/:id', materialRequestController.updateMaterialRequest);
router.delete('/:id', materialRequestController.deleteMaterialRequest);

module.exports = router;
