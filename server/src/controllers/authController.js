const db = require('../config/db');
const { generateToken, hashPassword, comparePassword } = require('../utils/auth');

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const register = async (req, res) => {
    const { name, email, password, role } = req.body;

    try {
        const userExists = await db.query('SELECT * FROM users WHERE email = $1', [email]);

        if (userExists.rows.length > 0) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const hashedPassword = await hashPassword(password);

        // Default role to technician if not specified, ensure valid role
        const validRoles = ['admin', 'supervisor', 'technician', 'viewer'];
        const userRole = validRoles.includes(role) ? role : 'technician';

        const newUser = await db.query(
            'INSERT INTO users (name, email, password_hash, role, status, created_at) VALUES ($1, $2, $3, $4, $5, NOW()) RETURNING id, name, email, role, status',
            [name, email, hashedPassword, userRole, 'pending']
        );

        const user = newUser.rows[0];

        res.status(201).json({
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            status: user.status,
            token: generateToken(user),
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res) => {
    const { email, password } = req.body;

    try {
        const result = await db.query('SELECT * FROM users WHERE email = $1', [email]);
        const user = result.rows[0];

        if (user && (await comparePassword(password, user.password_hash))) {
            if (user.status !== 'active') {
                return res.status(401).json({ message: 'Tu cuenta está pendiente de aprobación por el administrador.' });
            }

            res.json({
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                status: user.status,
                token: generateToken(user),
            });
        } else {
            res.status(401).json({ message: 'Email o contraseña inválidos' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Get user profile
// @route   GET /api/auth/profile
// @access  Private
const getProfile = async (req, res) => {
    try {
        const result = await db.query('SELECT id, name, email, role, created_at FROM users WHERE id = $1', [req.user.id]);
        const user = result.rows[0];

        if (user) {
            res.json(user);
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = { register, login, getProfile };
