// services/productService.js – Product & Category Business Logic
// -------------------------------------------------------------

const { Op } = require('sequelize');
const { sequelize, Category, Product, ProductVariant, Inventory } = require('../models');

// ==========================================
// Category Operations
// ==========================================

const getAllCategories = async () => {
  return await Category.findAll({
    where: { is_active: true },
    order: [['name', 'ASC']],
  });
};

const getCategoryById = async (id) => {
  const category = await Category.findByPk(id);
  if (!category) {
    const error = new Error('Category not found');
    error.statusCode = 404;
    throw error;
  }
  return category;
};

const createCategory = async ({ name, slug, description }) => {
  const generatedSlug = (slug || name).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

  const existing = await Category.findOne({
    where: {
      [Op.or]: [{ name }, { slug: generatedSlug }],
    },
  });

  if (existing) {
    const error = new Error('A category with this name or slug already exists.');
    error.statusCode = 409;
    throw error;
  }

  return await Category.create({
    name,
    slug: generatedSlug,
    description: description || null,
    is_active: true,
  });
};

const updateCategory = async (id, { name, description, is_active }) => {
  const category = await getCategoryById(id);

  if (name && name !== category.name) {
    const conflict = await Category.findOne({ where: { name } });
    if (conflict && conflict.id !== Number(id)) {
      const error = new Error('Another category already uses this name.');
      error.statusCode = 409;
      throw error;
    }
    category.name = name;
  }

  if (description !== undefined) category.description = description;
  if (is_active !== undefined) category.is_active = is_active;

  await category.save();
  return category;
};

const deleteCategory = async (id) => {
  const category = await getCategoryById(id);

  // Check if any products reference this category
  const productCount = await Product.count({ where: { category_id: id } });
  if (productCount > 0) {
    // Soft deactivation to protect referential integrity
    category.is_active = false;
    await category.save();
    return {
      message: 'Category contains active products. Deactivated category instead of deleting.',
      deactivated: true,
    };
  }

  await category.destroy();
  return { message: 'Category deleted successfully.', deleted: true };
};

// ==========================================
// Product Operations
// ==========================================

const getProducts = async ({ page = 1, limit = 10, search, category_id, sortBy, include_inactive }) => {
  const offset = (Math.max(1, parseInt(page, 10)) - 1) * Math.max(1, parseInt(limit, 10));
  const take = Math.min(100, Math.max(1, parseInt(limit, 10)));

  const where = {};
  if (include_inactive !== 'true' && include_inactive !== true) {
    where.is_active = true;
  }

  // Search filter
  if (search && search.trim() !== '') {
    where[Op.or] = [
      { name: { [Op.iLike]: `%${search.trim()}%` } },
      { description: { [Op.iLike]: `%${search.trim()}%` } },
    ];
  }

  // Category filter
  if (category_id) {
    where.category_id = category_id;
  }

  // Sorting
  let order = [['created_at', 'DESC']];
  if (sortBy === 'name:asc') order = [['name', 'ASC']];
  else if (sortBy === 'name:desc') order = [['name', 'DESC']];
  else if (sortBy === 'oldest') order = [['created_at', 'ASC']];

  const { rows: products, count: total } = await Product.findAndCountAll({
    where,
    limit: take,
    offset,
    order,
    distinct: true,
    include: [
      {
        model: Category,
        as: 'category',
        attributes: ['id', 'name', 'slug'],
      },
      {
        model: ProductVariant,
        as: 'variants',
        where: { is_active: true },
        required: false,
        include: [
          {
            model: Inventory,
            as: 'inventory',
            attributes: ['quantity'],
          },
        ],
      },
    ],
  });

  return {
    products,
    total,
    page: parseInt(page, 10),
    totalPages: Math.ceil(total / take) || 1,
    limit: take,
  };
};

