// models/index.js – Central Models & Associations Hub
// -----------------------------------------------------
// Exports all 13 models and defines their exact Sequelize associations

const { sequelize } = require('../config/database');

// Import all active models
const User = require('./User');
const Category = require('./Category');
const Product = require('./Product');
const ProductVariant = require('./ProductVariant');
const Inventory = require('./Inventory');
const Cart = require('./Cart');
const CartItem = require('./CartItem');
const Order = require('./Order');
const OrderItem = require('./OrderItem');
const Payment = require('./Payment');
const Delivery = require('./Delivery');
const ReturnRequest = require('./ReturnRequest');
const ReturnItem = require('./ReturnItem');
const BusinessProfile = require('./BusinessProfile');
const SupplierProfile = require('./SupplierProfile');
const StockMovement = require('./StockMovement');
const ManufacturingOrder = require('./ManufacturingOrder');
const ProductionRecord = require('./ProductionRecord');
const QualityInspection = require('./QualityInspection');
const Notification = require('./Notification');

// ==========================================
// 1. Categories & Products
// ==========================================
// A category can have multiple products
Category.hasMany(Product, {
  foreignKey: 'category_id',
  as: 'products',
  onDelete: 'RESTRICT',
  onUpdate: 'CASCADE',
});
Product.belongsTo(Category, {
  foreignKey: 'category_id',
  as: 'category',
});

// A product can have multiple variants (sizes & colors)
Product.hasMany(ProductVariant, {
  foreignKey: 'product_id',
  as: 'variants',
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE',
});
ProductVariant.belongsTo(Product, {
  foreignKey: 'product_id',
  as: 'product',
});

// A product variant has one inventory record
ProductVariant.hasOne(Inventory, {
  foreignKey: 'product_variant_id',
  as: 'inventory',
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE',
});
Inventory.belongsTo(ProductVariant, {
  foreignKey: 'product_variant_id',
  as: 'variant',
});

// ==========================================
// 2. Users, Carts & Cart Items
// ==========================================
// A user can have carts
User.hasMany(Cart, {
  foreignKey: 'user_id',
  as: 'carts',
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE',
});
Cart.belongsTo(User, {
  foreignKey: 'user_id',
  as: 'user',
});

// A cart contains multiple cart items
Cart.hasMany(CartItem, {
  foreignKey: 'cart_id',
  as: 'items',
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE',
});
CartItem.belongsTo(Cart, {
  foreignKey: 'cart_id',
  as: 'cart',
});

// A product variant can be in many cart items
ProductVariant.hasMany(CartItem, {
  foreignKey: 'product_variant_id',
  as: 'cart_items',
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE',
});
CartItem.belongsTo(ProductVariant, {
  foreignKey: 'product_variant_id',
  as: 'product_variant',
});

// ==========================================
// 3. Orders & Order Items
// ==========================================
// A user can place multiple orders
User.hasMany(Order, {
  foreignKey: 'user_id',
  as: 'orders',
  onDelete: 'RESTRICT',
  onUpdate: 'CASCADE',
});
Order.belongsTo(User, {
  foreignKey: 'user_id',
  as: 'user',
});

// An order contains multiple order items
Order.hasMany(OrderItem, {
  foreignKey: 'order_id',
  as: 'order_items',
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE',
});
OrderItem.belongsTo(Order, {
  foreignKey: 'order_id',
  as: 'order',
});

// A product variant can appear in multiple order items
ProductVariant.hasMany(OrderItem, {
  foreignKey: 'product_variant_id',
  as: 'order_items',
  onDelete: 'RESTRICT',
  onUpdate: 'CASCADE',
});
OrderItem.belongsTo(ProductVariant, {
  foreignKey: 'product_variant_id',
  as: 'product_variant',
});

// ==========================================
// 4. Payments & Deliveries
// ==========================================
// An order can have multiple payment attempts/records
Order.hasMany(Payment, {
  foreignKey: 'order_id',
  as: 'payments',
  onDelete: 'RESTRICT',
  onUpdate: 'CASCADE',
});
Payment.belongsTo(Order, {
  foreignKey: 'order_id',
  as: 'order',
});

// An order has one delivery record
Order.hasOne(Delivery, {
  foreignKey: 'order_id',
  as: 'delivery',
  onDelete: 'RESTRICT',
  onUpdate: 'CASCADE',
});
Delivery.belongsTo(Order, {
  foreignKey: 'order_id',
  as: 'order',
});

// Delivery staff member is assigned to fulfill deliveries
User.hasMany(Delivery, {
  foreignKey: 'delivery_staff_id',
  as: 'deliveries',
  onDelete: 'SET NULL',
  onUpdate: 'CASCADE',
});
Delivery.belongsTo(User, {
  foreignKey: 'delivery_staff_id',
  as: 'delivery_staff',
});

