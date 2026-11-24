// controllers/returnController.js – Return Controller
// -----------------------------------------------------

const returnService = require('../services/returnService');

const requestReturn = async (req, res, next) => {
  try {
    const returnRequest = await returnService.requestReturn(req.user.id, req.body);
    res.status(201).json({
      success: true,
      message: 'Return request submitted successfully',
      data: returnRequest,
    });
  } catch (error) {
    next(error);
  }
};

const getReturnRequests = async (req, res, next) => {
  try {
    const returns = await returnService.getReturnRequests(req.user.id, req.user.role);
    res.status(200).json({
      success: true,
      count: returns.length,
      data: returns,
    });
  } catch (error) {
    next(error);
  }
};

const getReturnById = async (req, res, next) => {
  try {
    const returnRequest = await returnService.getReturnById(
      req.params.id,
      req.user.id,
      req.user.role
    );
    res.status(200).json({
      success: true,
      data: returnRequest,
    });
  } catch (error) {
    next(error);
  }
};

const reviewReturn = async (req, res, next) => {
  try {
    const { status, notes, resolution } = req.body;
    const returnRequest = await returnService.reviewReturnRequest(
      req.params.id,
      status,
      notes,
      resolution
    );
    res.status(200).json({
      success: true,
      message: `Return request ${status}`,
      data: returnRequest,
    });
  } catch (error) {
    next(error);
  }
};

const inspectAndRestock = async (req, res, next) => {
  try {
    const result = await returnService.inspectAndRestock(
      req.user.id,
      req.params.itemId,
      req.body
    );
    res.status(200).json({
      success: true,
      message: result.message,
      data: result.return_item,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  requestReturn,
  getReturnRequests,
  getReturnById,
  reviewReturn,
  inspectAndRestock,
};
