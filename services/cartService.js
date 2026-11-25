// services/cartService.js – Shopping Cart Business Logic
// -----------------------------------------------------

const { Cart, CartItem, ProductVariant, Product, Inventory } = require('../models');

/**
 * Helper: Find or create active cart for user
 */
const getOrCreateCart = async (userId) => {
  let cart = await Cart.findOne({
    where: { user_id: userId, status: 'active' },
  });

  if (!cart) {
    cart = await Cart.create({
      userId,
      user_id: userId,
      status: 'active',
    });
  }

  return cart;
};

/**
 * Get active cart for user with calculated totals & stock check
 */
const getCart = async (userId) => {
  const cart = await getOrCreateCart(userId);

  const cartWithItems = await Cart.findByPk(cart.id, {
    include: [
      {
        model: CartItem,
        as: 'items',
        include: [
          {
            model: ProductVariant,
            as: 'product_variant',
            include: [
              {
                model: Product,
                as: 'product',
                attributes: ['id', 'name', 'is_active'],
              },
              {
                model: Inventory,
                as: 'inventory',
                attributes: ['quantity'],
              },
            ],
          },
        ],
      },
    ],
    order: [[{ model: CartItem, as: 'items' }, 'created_at', 'ASC']],
  });

  let subtotal = 0;
  const items = (cartWithItems.items || []).map((item) => {
    const variant = item.product_variant;
    const price = variant ? parseFloat(variant.price) : 0;
    const itemTotal = price * item.quantity;
    subtotal += itemTotal;

    const availableStock = variant && variant.inventory ? variant.inventory.quantity : 0;

    return {
      id: item.id,
      variant_id: item.product_variant_id,
      product_name: variant && variant.product ? variant.product.name : 'Unknown Product',
      size: variant ? variant.size : null,
      color: variant ? variant.color : null,
      sku: variant ? variant.sku : null,
      unit_price: price,
      quantity: item.quantity,
      item_total: parseFloat(itemTotal.toFixed(2)),
      available_stock: availableStock,
      is_in_stock: availableStock >= item.quantity,
    };
  });

  return {
    cart_id: cart.id,
    user_id: userId,
    item_count: items.length,
    subtotal: parseFloat(subtotal.toFixed(2)),
    total: parseFloat(subtotal.toFixed(2)),
    items,
  };
};

/**
 * Add product variant to cart
 */
const addItemToCart = async (userId, { product_variant_id, quantity = 1 }, userRole = 'customer') => {
  const qty = parseInt(quantity, 10);
  if (isNaN(qty) || qty <= 0) {
    const error = new Error('Quantity must be a positive integer.');
    error.statusCode = 400;
    throw error;
  }

  // Retail customers are limited to a maximum of 50 units per line item
  if (userRole !== 'business' && userRole !== 'admin' && qty > 50) {
    const error = new Error('Retail customer orders are limited to a maximum of 50 units per item. For wholesale orders, please use Wholesale Bulk Ordering.');
    error.statusCode = 400;
    throw error;
  }

  // Verify variant exists and is active
  const variant = await ProductVariant.findByPk(product_variant_id, {
    include: [{ model: Inventory, as: 'inventory' }],
  });

  if (!variant || !variant.isActive) {
    const error = new Error('Product variant not found or is inactive.');
    error.statusCode = 404;
    throw error;
  }

  const stock = variant.inventory ? variant.inventory.quantity : 0;
  if (stock <= 0) {
    const error = new Error('Product variant is currently out of stock.');
    error.statusCode = 400;
    throw error;
  }

  const cart = await getOrCreateCart(userId);

  // Check if item already exists in cart
  let cartItem = await CartItem.findOne({
    where: {
      cart_id: cart.id,
      product_variant_id,
    },
  });

  if (cartItem) {
    const newQty = cartItem.quantity + qty;
    if (userRole !== 'business' && userRole !== 'admin' && newQty > 50) {
      const error = new Error('Retail customer orders are limited to a maximum of 50 units per item. For wholesale orders, please use Wholesale Bulk Ordering.');
      error.statusCode = 400;
      throw error;
    }
    if (newQty > stock) {
      const error = new Error(`Cannot add ${qty} more items. Available stock is ${stock}.`);
      error.statusCode = 400;
      throw error;
    }
    cartItem.quantity = newQty;
    await cartItem.save();
  } else {
    if (qty > stock) {
      const error = new Error(`Requested quantity exceeds available stock (${stock}).`);
      error.statusCode = 400;
      throw error;
    }
    cartItem = await CartItem.create({
      cartId: cart.id,
      cart_id: cart.id,
      productVariantId: product_variant_id,
      product_variant_id,
      quantity: qty,
    });
  }

  return await getCart(userId);
};

/**
 * Update cart item quantity
 */
const updateCartItemQuantity = async (userId, cartItemId, quantity, userRole = 'customer') => {
  const qty = parseInt(quantity, 10);
  if (isNaN(qty) || qty <= 0) {
    const error = new Error('Quantity must be at least 1.');
    error.statusCode = 400;
    throw error;
  }

  // Retail customers are limited to a maximum of 50 units per line item
  if (userRole !== 'business' && userRole !== 'admin' && qty > 50) {
    const error = new Error('Retail customer orders are limited to a maximum of 50 units per item. For wholesale orders, please use Wholesale Bulk Ordering.');
    error.statusCode = 400;
    throw error;
  }

  const cart = await getOrCreateCart(userId);

  const cartItem = await CartItem.findOne({
    where: { id: cartItemId, cart_id: cart.id },
    include: [
      {
        model: ProductVariant,
        as: 'product_variant',
        include: [{ model: Inventory, as: 'inventory' }],
      },
    ],
  });

  if (!cartItem) {
    const error = new Error('Cart item not found.');
    error.statusCode = 404;
    throw error;
  }

  const stock = cartItem.product_variant && cartItem.product_variant.inventory
    ? cartItem.product_variant.inventory.quantity
    : 0;

  if (qty > stock) {
    const error = new Error(`Requested quantity (${qty}) exceeds available stock (${stock}).`);
    error.statusCode = 400;
    throw error;
  }

  cartItem.quantity = qty;
  await cartItem.save();

  return await getCart(userId);
};

/**
 * Remove an item from cart
 */
const removeCartItem = async (userId, cartItemId) => {
  const cart = await getOrCreateCart(userId);

  const cartItem = await CartItem.findOne({
    where: { id: cartItemId, cart_id: cart.id },
  });

  if (!cartItem) {
    const error = new Error('Cart item not found.');
    error.statusCode = 404;
    throw error;
  }

  await cartItem.destroy();
  return await getCart(userId);
};

/**
 * Clear all items in user's cart
 */
const clearCart = async (userId) => {
  const cart = await getOrCreateCart(userId);
  await CartItem.destroy({ where: { cart_id: cart.id } });
  return { message: 'Cart cleared successfully.' };
};

module.exports = {
  getCart,
  addItemToCart,
  updateCartItemQuantity,
  removeCartItem,
  clearCart,
};
