// services/inventoryService.js – Warehouse & Inventory Business Logic
// -------------------------------------------------------------------

const { Op } = require('sequelize');
const {
  sequelize,
  Inventory,
  ProductVariant,
  Product,
  Category,
  StockMovement,
  Notification,
} = require('../models');

/**
 * Get all warehouse inventory with variant, product and category details
 */
const getAllInventory = async () => {
  return await Inventory.findAll({
    include: [
      {
        model: ProductVariant,
        as: 'variant',
        include: [
          {
            model: Product,
            as: 'product',
            include: [{ model: Category, as: 'category', attributes: ['id', 'name'] }],
          },
        ],
      },
    ],
    order: [['id', 'ASC']],
  });
};

/**
 * Get low-stock items (quantity <= 5 default threshold)
 */
const getLowStockInventory = async (threshold = 5) => {
  return await Inventory.findAll({
    where: {
      quantity: { [Op.lte]: threshold },
    },
    include: [
      {
        model: ProductVariant,
        as: 'variant',
        include: [
          {
            model: Product,
            as: 'product',
          },
        ],
      },
    ],
    order: [['quantity', 'ASC']],
  });
};

/**
 * Get stock for specific variant
 */
const getInventoryByVariant = async (variantId) => {
  const inventory = await Inventory.findOne({
    where: { product_variant_id: variantId },
    include: [
      {
        model: ProductVariant,
        as: 'variant',
        include: [{ model: Product, as: 'product' }],
      },
    ],
  });

  if (!inventory) {
    const error = new Error('Inventory record not found for variant.');
    error.statusCode = 404;
    throw error;
  }

  return inventory;
};

/**
 * Adjust stock manually inside a transaction and record movement
 */
const adjustStock = async (userId, { product_variant_id, quantity, reason, type = 'adjustment' }) => {
  const qty = parseInt(quantity, 10);
  if (isNaN(qty) || qty === 0) {
    const error = new Error('Adjustment quantity must be a non-zero integer.');
    error.statusCode = 400;
    throw error;
  }

  return await sequelize.transaction(async (t) => {
    let inventory = await Inventory.findOne({
      where: { product_variant_id },
      transaction: t,
    });

    if (!inventory) {
      inventory = await Inventory.create(
        {
          productVariantId: product_variant_id,
          product_variant_id,
          quantity: 0,
        },
        { transaction: t }
      );
    }

    const newStock = inventory.quantity + qty;
    if (newStock < 0) {
      const error = new Error(`Stock adjustment would result in negative inventory (${newStock}). Current: ${inventory.quantity}.`);
      error.statusCode = 400;
      throw error;
    }

    inventory.quantity = newStock;
    await inventory.save({ transaction: t });

    // Record stock movement audit trail
    const movement = await StockMovement.create(
      {
        productVariantId: product_variant_id,
        product_variant_id,
        userId,
        user_id: userId,
        type,
        quantity: qty,
        balanceAfter: newStock,
        balance_after: newStock,
        reason: reason || 'Manual stock adjustment',
      },
      { transaction: t }
    );

    // If new stock is low, generate alert
    if (newStock <= 5) {
      await Notification.create(
        {
          userId,
          user_id: userId,
          title: 'Low Stock Alert',
          message: `Product variant (ID: ${product_variant_id}) is down to ${newStock} units.`,
          type: 'inventory',
          metadata: { variant_id: product_variant_id, current_stock: newStock },
        },
        { transaction: t }
      );
    }

    return {
      inventory,
      movement,
    };
  });
};

/**
 * Get movement history for a variant
 */
const getStockMovements = async (variantId) => {
  return await StockMovement.findAll({
    where: { product_variant_id: variantId },
    order: [['created_at', 'DESC']],
  });
};

module.exports = {
  getAllInventory,
  getLowStockInventory,
  getInventoryByVariant,
  adjustStock,
  getStockMovements,
};
