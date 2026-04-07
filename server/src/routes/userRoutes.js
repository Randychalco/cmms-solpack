const express = require('express');
const router = express.Router();
const { getUsers, updateUserStatus, updateUser, deleteUser } = require('../controllers/userController');
const { protect, admin } = require('../middleware/authMiddleware');

router.get('/', protect, getUsers);
router.put('/:id/status', protect, updateUserStatus); // Add admin middleware if available
router.put('/:id', protect, updateUser);
router.delete('/:id', protect, deleteUser); // Add admin middleware if available

module.exports = router;
