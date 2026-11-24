// services/quotationService.js – B2B Quotation Business Logic
// ------------------------------------------------------------
// Handles bulk price quote requests and negotiation between business buyers and suppliers

/**
 * Get all quotation requests (admin / supplier view)
 */
const getAllQuotations = async () => {
  return [
    {
      id: 'demo-quotation-1',
      reference_no: 'QT-2026-001',
      buyer_type: 'business',
      status: 'pending_review',
      message: 'Quotation module initialized and ready for B2B phase.',
    },
  ];
};

/**
 * Get quotation by ID
 */
const getQuotationById = async (quotationId) => {
  return {
    id: quotationId,
    status: 'draft',
    message: 'Quotation details placeholder.',
  };
};

module.exports = {
  getAllQuotations,
  getQuotationById,
};

