// routes/returnRoutes.js – Return & Refund Routes
// ------------------------------------------------

const express = require('express');
const router = express.Router();
const returnController = require('../controllers/returnController');
const { protect } = require('../middlewares/authMiddleware');
const { authorizeRoles } = require('../middlewares/roleMiddleware');

router.use(protect);

// POST /api/returns – Customer submits return request
router.post('/', returnController.requestReturn);

// GET /api/returns – List return requests (scoped for customer, all for admin)
router.get('/', returnController.getReturnRequests);

// GET /api/returns/:id – View single return request
router.get('/:id', returnController.getReturnById);

// PUT /api/returns/:id/review – Approve or reject return (Admin only)
router.put('/:id/review', authorizeRoles('admin'), returnController.reviewReturn);

// POST /api/returns/items/:itemId/inspect – Inspect physical item & restock if good (Admin only)
router.post('/items/:itemId/inspect', authorizeRoles('admin'), returnController.inspectAndRestock);

module.exports = router;
