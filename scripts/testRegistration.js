// scripts/testRegistration.js – Phase 3.2 Registration Test Suite
// -----------------------------------------------------------------
// Verifies all 13 required test scenarios:
// 1. Successful customer registration
// 2. Successful business registration
// 3. Successful supplier registration
// 4. Duplicate email registration (HTTP 409)
// 5. Invalid email (HTTP 400)
// 6. Missing first name (HTTP 400)
// 7. Missing last name (HTTP 400)
// 8. Missing password (HTTP 400)
// 9. Password shorter than 8 characters (HTTP 400)
// 10. Invalid role (HTTP 400)
// 11. Admin registration rejection (HTTP 400)
// 12. Delivery registration rejection (HTTP 400)
// 13. Verify database insertion in PostgreSQL & bcrypt hash check (12 rounds)

require('dotenv').config();
const { sequelize, User } = require('../models');
const app = require('../app');
const bcrypt = require('bcrypt');

const PORT = 5077;
const BASE_URL = `http://localhost:${PORT}/api/auth`;

const TEST_EMAILS = [
  'john.customer@gmail.com',
  'alice.business@gmail.com',
  'bob.supplier@gmail.com',
  'invalid.test@gmail.com',
];

async function runTests() {
  console.log('🚀 Running PR3 – Phase 3.2 User Registration API Tests...\n');

  await sequelize.authenticate();
  const server = app.listen(PORT);

  try {
    // Clean up test emails from previous runs
    await User.destroy({ where: { email: TEST_EMAILS } });

    // -----------------------------------------------------------------
    // Scenario 1: Successful customer registration
    // -----------------------------------------------------------------
    console.log('--- Scenario 1: Successful Customer Registration ---');
    const resCustomer = await fetch(`${BASE_URL}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        first_name: 'John',
        last_name: 'David',
        email: 'john.customer@gmail.com',
        phone: '9876543210',
        password: 'John@12345',
        role: 'customer',
      }),
    });
    const dataCustomer = await resCustomer.json();
    console.log(`Status: ${resCustomer.status} (Expected 201)`);
    console.log(`Response:`, JSON.stringify(dataCustomer, null, 2));

    if (resCustomer.status !== 201 || dataCustomer.user.role !== 'customer') {
      throw new Error('Scenario 1 Failed: Customer registration did not succeed');
    }
    if (dataCustomer.user.password || dataCustomer.user.password_hash || dataCustomer.user.passwordHash) {
      throw new Error('Scenario 1 Failed: Password or password_hash was leaked in API response!');
    }
    console.log('✔ Scenario 1 Passed: Customer registered successfully\n');

    // -----------------------------------------------------------------
    // Scenario 2: Successful business registration
    // -----------------------------------------------------------------
    console.log('--- Scenario 2: Successful Business Registration ---');
    const resBusiness = await fetch(`${BASE_URL}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        first_name: 'Alice',
        last_name: 'Business',
        email: 'alice.business@gmail.com',
        phone: '9876543211',
        password: 'Alice@12345',
        role: 'business',
      }),
    });
    const dataBusiness = await resBusiness.json();
    console.log(`Status: ${resBusiness.status} (Expected 201)`);
    console.log(`User Role:`, dataBusiness.user.role);

    if (resBusiness.status !== 201 || dataBusiness.user.role !== 'business') {
      throw new Error('Scenario 2 Failed: Business registration did not succeed');
    }
    console.log('✔ Scenario 2 Passed: Business user registered successfully\n');

    // -----------------------------------------------------------------
    // Scenario 3: Successful supplier registration
    // -----------------------------------------------------------------
    console.log('--- Scenario 3: Successful Supplier Registration ---');
    const resSupplier = await fetch(`${BASE_URL}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        first_name: 'Bob',
        last_name: 'Supplier',
        email: 'bob.supplier@gmail.com',
        phone: '9876543212',
        password: 'Bob@12345',
        role: 'supplier',
      }),
    });
    const dataSupplier = await resSupplier.json();
    console.log(`Status: ${resSupplier.status} (Expected 201)`);
    console.log(`User Role:`, dataSupplier.user.role);

    if (resSupplier.status !== 201 || dataSupplier.user.role !== 'supplier') {
      throw new Error('Scenario 3 Failed: Supplier registration did not succeed');
    }
    console.log('✔ Scenario 3 Passed: Supplier registered successfully\n');

    // -----------------------------------------------------------------
    // Scenario 4: Duplicate email registration
    // -----------------------------------------------------------------
    console.log('--- Scenario 4: Duplicate Email Registration ---');
    const resDup = await fetch(`${BASE_URL}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        first_name: 'John',
        last_name: 'Duplicate',
        email: 'john.customer@gmail.com',
        phone: '9876543210',
        password: 'John@12345',
      }),
    });
    const dataDup = await resDup.json();
    console.log(`Status: ${resDup.status} (Expected 409)`);
    console.log(`Message:`, dataDup.message);

    if (resDup.status !== 409) {
      throw new Error('Scenario 4 Failed: Duplicate email was not rejected with 409');
    }
    console.log('✔ Scenario 4 Passed: Duplicate email rejected with HTTP 409\n');

    // -----------------------------------------------------------------
    // Scenario 5: Invalid email
    // -----------------------------------------------------------------
    console.log('--- Scenario 5: Invalid Email Format ---');
    const resInvalidEmail = await fetch(`${BASE_URL}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        first_name: 'Invalid',
        last_name: 'Email',
        email: 'not-a-valid-email',
        phone: '9876543210',
        password: 'Password@123',
      }),
    });
    const dataInvalidEmail = await resInvalidEmail.json();
    console.log(`Status: ${resInvalidEmail.status} (Expected 400)`);
    console.log(`Message:`, dataInvalidEmail.message);

    if (resInvalidEmail.status !== 400) {
      throw new Error('Scenario 5 Failed: Invalid email was not rejected with 400');
    }
    console.log('✔ Scenario 5 Passed: Invalid email rejected with HTTP 400\n');

    // -----------------------------------------------------------------
    // Scenario 6: Missing first name
    // -----------------------------------------------------------------
    console.log('--- Scenario 6: Missing First Name ---');
    const resNoFirst = await fetch(`${BASE_URL}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        last_name: 'David',
        email: 'nofirst@gmail.com',
        phone: '9876543210',
        password: 'Password@123',
      }),
    });
    const dataNoFirst = await resNoFirst.json();
    console.log(`Status: ${resNoFirst.status} (Expected 400)`);
    console.log(`Message:`, dataNoFirst.message);

    if (resNoFirst.status !== 400 || dataNoFirst.message !== 'First name is required.') {
      throw new Error('Scenario 6 Failed: Missing first name was not rejected properly');
    }
    console.log('✔ Scenario 6 Passed: Missing first name rejected with HTTP 400\n');

    // -----------------------------------------------------------------
    // Scenario 7: Missing last name
    // -----------------------------------------------------------------
    console.log('--- Scenario 7: Missing Last Name ---');
    const resNoLast = await fetch(`${BASE_URL}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        first_name: 'John',
        email: 'nolast@gmail.com',
        phone: '9876543210',
        password: 'Password@123',
      }),
    });
    const dataNoLast = await resNoLast.json();
    console.log(`Status: ${resNoLast.status} (Expected 400)`);
    console.log(`Message:`, dataNoLast.message);

    if (resNoLast.status !== 400 || dataNoLast.message !== 'Last name is required.') {
      throw new Error('Scenario 7 Failed: Missing last name was not rejected properly');
    }
    console.log('✔ Scenario 7 Passed: Missing last name rejected with HTTP 400\n');

    // -----------------------------------------------------------------
    // Scenario 8: Missing password
    // -----------------------------------------------------------------
    console.log('--- Scenario 8: Missing Password ---');
    const resNoPass = await fetch(`${BASE_URL}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        first_name: 'John',
        last_name: 'David',
        email: 'nopass@gmail.com',
        phone: '9876543210',
      }),
    });
    const dataNoPass = await resNoPass.json();
    console.log(`Status: ${resNoPass.status} (Expected 400)`);
    console.log(`Message:`, dataNoPass.message);

    if (resNoPass.status !== 400 || dataNoPass.message !== 'Password is required.') {
      throw new Error('Scenario 8 Failed: Missing password was not rejected properly');
    }
    console.log('✔ Scenario 8 Passed: Missing password rejected with HTTP 400\n');

    // -----------------------------------------------------------------
    // Scenario 9: Password shorter than 8 characters
    // -----------------------------------------------------------------
    console.log('--- Scenario 9: Password Shorter than 8 Characters ---');
    const resShortPass = await fetch(`${BASE_URL}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        first_name: 'John',
        last_name: 'David',
        email: 'shortpass@gmail.com',
        phone: '9876543210',
        password: 'Short@1', // 7 characters
      }),
    });
    const dataShortPass = await resShortPass.json();
    console.log(`Status: ${resShortPass.status} (Expected 400)`);
    console.log(`Message:`, dataShortPass.message);

    if (resShortPass.status !== 400 || dataShortPass.message !== 'Password must be at least 8 characters long.') {
      throw new Error('Scenario 9 Failed: Short password (<8 chars) was not rejected properly');
    }
    console.log('✔ Scenario 9 Passed: Password shorter than 8 characters rejected with HTTP 400\n');

    // -----------------------------------------------------------------
    // Scenario 10: Invalid role
    // -----------------------------------------------------------------
    console.log('--- Scenario 10: Invalid Role ---');
    const resInvalidRole = await fetch(`${BASE_URL}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        first_name: 'John',
        last_name: 'David',
        email: 'invalidrole@gmail.com',
        phone: '9876543210',
        password: 'Password@123',
        role: 'superadmin', // Invalid role
      }),
    });
    const dataInvalidRole = await resInvalidRole.json();
    console.log(`Status: ${resInvalidRole.status} (Expected 400)`);
    console.log(`Message:`, dataInvalidRole.message);

    if (resInvalidRole.status !== 400) {
      throw new Error('Scenario 10 Failed: Invalid role was not rejected with 400');
    }
    console.log('✔ Scenario 10 Passed: Invalid role rejected with HTTP 400\n');

    // -----------------------------------------------------------------
    // Scenario 11: Admin registration rejection
    // -----------------------------------------------------------------
    console.log('--- Scenario 11: Admin Registration Rejection ---');
    const resAdmin = await fetch(`${BASE_URL}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        first_name: 'Malicious',
        last_name: 'User',
        email: 'admin.attack@gmail.com',
        phone: '9876543210',
        password: 'Password@123',
        role: 'admin', // Restricted role
      }),
    });
    const dataAdmin = await resAdmin.json();
    console.log(`Status: ${resAdmin.status} (Expected 400)`);
    console.log(`Message:`, dataAdmin.message);

    if (resAdmin.status !== 400) {
      throw new Error('Scenario 11 Failed: Admin registration was not rejected');
    }
    console.log('✔ Scenario 11 Passed: Public registration as admin rejected with HTTP 400\n');

    // -----------------------------------------------------------------
    // Scenario 12: Delivery registration rejection
    // -----------------------------------------------------------------
    console.log('--- Scenario 12: Delivery Registration Rejection ---');
    const resDelivery = await fetch(`${BASE_URL}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        first_name: 'Malicious',
        last_name: 'Driver',
        email: 'delivery.attack@gmail.com',
        phone: '9876543210',
        password: 'Password@123',
        role: 'delivery', // Restricted role
      }),
    });
    const dataDelivery = await resDelivery.json();
    console.log(`Status: ${resDelivery.status} (Expected 400)`);
    console.log(`Message:`, dataDelivery.message);

    if (resDelivery.status !== 400) {
      throw new Error('Scenario 12 Failed: Delivery registration was not rejected');
    }
    console.log('✔ Scenario 12 Passed: Public registration as delivery rejected with HTTP 400\n');

    // -----------------------------------------------------------------
    // Scenario 13: Verify database insertion & 12 salt rounds bcrypt
    // -----------------------------------------------------------------
    console.log('--- Scenario 13: Verify PostgreSQL Database Insertion & Bcrypt Hash ---');
    const dbCustomer = await User.findOne({ where: { email: 'john.customer@gmail.com' } });
    const dbBusiness = await User.findOne({ where: { email: 'alice.business@gmail.com' } });
    const dbSupplier = await User.findOne({ where: { email: 'bob.supplier@gmail.com' } });

    if (!dbCustomer || !dbBusiness || !dbSupplier) {
      throw new Error('Scenario 13 Failed: Users were not saved into PostgreSQL database!');
    }

    console.log(`PostgreSQL Records Verified:`);
    console.log(`- Customer: ID=${dbCustomer.id}, Name=${dbCustomer.firstName} ${dbCustomer.lastName}, Email=${dbCustomer.email}, Role=${dbCustomer.role}, Active=${dbCustomer.isActive}`);
    console.log(`- Business: ID=${dbBusiness.id}, Name=${dbBusiness.firstName} ${dbBusiness.lastName}, Email=${dbBusiness.email}, Role=${dbBusiness.role}, Active=${dbBusiness.isActive}`);
    console.log(`- Supplier: ID=${dbSupplier.id}, Name=${dbSupplier.firstName} ${dbSupplier.lastName}, Email=${dbSupplier.email}, Role=${dbSupplier.role}, Active=${dbSupplier.isActive}`);

    // Verify bcrypt hash uses 12 rounds: bcrypt hashes with 12 rounds have the prefix $2a$12$ or $2b$12$
    const is12Rounds = dbCustomer.passwordHash.startsWith('$2b$12$') || dbCustomer.passwordHash.startsWith('$2a$12$');
    console.log(`- Password hash prefix: ${dbCustomer.passwordHash.substring(0, 7)} (12 salt rounds verified: ${is12Rounds})`);

    // Verify bcrypt password comparison
    const passwordMatches = await bcrypt.compare('John@12345', dbCustomer.passwordHash);
    console.log(`- Bcrypt password match verification: ${passwordMatches}`);

    if (!is12Rounds || !passwordMatches) {
      throw new Error('Scenario 13 Failed: Password hash does not use 12 rounds or failed comparison');
    }
    console.log('✔ Scenario 13 Passed: Database records and 12-round bcrypt hashes verified!\n');

    console.log('================================================================');
    console.log('🎉 ALL 13 REGISTRATION TEST SCENARIOS PASSED WITH ZERO ERRORS!');
    console.log('================================================================');
  } catch (err) {
    console.error('❌ Test failed:', err.message);
    process.exitCode = 1;
  } finally {
    // Clean up test emails
    await User.destroy({ where: { email: TEST_EMAILS } });

    server.close(() => {
      sequelize.close().then(() => {
        console.log('Server and database connection closed cleanly.');
      });
    });
  }
}

runTests();
