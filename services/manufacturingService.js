// services/manufacturingService.js – Manufacturing, Production & Quality Control
// -------------------------------------------------------------------------------

const {
  sequelize,
  ManufacturingOrder,
  ProductionRecord,
  QualityInspection,
  Product,
  ProductVariant,
  Inventory,
  StockMovement,
  User,
  Notification,
} = require('../models');

// ==========================================
// 1. Manufacturing Orders (Phase 10)
// ==========================================

const createManufacturingOrder = async ({
  product_id,
  product_variant_id,
  target_quantity,
  raw_materials,
  assigned_worker_id,
  start_date,
  completion_date,
  notes,
}) => {
  const qty = parseInt(target_quantity, 10);
  if (isNaN(qty) || qty <= 0) {
    const error = new Error('Target quantity must be a positive integer.');
    error.statusCode = 400;
    throw error;
  }

  const product = await Product.findByPk(product_id);
  if (!product) {
    const error = new Error('Product not found.');
    error.statusCode = 404;
    throw error;
  }

  const variant = await ProductVariant.findByPk(product_variant_id);
  if (!variant) {
    const error = new Error('Product variant not found.');
    error.statusCode = 404;
    throw error;
  }

  const totalCount = await ManufacturingOrder.count();
  const orderNumber = `PR3-MFG-${1000 + totalCount + 1}`;

  const order = await ManufacturingOrder.create({
    orderNumber,
    order_number: orderNumber,
    productId: product_id,
    product_id,
    productVariantId: product_variant_id,
    product_variant_id,
    targetQuantity: qty,
    target_quantity: qty,
    status: 'pending',
    rawMaterials: raw_materials || null,
    raw_materials: raw_materials || null,
    assignedWorkerId: assigned_worker_id || null,
    assigned_worker_id: assigned_worker_id || null,
    startDate: start_date || new Date(),
    start_date: start_date || new Date(),
    completionDate: completion_date || null,
    completion_date: completion_date || null,
    notes: notes || null,
  });

  return await getManufacturingOrderById(order.id);
};

const getManufacturingOrders = async () => {
  return await ManufacturingOrder.findAll({
    include: [
      { model: Product, as: 'product', attributes: ['id', 'name', 'imageUrl', 'image_url'] },
      { model: ProductVariant, as: 'variant', attributes: ['id', 'sku', 'size', 'color', 'price'] },
      { model: User, as: 'assigned_worker', attributes: ['id', 'firstName', 'lastName', 'first_name', 'last_name'] },
      { model: ProductionRecord, as: 'production_records' },
      { model: QualityInspection, as: 'quality_inspections' },
    ],
    order: [['created_at', 'DESC']],
  });
};

const getManufacturingOrderById = async (id) => {
  const order = await ManufacturingOrder.findByPk(id, {
    include: [
      { model: Product, as: 'product' },
      { model: ProductVariant, as: 'variant' },
      { model: User, as: 'assigned_worker', attributes: ['id', 'firstName', 'lastName', 'first_name', 'last_name', 'email'] },
      { model: ProductionRecord, as: 'production_records' },
      { model: QualityInspection, as: 'quality_inspections' },
    ],
  });

  if (!order) {
    const error = new Error('Manufacturing order not found.');
    error.statusCode = 404;
    throw error;
  }

  return order;
};

const updateManufacturingStatus = async (id, status, userId = null) => {
  let normalizedStatus = status;
  if (normalizedStatus === 'working') normalizedStatus = 'in_progress';
  if (normalizedStatus === 'finished') normalizedStatus = 'completed';

  const allowed = ['pending', 'in_progress', 'completed', 'cancelled'];
  if (!allowed.includes(normalizedStatus)) {
    const error = new Error(`Invalid status. Permitted values: ${allowed.join(', ')}`);
    error.statusCode = 400;
    throw error;
  }

  const order = await getManufacturingOrderById(id);
  const previousStatus = order.status;

  return await sequelize.transaction(async (t) => {
    order.status = normalizedStatus;

    if (normalizedStatus === 'completed') {
      order.completionDate = new Date();
      order.completion_date = new Date();

      // AUTOMATED INVENTORY LINKAGE: When finished/completed, add batch items to warehouse stock
      if (previousStatus !== 'completed') {
        const variantId = order.productVariantId || order.product_variant_id;
        let inventory = await Inventory.findOne({
          where: { product_variant_id: variantId },
          transaction: t,
        });

        if (!inventory) {
          inventory = await Inventory.create(
            {
              productVariantId: variantId,
              product_variant_id: variantId,
              quantity: 0,
            },
            { transaction: t }
          );
        }

        const addUnits = parseInt(order.targetQuantity || order.target_quantity || 0, 10);
        const newTotalStock = inventory.quantity + addUnits;
        inventory.quantity = newTotalStock;
        await inventory.save({ transaction: t });

        // Record stock movement audit trail
        await StockMovement.create(
          {
            productVariantId: variantId,
            product_variant_id: variantId,
            userId: userId || order.assignedWorkerId || null,
            user_id: userId || order.assignedWorkerId || null,
            type: 'production',
            quantity: addUnits,
            balanceAfter: newTotalStock,
            balance_after: newTotalStock,
            referenceType: 'manufacturing_order',
            reference_type: 'manufacturing_order',
            referenceId: order.id,
            reference_id: order.id,
            reason: `Batch #${order.orderNumber || order.order_number} completed: ${addUnits} units manufactured and added to warehouse inventory`,
          },
          { transaction: t }
        );

        // Notify
        const notifyUserId = userId || order.assignedWorkerId || 95;
        await Notification.create(
          {
            userId: notifyUserId,
            user_id: notifyUserId,
            title: 'Batch Finished & Inventory Credited',
            message: `Manufacturing Batch #${order.orderNumber || order.order_number} for ${order.product?.name || 'Garment'} (${addUnits} units) completed and stocked into warehouse inventory.`,
            type: 'manufacturing',
            metadata: {
              manufacturing_order_id: order.id,
              added_quantity: addUnits,
              new_stock: newTotalStock,
            },
          },
          { transaction: t }
        );
      }
    }

    await order.save({ transaction: t });
    return order;
  });
};