const getProductById = async (id) => {
  const product = await Product.findByPk(id, {
    include: [
      {
        model: Category,
        as: 'category',
        attributes: ['id', 'name', 'slug', 'description'],
      },
      {
        model: ProductVariant,
        as: 'variants',
        include: [
          {
            model: Inventory,
            as: 'inventory',
            attributes: ['id', 'quantity'],
          },
        ],
      },
    ],
  });

  if (!product) {
    const error = new Error('Product not found');
    error.statusCode = 404;
    throw error;
  }

  return product;
};

const createProduct = async ({ category_id, name, description, image_url, imageUrl, base_price, sku, variants = [] }) => {
  // Verify category exists
  await getCategoryById(category_id);

  const img = image_url || imageUrl || null;

  // Build standard variants if empty
  let finalVariants = variants;
  if (!Array.isArray(finalVariants) || finalVariants.length === 0) {
    const priceVal = parseFloat(base_price) || 45.00;
    const baseSku = sku || `SKU-${Date.now().toString().slice(-4)}`;
    finalVariants = [
      { sku: `${baseSku}-S`, size: 'S', color: 'Standard', price: priceVal, initial_stock: 5000 },
      { sku: `${baseSku}-M`, size: 'M', color: 'Standard', price: priceVal, initial_stock: 5000 },
      { sku: `${baseSku}-L`, size: 'L', color: 'Standard', price: priceVal, initial_stock: 5000 },
    ];
  }

  // Validate SKUs upfront
  for (const v of finalVariants) {
    if (v.sku) {
      const existingSku = await ProductVariant.findOne({ where: { sku: v.sku } });
      if (existingSku) {
        const error = new Error(`SKU '${v.sku}' is already taken.`);
        error.statusCode = 409;
        throw error;
      }
    }
  }

  const productId = await sequelize.transaction(async (t) => {
    // 1. Create base product with imageUrl
    const product = await Product.create(
      {
        categoryId: category_id,
        category_id,
        name,
        description: description || null,
        imageUrl: img,
        image_url: img,
        is_active: true,
      },
      { transaction: t }
    );

    // 2. Create variants & initialize inventory
    for (const v of finalVariants) {
      const vSku = v.sku || `SKU-${product.id}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      const variant = await ProductVariant.create(
        {
          productId: product.id,
          product_id: product.id,
          sku: vSku,
          size: v.size || 'Regular',
          color: v.color || 'Standard',
          price: v.price || 0.00,
          compareAtPrice: v.compare_at_price || null,
          costPrice: v.cost_price || null,
          isActive: true,
        },
        { transaction: t }
      );

      // Initialize inventory record for variant
      await Inventory.create(
        {
          productVariantId: variant.id,
          product_variant_id: variant.id,
          quantity: v.initial_stock !== undefined ? v.initial_stock : 5000,
        },
        { transaction: t }
      );
    }

    return product.id;
  });

  return await getProductById(productId);
};

const updateProduct = async (id, { category_id, name, description, image_url, imageUrl, base_price, is_active }) => {
  const product = await getProductById(id);

  if (category_id !== undefined) {
    await getCategoryById(category_id);
    product.categoryId = category_id;
    product.category_id = category_id;
  }
  if (name !== undefined) product.name = name;
  if (description !== undefined) product.description = description;
  if (image_url !== undefined || imageUrl !== undefined) {
    const img = image_url !== undefined ? image_url : imageUrl;
    product.imageUrl = img;
    product.image_url = img;
  }
  if (is_active !== undefined) product.isActive = is_active;

  await product.save();

  // If base_price provided, update variant prices
  if (base_price !== undefined) {
    const priceVal = parseFloat(base_price);
    if (!isNaN(priceVal)) {
      await ProductVariant.update(
        { price: priceVal },
        { where: { product_id: product.id } }
      );
    }
  }

  return await getProductById(id);
};

const deleteProduct = async (id) => {
  const product = await getProductById(id);
  product.isActive = false;
  await product.save();
  return { message: 'Product deactivated successfully.', product_id: product.id };
};

module.exports = {
  getAllCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
};
