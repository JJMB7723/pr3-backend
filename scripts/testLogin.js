// scripts/testLogin.js – Phase 3.3 User Login & JWT Test Suite
// -------------------------------------------------------------
// Tests all 12 required scenarios for Task 10:
// 1. Login with correct customer credentials
// 2. Login with correct business credentials
// 3. Login with correct supplier credentials
// 4. Login with incorrect password (HTTP 401)
// 5. Login with nonexistent email (HTTP 401)
// 6. Missing email (HTTP 400)
// 7. Missing password (HTTP 400)
// 8. Invalid email format (HTTP 400)
// 9. Inactive user login rejection (HTTP 401)
// 10. Verify JWT token is generated and valid
// 11. Verify token payload contains user id (or sub) and role
// 12. Verify password_hash is never exposed in response

require('dotenv').config();
const http = require('http');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const app = require('../app');
const { sequelize, User } = require('../models');

const TEST_USERS = [
  {
    firstName: 'John',
    lastName: 'David',
    email: 'login.customer@test.com',
    phone: '9876543210',
    password: 'CustomerPassword123',
    role: 'customer',
    isActive: true,
  },
  {
    firstName: 'Alice',
    lastName: 'Business',
    email: 'login.business@test.com',
    phone: '9876543211',
    password: 'BusinessPassword123',
    role: 'business',
    isActive: true,
  },
  {
    firstName: 'Bob',
    lastName: 'Supplier',
    email: 'login.supplier@test.com',
    phone: '9876543212',
    password: 'SupplierPassword123',
    role: 'supplier',
    isActive: true,
  },
  {
    firstName: 'Inactive',
    lastName: 'User',
    email: 'login.inactive@test.com',
    phone: '9876543213',
    password: 'InactivePassword123',
    role: 'customer',
    isActive: false, // inactive account
  },
];