// ==========================================
// 2. Production Stage Records (Phase 11)
// ==========================================

const logProductionStage = async ({
  manufacturing_order_id,
  stage,
  quantity_processed,
  worker_id,
  notes,
}) => {
  const order = await getManufacturingOrderById(manufacturing_order_id);
  const qty = parseInt(quantity_processed, 10);
  if (isNaN(qty) || qty <= 0) {
    const error = new Error('Quantity processed must be a positive integer.');
    error.statusCode = 400;
    throw error;
  }

  // Update order to 'working' if it was pending
  if (order.status === 'pending') {
    order.status = 'working';
    await order.save();
  }

  const record = await ProductionRecord.create({
    manufacturingOrderId: manufacturing_order_id,
    manufacturing_order_id,
    stage,
    quantityProcessed: qty,
    quantity_processed: qty,
    workerId: worker_id || null,
    worker_id: worker_id || null,
    status: 'completed',
    notes: notes || null,
  });

  return record;
};

// ==========================================
// 3. Quality Inspection & Inventory Transfer (Phase 12)
// ==========================================

const recordQualityInspection = async (inspectorId, {
  manufacturing_order_id,
  total_inspected,
  approved_quantity,
  rejected_quantity = 0,
  defect_details,
  notes,
}) => {
  const order = await getManufacturingOrderById(manufacturing_order_id);

  const inspected = parseInt(total_inspected, 10);
  const approved = parseInt(approved_quantity, 10);
  const rejected = parseInt(rejected_quantity, 10);

  if (isNaN(inspected) || isNaN(approved)) {
    const error = new Error('Total inspected and approved quantity must be valid numbers.');
    error.statusCode = 400;
    throw error;
  }

  if (approved + rejected !== inspected) {
    const error = new Error('Approved quantity + rejected quantity must equal total inspected.');
    error.statusCode = 400;
    throw error;
  }

  const status = rejected === 0 ? 'passed' : approved > 0 ? 'partially_passed' : 'failed';

  // Execute Quality Inspection and Stock Transfer inside a Transaction
  return await sequelize.transaction(async (t) => {
    // 1. Create QC inspection record
    const inspection = await QualityInspection.create(
      {
        manufacturingOrderId: manufacturing_order_id,
        manufacturing_order_id,
        productVariantId: order.product_variant_id,
        product_variant_id: order.product_variant_id,
        inspectorId,
        inspector_id: inspectorId,
        totalInspected: inspected,
        total_inspected: inspected,
        approvedQuantity: approved,
        approved_quantity: approved,
        rejectedQuantity: rejected,
        rejected_quantity: rejected,
        status,
        defectDetails: defect_details || null,
        defect_details: defect_details || null,
        inventoryUpdated: approved > 0,
        inventory_updated: approved > 0,
        notes: notes || null,
      },
      { transaction: t }
    );

    // 2. ONLY approved quantities are added to sellable inventory
    if (approved > 0) {
      let inventory = await Inventory.findOne({
        where: { product_variant_id: order.product_variant_id },
        transaction: t,
      });

      if (!inventory) {
        inventory = await Inventory.create(
          {
            productVariantId: order.product_variant_id,
            product_variant_id: order.product_variant_id,
            quantity: 0,
          },
          { transaction: t }
        );
      }

      const newStock = inventory.quantity + approved;
      inventory.quantity = newStock;
      await inventory.save({ transaction: t });

      // Audit trail in stock movements
      await StockMovement.create(
        {
          productVariantId: order.product_variant_id,
          product_variant_id: order.product_variant_id,
          userId: inspectorId,
          user_id: inspectorId,
          type: 'production_in',
          quantity: approved,
          balanceAfter: newStock,
          balance_after: newStock,
          referenceType: 'manufacturing_order',
          reference_type: 'manufacturing_order',
          referenceId: order.id,
          reference_id: order.id,
          reason: `QC Inspection Approved for Work Order #${order.order_number}`,
        },
        { transaction: t }
      );
    }

    // Mark manufacturing order completed if approved target is met
    if (approved >= order.target_quantity) {
      order.status = 'completed';
      order.completionDate = new Date();
      order.completion_date = new Date();
      await order.save({ transaction: t });
    }

    return inspection;
  });
};

module.exports = {
  createManufacturingOrder,
  getManufacturingOrders,
  getManufacturingOrderById,
  updateManufacturingStatus,
  logProductionStage,
  recordQualityInspection,
};

