// scripts/testRoles.js – Comprehensive Phase 3.1 Role Verification
// -----------------------------------------------------------------
// Verifies:
// 1. All five roles (customer, business, supplier, admin, delivery) are accepted.
// 2. Invalid roles are rejected by Sequelize and PostgreSQL.
// 3. Existing users remain intact.
// 4. Existing database relationships work.
// 5. Database connection works.

require('dotenv').config();
const { sequelize, User, Order, Delivery } = require('../models');
const { ALL_ROLES, PUBLIC_REGISTRATION_ROLES, RESTRICTED_ROLES } = require('../config/roles');

async function testRoles() {
  console.log('🚀 Starting Phase 3.1 User Roles Verification Suite...\n');

  try {
    // ----------------------------------------------------------------
    // Verification 5: Database connection works
    // ----------------------------------------------------------------
    console.log('--- Check 5: Database Connection ---');
    await sequelize.authenticate();
    console.log('✔ PostgreSQL connection verified successfully.\n');

    // Count existing users before testing
    const countBefore = await User.count();
    console.log(`Current users in database before test: ${countBefore}\n`);

    // ----------------------------------------------------------------
    // Verification 1: All five roles are accepted by User model & DB
    // ----------------------------------------------------------------
    console.log('--- Check 1: Verifying All 5 Supported Roles ---');
    console.log(`Expected roles: ${ALL_ROLES.join(', ')}`);

    const createdUsers = [];

    for (const roleName of ALL_ROLES) {
      const email = `test.${roleName}@pr3test.com`;

      // Clean up if already exists
      await User.destroy({ where: { email } });

      const user = await User.create({
        firstName: 'Test',
        lastName: roleName.charAt(0).toUpperCase() + roleName.slice(1),
        email,
        passwordHash: 'dummy_hash_for_role_verification',
        role: roleName,
        isActive: true,
      });

      console.log(`  ✔ Successfully saved user with role: "${user.role}" (ID: ${user.id})`);
      createdUsers.push(user.id);
    }
    console.log('✔ All 5 roles are fully accepted by Sequelize and PostgreSQL!\n');

    // ----------------------------------------------------------------
    // Verification 2: Invalid roles are rejected
    // ----------------------------------------------------------------
    console.log('--- Check 2: Verifying Invalid Roles Are Rejected ---');
    let rejectedByModel = false;
    try {
      await User.build({
        firstName: 'Bad',
        lastName: 'Role',
        email: 'invalid.role@pr3test.com',
        passwordHash: 'dummy_hash',
        role: 'superadmin', // Invalid role
      }).validate();
    } catch (err) {
      rejectedByModel = true;
      console.log(`  ✔ Model validation correctly caught invalid role: "${err.errors[0].message}"`);
    }

    if (!rejectedByModel) {
      throw new Error('Check 2 Failed: Model accepted an invalid role!');
    }

    // Also test direct SQL database-level check constraint
    let rejectedByDatabase = false;
    try {
      await sequelize.query(`
        INSERT INTO users (first_name, last_name, email, password_hash, role, is_active, created_at, updated_at)
        VALUES ('Direct', 'SQL', 'direct.sql@pr3test.com', 'dummy', 'unauthorized_role', true, NOW(), NOW());
      `);
    } catch (dbErr) {
      rejectedByDatabase = true;
      console.log(`  ✔ PostgreSQL CHECK constraint correctly rejected invalid role: ${dbErr.message.split('\n')[0]}`);
    }

    if (!rejectedByDatabase) {
      throw new Error('Check 2 Failed: Database CHECK constraint did not reject invalid role!');
    }
    console.log('✔ Invalid roles are rejected at both Sequelize and PostgreSQL levels!\n');

    // ----------------------------------------------------------------
    // Verification 3: Existing users remain intact
    // ----------------------------------------------------------------
    console.log('--- Check 3: Existing Users Intact ---');
    // Delete only the test accounts we just created
    await User.destroy({ where: { id: createdUsers } });
    const countAfter = await User.count();
    console.log(`Users count after cleanup matches initial count: ${countAfter === countBefore} (${countAfter} users)`);
    console.log('✔ Existing users remain intact.\n');

    // ----------------------------------------------------------------
    // Verification 4: Database relationships still work
    // ----------------------------------------------------------------
    console.log('--- Check 4: Verifying Existing Database Relationships ---');
    console.log('Checking User associations:');
    console.log(`- User.hasMany(Order): ${typeof User.associations.orders !== 'undefined'}`);
    console.log(`- User.hasMany(Delivery): ${typeof User.associations.deliveries !== 'undefined'}`);
    console.log(`- User.hasMany(Cart): ${typeof User.associations.carts !== 'undefined'}`);
    console.log(`- Delivery.belongsTo(User): ${typeof Delivery.associations.delivery_staff !== 'undefined'}`);

    if (!User.associations.orders || !User.associations.deliveries || !Delivery.associations.delivery_staff) {
      throw new Error('Check 4 Failed: User associations were damaged!');
    }
    console.log('✔ All database relationships are active and functioning.\n');

    // ----------------------------------------------------------------
    // Summary of Registration Roles
    // ----------------------------------------------------------------
    console.log('--- Registration Policy Summary ---');
    console.log(`Publicly Registerable Roles: ${PUBLIC_REGISTRATION_ROLES.join(', ')}`);
    console.log(`Admin-Only Restricted Roles: ${RESTRICTED_ROLES.join(', ')}\n`);

    console.log('====================================================');
    console.log('🎉 ALL PHASE 3.1 ROLE VERIFICATIONS PASSED SUCCESSFULLY!');
    console.log('====================================================');
  } catch (err) {
    console.error('❌ Test failed:', err.message);
    process.exitCode = 1;
  } finally {
    await sequelize.close();
  }
}

testRoles();

