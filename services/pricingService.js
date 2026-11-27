// services/pricingService.js – Pricing Calculations & Discounts (Helper)
// ----------------------------------------------------------------------
// Helper service for promotional coupons, discounts, and order total calculations.

const { Coupon } = require('../models');

/**
 * Validate a coupon code against an order subtotal and compute the discount.
 * @param {string} rawCode
 * @param {number} subtotal
 * @param {import('sequelize').Transaction} [transaction]
 */
const validateCoupon = async (rawCode, subtotal, transaction = null) => {
  const code = (rawCode || '').trim().toUpperCase();
  if (!code) {
    const err = new Error('Please enter a coupon code.');
    err.statusCode = 400;
    throw err;
  }

  const coupon = await Coupon.findOne({
    where: { code },
    transaction: transaction || undefined,
  });

  if (!coupon || !coupon.isActive) {
    const err = new Error(`Invalid or inactive coupon code '${code}'.`);
    err.statusCode = 400;
    throw err;
  }

  if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date()) {
    const err = new Error(`Coupon '${code}' has expired.`);
    err.statusCode = 400;
    throw err;
  }

  if (coupon.usageLimit !== null && coupon.usedCount >= coupon.usageLimit) {
    const err = new Error(`Coupon '${code}' has reached its usage limit.`);
    err.statusCode = 400;
    throw err;
  }

  const numericSubtotal = parseFloat(subtotal) || 0;
  const minOrder = parseFloat(coupon.minOrderAmount) || 0;
  if (numericSubtotal < minOrder) {
    const err = new Error(
      `Coupon '${code}' requires a minimum order of $${minOrder.toFixed(2)}.`
    );
    err.statusCode = 400;
    throw err;
  }

  const discountVal = parseFloat(coupon.discountValue) || 0;
  let discountAmount = 0;

  if (coupon.discountType === 'percentage') {
    discountAmount = (numericSubtotal * discountVal) / 100;
    if (coupon.maxDiscountAmount !== null && coupon.maxDiscountAmount !== undefined) {
      const cap = parseFloat(coupon.maxDiscountAmount);
      if (discountAmount > cap) discountAmount = cap;
    }
  } else {
    discountAmount = discountVal;
  }

  // Never let discount exceed subtotal
  discountAmount = Math.min(numericSubtotal, Math.max(0, discountAmount));
  discountAmount = parseFloat(discountAmount.toFixed(2));
  const finalTotal = parseFloat(Math.max(0, numericSubtotal - discountAmount).toFixed(2));

  return {
    coupon,
    code: coupon.code,
    description: coupon.description,
    discountType: coupon.discountType,
    discountValue: discountVal,
    subtotal: parseFloat(numericSubtotal.toFixed(2)),
    discountAmount,
    finalTotal,
  };
};

module.exports = {
  validateCoupon,
};
