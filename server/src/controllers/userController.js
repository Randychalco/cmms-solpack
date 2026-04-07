const { User } = require('../models');

// @desc    Get all users (or filter by role)
// @route   GET /api/users
// @access  Private
const getUsers = async (req, res) => {
    try {
        const { role } = req.query;
        const where = role ? { role } : {};

        const users = await User.findAll({
            where,
            attributes: ['id', 'name', 'email', 'role'],
            order: [['name', 'ASC']]
        });

        res.json(users);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error fetching users' });
    }
};

// @desc    Update user status
// @route   PUT /api/users/:id/status
// @access  Private/Admin
const updateUserStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const user = await User.findByPk(id);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        user.status = status;
        await user.save();

        res.json({ message: `User status updated to ${status}`, user });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error updating user status' });
    }
};

// @desc    Update user details
// @route   PUT /api/users/:id
// @access  Private/Admin
const updateUser = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, role, status } = req.body;

        const user = await User.findByPk(id);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        user.name = name || user.name;
        user.role = role || user.role;
        user.status = status || user.status;

        await user.save();

        res.json({ message: 'User updated successfully', user });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error updating user' });
    }
};

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Private/Admin
const deleteUser = async (req, res) => {
    try {
        const { id } = req.params;

        const user = await User.findByPk(id);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        await user.destroy();

        res.json({ message: 'User removed' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error deleting user' });
    }
};

module.exports = { getUsers, updateUserStatus, updateUser, deleteUser };
