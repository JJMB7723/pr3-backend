// services/supplierService.js – Business & Supplier Profile Management
// ---------------------------------------------------------------------

const {
  User,
  BusinessProfile,
  SupplierProfile,
} = require('../models');

/**
 * Get profile for authenticated business or supplier user
 */
const getMyProfile = async (userId, userRole) => {
  if (userRole === 'business') {
    let profile = await BusinessProfile.findOne({ where: { user_id: userId } });
    if (!profile) {
      // Initialize blank profile if not yet created
      const user = await User.findByPk(userId);
      profile = await BusinessProfile.create({
        userId,
        user_id: userId,
        companyName: `${user.firstName}'s Enterprise`,
        company_name: `${user.firstName}'s Enterprise`,
      });
    }
    return { role: 'business', profile };
  }

  if (userRole === 'supplier') {
    let profile = await SupplierProfile.findOne({ where: { user_id: userId } });
    if (!profile) {
      const user = await User.findByPk(userId);
      profile = await SupplierProfile.create({
        userId,
        user_id: userId,
        companyName: `${user.firstName}'s Wholesale`,
        company_name: `${user.firstName}'s Wholesale`,
        supplierCode: `SUP-${Date.now().toString().slice(-4)}`,
        supplier_code: `SUP-${Date.now().toString().slice(-4)}`,
      });
    }
    return { role: 'supplier', profile };
  }

  const error = new Error('You do not have a business or supplier account.');
  error.statusCode = 400;
  throw error;
};

/**
 * Update profile for authenticated business or supplier user
 */
const updateMyProfile = async (userId, userRole, data) => {
  if (userRole === 'business') {
    const { role, profile } = await getMyProfile(userId, userRole);
    if (data.company_name) {
      profile.companyName = data.company_name;
      profile.company_name = data.company_name;
    }
    if (data.registration_number !== undefined) profile.registration_number = data.registration_number;
    if (data.tax_id !== undefined) profile.tax_id = data.tax_id;
    if (data.phone !== undefined) profile.phone = data.phone;
    if (data.address !== undefined) profile.address = data.address;
    if (data.city !== undefined) profile.city = data.city;

    await profile.save();
    return { role, profile };
  }

  if (userRole === 'supplier') {
    const { role, profile } = await getMyProfile(userId, userRole);
    if (data.company_name) {
      profile.companyName = data.company_name;
      profile.company_name = data.company_name;
    }
    if (data.contact_person !== undefined) profile.contact_person = data.contact_person;
    if (data.phone !== undefined) profile.phone = data.phone;
    if (data.email !== undefined) profile.email = data.email;
    if (data.payment_terms !== undefined) profile.payment_terms = data.payment_terms;

    await profile.save();
    return { role, profile };
  }

  const error = new Error('Only business and supplier users can update profile details.');
  error.statusCode = 403;
  throw error;
};

/**
 * Admin list all registered suppliers
 */
const getAllSuppliers = async () => {
  return await SupplierProfile.findAll({
    include: [
      {
        model: User,
        as: 'user',
        attributes: ['id', 'first_name', 'last_name', 'email'],
      },
    ],
    order: [['created_at', 'DESC']],
  });
};

/**
 * Get supplier details by ID
 */
const getSupplierById = async (id) => {
  const supplier = await SupplierProfile.findByPk(id, {
    include: [
      {
        model: User,
        as: 'user',
        attributes: ['id', 'first_name', 'last_name', 'email'],
      },
    ],
  });

  if (!supplier) {
    const error = new Error('Supplier not found.');
    error.statusCode = 404;
    throw error;
  }

  return supplier;
};

module.exports = {
  getMyProfile,
  updateMyProfile,
  getAllSuppliers,
  getSupplierById,
};
