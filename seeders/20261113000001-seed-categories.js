'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const categories = [
      {
        name: 'Shirt',
        slug: 'shirt',
        description: 'Casual and formal shirts for men and women',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        name: 'Pant',
        slug: 'pant',
        description: 'Trousers, chinos, and pants',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        name: 'Shorts',
        slug: 'shorts',
        description: 'Comfortable casual and athletic shorts',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        name: 'Jersey',
        slug: 'jersey',
        description: 'Sports jerseys and athletic tops',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
    ];

    for (const cat of categories) {
      // Upsert/findOrCreate style to avoid duplicates
      const [existing] = await queryInterface.sequelize.query(
        `SELECT id FROM categories WHERE slug = :slug`,
        { replacements: { slug: cat.slug } }
      );

      if (existing.length === 0) {
        await queryInterface.bulkInsert('categories', [cat]);
      }
    }
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('categories', {
      slug: ['shirt', 'pant', 'shorts', 'jersey'],
    });
  },
};

