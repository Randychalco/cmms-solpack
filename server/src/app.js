const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

const masterDataRoutes = require('./routes/masterDataRoutes');
const { syncDatabase } = require('./models');

const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(morgan('dev'));

// Routes
app.use('/api/master', masterDataRoutes);
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/assets', require('./routes/assetRoutes'));
app.use('/api/work-orders', require('./routes/workOrderRoutes'));
app.use('/api/inventory', require('./routes/inventoryRoutes'));
app.use('/api/dashboard', require('./routes/dashboardRoutes'));
app.use('/api/checklists', require('./routes/checklistRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/export', require('./routes/exportRoutes'));
app.use('/api/import', require('./routes/importRoutes'));
app.use('/api/material-requests', require('./routes/materialRequestRoutes'));
app.use('/api/repairs', require('./routes/repairRoutes'));
app.use('/api/purchase-requests', require('./routes/purchaseRequestRoutes'));
app.use('/api/preventive', require('./routes/preventiveRoutes'));
app.use('/api/notifications', require('./routes/notificationRoutes'));

app.get('/', (req, res) => {
  res.json({ message: 'CMMS Core API is running' });
});

// Error Handling Middleware
app.use((err, req, res, next) => {
  console.error('SERVER_ERROR:', err);
  res.status(500).json({ 
    error: 'Internal Server Error',
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

const PORT = process.env.PORT || 5000;

// Sync Database and Start Server
syncDatabase().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log('Restarted backend for Repair tracking verification');
  });
});
