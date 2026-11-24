// controllers/quotationController.js – Quotation HTTP Handlers
// ------------------------------------------------------------
// Handles incoming requests for B2B price quotations

const quotationService = require('../services/quotationService');

/**
 * @route   GET /api/quotations
 * @desc    Get all quotation requests
 * @access  Private (Business / Supplier / Admin)
 */
const getQuotations = async (req, res, next) => {
  try {
    const quotations = await quotationService.getAllQuotations();
    res.status(200).json({
      success: true,
      count: quotations.length,
      data: quotations,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/quotations/:id
 * @desc    Get quotation details
 * @access  Private
 */
const getQuotation = async (req, res, next) => {
  try {
    const quotation = await quotationService.getQuotationById(req.params.id);
    res.status(200).json({
      success: true,
      data: quotation,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getQuotations,
  getQuotation,
};

