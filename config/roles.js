// config/roles.js – System Role Constants & Registration Rules
// -------------------------------------------------------------
// Defines the 5 supported user roles and policies for public registration.

const ROLES = {
  CUSTOMER: 'customer',
  BUSINESS: 'business',
  SUPPLIER: 'supplier',
  ADMIN: 'admin',
  DELIVERY: 'delivery',
};

// All valid system roles
const ALL_ROLES = Object.values(ROLES);

// Roles eligible for public self-registration
const PUBLIC_REGISTRATION_ROLES = [
  ROLES.CUSTOMER,
  ROLES.BUSINESS,
  ROLES.SUPPLIER,
];

// Roles restricted to creation by administrators only
const RESTRICTED_ROLES = [
  ROLES.ADMIN,
  ROLES.DELIVERY,
];

/**
 * Validates if a role is permitted for public registration
 * @param {string} role - The requested role
 * @returns {boolean}
 */
const isPublicRole = (role) => {
  return PUBLIC_REGISTRATION_ROLES.includes(role);
};

module.exports = {
  ROLES,
  ALL_ROLES,
  PUBLIC_REGISTRATION_ROLES,
  RESTRICTED_ROLES,
  isPublicRole,
};

