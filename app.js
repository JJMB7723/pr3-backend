// app.js – central Express application configuration
// ---------------------------------------------------
// This file sets up the Express app, applies global middleware, and
// registers the route modules. It does NOT start the server –
// server startup is handled separately in server.js.

const express = require('express');
const cors = require('cors');

// Import route modules and error middleware
const healthRoutes = require('./routes/healthRoutes');
const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');
const inventoryRoutes = require('./routes/inventoryRoutes');
const cartRoutes = require('./routes/cartRoutes');
const orderRoutes = require('./routes/orderRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const deliveryRoutes = require('./routes/deliveryRoutes');
const returnRoutes = require('./routes/returnRoutes');
const supplierRoutes = require('./routes/supplierRoutes');
const quotationRoutes = require('./routes/quotationRoutes');
const manufacturingRoutes = require('./routes/manufacturingRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const { notFoundHandler, errorHandler } = require('./middlewares/errorMiddleware');

const app = express();

// ----- Global Middleware -----
// Enable CORS for frontend requests (React client)
app.use(cors());

// Enable JSON request body parsing (allow up to 10mb for image uploads / base64)
app.use(express.json({ limit: '10mb' }));

// Enable URL-encoded request body parsing
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ----- Base Routes -----
// Root welcome route
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Welcome to PR3 Clothing E-commerce API',
  });
});

// ----- All API Route Modules -----
app.use('/api', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/deliveries', deliveryRoutes);
app.use('/api/returns', returnRoutes);
app.use('/api/suppliers', supplierRoutes);
app.use('/api/quotations', quotationRoutes);
app.use('/api/manufacturing', manufacturingRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/dashboard', dashboardRoutes);

// ----- Error Handling Middleware -----
// 404 handler for invalid routes (must be placed after all valid routes)
app.use(notFoundHandler);

// Centralized error handler for unexpected server errors (500)
app.use(errorHandler);

module.exports = app;