// ==========================================
// 5. Return Requests & Return Items
// ==========================================
// An order can have return requests
Order.hasMany(ReturnRequest, {
  foreignKey: 'order_id',
  as: 'return_requests',
  onDelete: 'RESTRICT',
  onUpdate: 'CASCADE',
});
ReturnRequest.belongsTo(Order, {
  foreignKey: 'order_id',
  as: 'order',
});

// A user can submit return requests
User.hasMany(ReturnRequest, {
  foreignKey: 'user_id',
  as: 'return_requests',
  onDelete: 'RESTRICT',
  onUpdate: 'CASCADE',
});
ReturnRequest.belongsTo(User, {
  foreignKey: 'user_id',
  as: 'user',
});

// A return request can contain multiple return items
ReturnRequest.hasMany(ReturnItem, {
  foreignKey: 'return_request_id',
  as: 'return_items',
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE',
});
ReturnItem.belongsTo(ReturnRequest, {
  foreignKey: 'return_request_id',
  as: 'return_request',
});

// An order item can be referenced in return items
OrderItem.hasMany(ReturnItem, {
  foreignKey: 'order_item_id',
  as: 'return_items',
  onDelete: 'RESTRICT',
  onUpdate: 'CASCADE',
});
ReturnItem.belongsTo(OrderItem, {
  foreignKey: 'order_item_id',
  as: 'order_item',
});

// ==========================================
// 6. Business & Supplier Profiles
// ==========================================
User.hasOne(BusinessProfile, {
  foreignKey: 'user_id',
  as: 'business_profile',
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE',
});
BusinessProfile.belongsTo(User, {
  foreignKey: 'user_id',
  as: 'user',
});

User.hasOne(SupplierProfile, {
  foreignKey: 'user_id',
  as: 'supplier_profile',
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE',
});
SupplierProfile.belongsTo(User, {
  foreignKey: 'user_id',
  as: 'user',
});

// ==========================================
// 7. Stock Movements (Inventory Auditing)
// ==========================================
ProductVariant.hasMany(StockMovement, {
  foreignKey: 'product_variant_id',
  as: 'stock_movements',
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE',
});
StockMovement.belongsTo(ProductVariant, {
  foreignKey: 'product_variant_id',
  as: 'variant',
});
StockMovement.belongsTo(User, {
  foreignKey: 'user_id',
  as: 'user',
});

// ==========================================
// 8. Manufacturing, Production & Quality Control
// ==========================================
Product.hasMany(ManufacturingOrder, {
  foreignKey: 'product_id',
  as: 'manufacturing_orders',
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE',
});
ManufacturingOrder.belongsTo(Product, {
  foreignKey: 'product_id',
  as: 'product',
});
ManufacturingOrder.belongsTo(ProductVariant, {
  foreignKey: 'product_variant_id',
  as: 'variant',
});
ManufacturingOrder.belongsTo(User, {
  foreignKey: 'assigned_worker_id',
  as: 'assigned_worker',
});

ManufacturingOrder.hasMany(ProductionRecord, {
  foreignKey: 'manufacturing_order_id',
  as: 'production_records',
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE',
});
ProductionRecord.belongsTo(ManufacturingOrder, {
  foreignKey: 'manufacturing_order_id',
  as: 'manufacturing_order',
});
ProductionRecord.belongsTo(User, {
  foreignKey: 'worker_id',
  as: 'worker',
});

ManufacturingOrder.hasMany(QualityInspection, {
  foreignKey: 'manufacturing_order_id',
  as: 'quality_inspections',
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE',
});
QualityInspection.belongsTo(ManufacturingOrder, {
  foreignKey: 'manufacturing_order_id',
  as: 'manufacturing_order',
});
QualityInspection.belongsTo(ProductVariant, {
  foreignKey: 'product_variant_id',
  as: 'variant',
});
QualityInspection.belongsTo(User, {
  foreignKey: 'inspector_id',
  as: 'inspector',
});

// ==========================================
// 9. Notifications
// ==========================================
User.hasMany(Notification, {
  foreignKey: 'user_id',
  as: 'notifications',
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE',
});
Notification.belongsTo(User, {
  foreignKey: 'user_id',
  as: 'user',
});

// Export all 20 models and the sequelize instance
module.exports = {
  sequelize,
  User,
  Category,
  Product,
  ProductVariant,
  Inventory,
  Cart,
  CartItem,
  Order,
  OrderItem,
  Payment,
  Delivery,
  ReturnRequest,
  ReturnItem,
  BusinessProfile,
  SupplierProfile,
  StockMovement,
  ManufacturingOrder,
  ProductionRecord,
  QualityInspection,
  Notification,
};
