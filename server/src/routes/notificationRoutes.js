const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');

const { protect } = require('../middleware/authMiddleware');

// Define routes for Maintenance Notifications
router.post('/', protect, notificationController.createNotification);
router.get('/', protect, notificationController.getAllNotifications);
router.get('/:id', protect, notificationController.getNotificationById);
router.put('/:id', protect, notificationController.updateNotification);
router.post('/:id/convert', protect, notificationController.convertToWorkOrder);
router.delete('/:id', protect, notificationController.deleteNotification);

module.exports = router;
