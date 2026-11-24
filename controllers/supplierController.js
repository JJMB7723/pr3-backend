// controllers/supplierController.js – Supplier & Business Profile Controller
// -------------------------------------------------------------------------

const supplierService = require('../services/supplierService');

const getProfile = async (req, res, next) => {
  try {
    const result = await supplierService.getMyProfile(req.user.id, req.user.role);
    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const updateProfile = async (req, res, next) => {
  try {
    const result = await supplierService.updateMyProfile(req.user.id, req.user.role, req.body);
    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const getSuppliers = async (req, res, next) => {
  try {
    const suppliers = await supplierService.getAllSuppliers();
    res.status(200).json({
      success: true,
      count: suppliers.length,
      data: suppliers,
    });
  } catch (error) {
    next(error);
  }
};

const getSupplier = async (req, res, next) => {
  try {
    const supplier = await supplierService.getSupplierById(req.params.id);
    res.status(200).json({
      success: true,
      data: supplier,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getProfile,
  updateProfile,
  getSuppliers,
  getSupplier,
};