async function runLoginTests() {
  console.log('🚀 Running PR3 – Phase 3.3 User Login & JWT API Tests...\n');

  await sequelize.authenticate();

  // Clean up any previous test users
  const emails = TEST_USERS.map((u) => u.email);
  await User.destroy({ where: { email: emails } });

  // Seed test users with 12-round bcrypt hash
  for (const u of TEST_USERS) {
    const passwordHash = await bcrypt.hash(u.password, 12);
    await User.create({
      firstName: u.firstName,
      lastName: u.lastName,
      email: u.email,
      phone: u.phone,
      passwordHash,
      role: u.role,
      isActive: u.isActive,
    });
  }
  console.log('✔ Seeded 4 test users (customer, business, supplier, inactive customer)\n');

  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  const loginUrl = `http://localhost:${port}/api/auth/login`;

  let passed = 0;
  const total = 12;

  try {
    // -------------------------------------------------------------
    // Scenario 1: Login with correct customer credentials
    // -------------------------------------------------------------
    console.log('--- Scenario 1: Customer Login with Valid Credentials ---');
    const res1 = await fetch(loginUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'login.customer@test.com',
        password: 'CustomerPassword123',
      }),
    });
    const data1 = await res1.json();
    console.log(`Status: ${res1.status} (Expected 200)`);
    console.log(`Message: ${data1.message}`);
    console.log(`User: ${JSON.stringify(data1.user)}`);

    if (res1.status === 200 && data1.token && data1.user.role === 'customer') {
      console.log('✔ Scenario 1 Passed\n');
      passed++;
    } else {
      throw new Error('Scenario 1 Failed');
    }

    // -------------------------------------------------------------
    // Scenario 2: Login with correct business credentials
    // -------------------------------------------------------------
    console.log('--- Scenario 2: Business Login with Valid Credentials ---');
    const res2 = await fetch(loginUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'login.business@test.com',
        password: 'BusinessPassword123',
      }),
    });
    const data2 = await res2.json();
    console.log(`Status: ${res2.status} (Expected 200)`);
    console.log(`User Role: ${data2.user.role}`);

    if (res2.status === 200 && data2.token && data2.user.role === 'business') {
      console.log('✔ Scenario 2 Passed\n');
      passed++;
    } else {
      throw new Error('Scenario 2 Failed');
    }

    // -------------------------------------------------------------
    // Scenario 3: Login with correct supplier credentials
    // -------------------------------------------------------------
    console.log('--- Scenario 3: Supplier Login with Valid Credentials ---');
    const res3 = await fetch(loginUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'login.supplier@test.com',
        password: 'SupplierPassword123',
      }),
    });
    const data3 = await res3.json();
    console.log(`Status: ${res3.status} (Expected 200)`);
    console.log(`User Role: ${data3.user.role}`);

    if (res3.status === 200 && data3.token && data3.user.role === 'supplier') {
      console.log('✔ Scenario 3 Passed\n');
      passed++;
    } else {
      throw new Error('Scenario 3 Failed');
    }

    // -------------------------------------------------------------
    // Scenario 4: Login with incorrect password
    // -------------------------------------------------------------
    console.log('--- Scenario 4: Login with Incorrect Password ---');
    const res4 = await fetch(loginUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'login.customer@test.com',
        password: 'WrongPassword999',
      }),
    });
    const data4 = await res4.json();
    console.log(`Status: ${res4.status} (Expected 401)`);
    console.log(`Message: ${data4.message}`);

    if (res4.status === 401 && data4.message === 'Invalid email or password') {
      console.log('✔ Scenario 4 Passed: Incorrect password rejected with HTTP 401\n');
      passed++;
    } else {
      throw new Error('Scenario 4 Failed');
    }

    // -------------------------------------------------------------
    // Scenario 5: Login with nonexistent email
    // -------------------------------------------------------------
    console.log('--- Scenario 5: Login with Nonexistent Email ---');
    const res5 = await fetch(loginUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'doesnotexist@test.com',
        password: 'SomePassword123',
      }),
    });
    const data5 = await res5.json();
    console.log(`Status: ${res5.status} (Expected 401)`);
    console.log(`Message: ${data5.message}`);

    if (res5.status === 401 && data5.message === 'Invalid email or password') {
      console.log('✔ Scenario 5 Passed: Nonexistent email rejected with generic HTTP 401\n');
      passed++;
    } else {
      throw new Error('Scenario 5 Failed');
    }

    // -------------------------------------------------------------
    // Scenario 6: Missing email
    // -------------------------------------------------------------
    console.log('--- Scenario 6: Missing Email Field ---');
    const res6 = await fetch(loginUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        password: 'SomePassword123',
      }),
    });
    const data6 = await res6.json();
    console.log(`Status: ${res6.status} (Expected 400)`);
    console.log(`Message: ${data6.message}`);

    if (res6.status === 400 && data6.message === 'Email is required.') {
      console.log('✔ Scenario 6 Passed: Missing email rejected with HTTP 400\n');
      passed++;
    } else {
      throw new Error('Scenario 6 Failed');
    }

    // -------------------------------------------------------------
    // Scenario 7: Missing password
    // -------------------------------------------------------------
    console.log('--- Scenario 7: Missing Password Field ---');
    const res7 = await fetch(loginUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'login.customer@test.com',
      }),
    });
    const data7 = await res7.json();
    console.log(`Status: ${res7.status} (Expected 400)`);
    console.log(`Message: ${data7.message}`);

    if (res7.status === 400 && data7.message === 'Password is required.') {
      console.log('✔ Scenario 7 Passed: Missing password rejected with HTTP 400\n');
      passed++;
    } else {
      throw new Error('Scenario 7 Failed');
    }

    // -------------------------------------------------------------
    // Scenario 8: Invalid email format
    // -------------------------------------------------------------
    console.log('--- Scenario 8: Invalid Email Format ---');
    const res8 = await fetch(loginUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'invalid-email-format',
        password: 'CustomerPassword123',
      }),
    });
    const data8 = await res8.json();
    console.log(`Status: ${res8.status} (Expected 400)`);
    console.log(`Message: ${data8.message}`);

    if (res8.status === 400 && data8.message === 'Please provide a valid email address.') {
      console.log('✔ Scenario 8 Passed: Malformed email rejected with HTTP 400\n');
      passed++;
    } else {
      throw new Error('Scenario 8 Failed');
    }

    // -------------------------------------------------------------
    // Scenario 9: Inactive user login
    // -------------------------------------------------------------
    console.log('--- Scenario 9: Inactive User Login Attempt ---');
    const res9 = await fetch(loginUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'login.inactive@test.com',
        password: 'InactivePassword123',
      }),
    });
    const data9 = await res9.json();
    console.log(`Status: ${res9.status} (Expected 401)`);
    console.log(`Message: ${data9.message}`);

    if (res9.status === 401 && data9.message.includes('deactivated')) {
      console.log('✔ Scenario 9 Passed: Inactive user login rejected with HTTP 401\n');
      passed++;
    } else {
      throw new Error('Scenario 9 Failed');
    }

    // -------------------------------------------------------------
    // Scenario 10: Verify JWT token structure & signature
    // -------------------------------------------------------------
    console.log('--- Scenario 10: Verify JWT Token Signature ---');
    const token = data1.token;
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Decoded Token Header/Payload:', decoded);

    if (decoded && decoded.sub && decoded.role) {
      console.log('✔ Scenario 10 Passed: Token verified with secret key\n');
      passed++;
    } else {
      throw new Error('Scenario 10 Failed: Invalid token decoding');
    }

    // -------------------------------------------------------------
    // Scenario 11: Verify token contains correct user ID and role
    // -------------------------------------------------------------
    console.log('--- Scenario 11: Verify Token Payload Claims ---');
    const userInDb = await User.findOne({ where: { email: 'login.customer@test.com' } });
    console.log(`Expected User ID: ${userInDb.id}, In Token (sub): ${decoded.sub}, (id): ${decoded.id}`);
    console.log(`Expected Role: 'customer', In Token: '${decoded.role}'`);

    if (decoded.sub === userInDb.id && decoded.id === userInDb.id && decoded.role === 'customer') {
      console.log('✔ Scenario 11 Passed: Token payload contains user ID and role\n');
      passed++;
    } else {
      throw new Error('Scenario 11 Failed');
    }

    // -------------------------------------------------------------
    // Scenario 12: Verify password_hash is never returned
    // -------------------------------------------------------------
    console.log('--- Scenario 12: Verify Password and Password Hash are Excluded ---');
    const hasPasswordInUser = 'password' in data1.user;
    const hasPasswordHashInUser = 'password_hash' in data1.user || 'passwordHash' in data1.user;
    const hasPasswordInRoot = 'password' in data1 || 'password_hash' in data1;

    console.log(`Contains password: ${hasPasswordInUser || hasPasswordInRoot}`);
    console.log(`Contains password_hash: ${hasPasswordHashInUser}`);

    if (!hasPasswordInUser && !hasPasswordHashInUser && !hasPasswordInRoot) {
      console.log('✔ Scenario 12 Passed: No password or hash leaked\n');
      passed++;
    } else {
      throw new Error('Scenario 12 Failed: Password or hash was leaked');
    }

    console.log('================================================================');
    console.log(`🎉 ALL ${passed}/${total} LOGIN TEST SCENARIOS PASSED WITH ZERO ERRORS!`);
    console.log('================================================================');
  } finally {
    // Clean up test users
    await User.destroy({ where: { email: emails } });
    server.close();
  }
}

runLoginTests().catch((err) => {
  console.error('❌ Test execution error:', err);
  process.exit(1);
});

