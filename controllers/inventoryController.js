// controllers/inventoryController.js – Inventory Controller
// -----------------------------------------------------------

const inventoryService = require('../services/inventoryService');

const getInventoryList = async (req, res, next) => {
  try {
    const inventory = await inventoryService.getAllInventory();
    res.status(200).json({
      success: true,
      count: inventory.length,
      data: inventory,
    });
  } catch (error) {
    next(error);
  }
};

const getLowStock = async (req, res, next) => {
  try {
    const threshold = req.query.threshold ? parseInt(req.query.threshold, 10) : 5;
    const items = await inventoryService.getLowStockInventory(threshold);
    res.status(200).json({
      success: true,
      count: items.length,
      data: items,
    });
  } catch (error) {
    next(error);
  }
};

const getVariantStock = async (req, res, next) => {
  try {
    const stock = await inventoryService.getInventoryByVariant(req.params.variantId);
    res.status(200).json({
      success: true,
      data: stock,
    });
  } catch (error) {
    next(error);
  }
};

const adjustStock = async (req, res, next) => {
  try {
    const { product_variant_id, quantity, reason, type } = req.body;
    if (!product_variant_id || quantity === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Product variant ID and quantity are required.',
      });
    }

    const result = await inventoryService.adjustStock(req.user.id, {
      product_variant_id,
      quantity,
      reason,
      type,
    });

    res.status(200).json({
      success: true,
      message: 'Stock adjusted successfully',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const getMovements = async (req, res, next) => {
  try {
    const movements = await inventoryService.getStockMovements(req.params.variantId);
    res.status(200).json({
      success: true,
      count: movements.length,
      data: movements,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getInventoryList,
  getLowStock,
  getVariantStock,
  adjustStock,
  getMovements,
};
