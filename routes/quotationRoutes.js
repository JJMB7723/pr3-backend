// routes/quotationRoutes.js – Quotation Routes
// --------------------------------------------
// Maps quotation endpoints to quotationController handlers

const express = require('express');
const router = express.Router();
const quotationController = require('../controllers/quotationController');

// GET /api/quotations – List quotations
router.get('/', quotationController.getQuotations);

// GET /api/quotations/:id – Get quotation details
router.get('/:id', quotationController.getQuotation);

module.exports = router;

