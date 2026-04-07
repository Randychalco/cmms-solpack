const express = require('express');
const router = express.Router();
const { getAssets, getAssetById, createAsset, updateAsset, deleteAsset } = require('../controllers/assetController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.get('/', protect, getAssets);
router.get('/:id', protect, getAssetById);
router.post('/', protect, authorize('admin', 'supervisor'), createAsset);
router.put('/:id', protect, authorize('admin', 'supervisor'), updateAsset);
router.delete('/:id', protect, authorize('admin'), deleteAsset);

module.exports = router;
