// controllers/manufacturingController.js – Manufacturing Controller
// -------------------------------------------------------------------

const manufacturingService = require('../services/manufacturingService');

const createOrder = async (req, res, next) => {
  try {
    const order = await manufacturingService.createManufacturingOrder(req.body);
    res.status(201).json({
      success: true,
      message: 'Manufacturing work order created',
      data: order,
    });
  } catch (error) {
    next(error);
  }
};

const getOrders = async (req, res, next) => {
  try {
    const orders = await manufacturingService.getManufacturingOrders();
    res.status(200).json({
      success: true,
      count: orders.length,
      data: orders,
    });
  } catch (error) {
    next(error);
  }
};

const getOrder = async (req, res, next) => {
  try {
    const order = await manufacturingService.getManufacturingOrderById(req.params.id);
    res.status(200).json({
      success: true,
      data: order,
    });
  } catch (error) {
    next(error);
  }
};

const updateStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const order = await manufacturingService.updateManufacturingStatus(req.params.id, status, req.user?.id);
    res.status(200).json({
      success: true,
      message: `Batch status updated to ${status}. ${status === 'completed' || status === 'finished' ? 'Manufactured units have been credited to warehouse inventory.' : ''}`,
      data: order,
    });
  } catch (error) {
    next(error);
  }
};

const logProduction = async (req, res, next) => {
  try {
    const record = await manufacturingService.logProductionStage({
      ...req.body,
      worker_id: req.user.id,
    });
    res.status(201).json({
      success: true,
      message: 'Production stage recorded',
      data: record,
    });
  } catch (error) {
    next(error);
  }
};

const recordInspection = async (req, res, next) => {
  try {
    const inspection = await manufacturingService.recordQualityInspection(
      req.user.id,
      req.body
    );
    res.status(201).json({
      success: true,
      message: 'Quality inspection recorded. Approved units transferred to inventory.',
      data: inspection,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createOrder,
  getOrders,
  getOrder,
  updateStatus,
  logProduction,
  recordInspection,
};

