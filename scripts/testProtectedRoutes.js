// scripts/testProtectedRoutes.js – Phase 3.4 Protected Routes & JWT Testing
// --------------------------------------------------------------------------
// Verifies all 12 required scenarios for Task 4:
// 1. Request without token – HTTP 401
// 2. Request with invalid token – HTTP 401
// 3. Request with expired token – HTTP 401
// 4. Request with valid customer token – HTTP 200
// 5. Request with valid business token – HTTP 200
// 6. Request with valid supplier token – HTTP 200
// 7. Request with valid admin token – HTTP 200
// 8. Request with valid delivery token – HTTP 200
// 9. Customer accessing admin-only route – HTTP 403
// 10. Delivery accessing admin-only route – HTTP 403
// 11. Admin accessing admin-only route – HTTP 200
// 12. Token with modified payload/signature – HTTP 401

require('dotenv').config();
const http = require('http');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const app = require('../app');
const { sequelize, User } = require('../models');
const generateToken = require('../utils/generateToken');

const ROLES_TEST_USERS = [
  {
    firstName: 'Charlie',
    lastName: 'Customer',
    email: 'charlie.customer@protected.test',
    phone: '9876543201',
    password: 'Password123!',
    role: 'customer',
  },
  {
    firstName: 'Beth',
    lastName: 'Business',
    email: 'beth.business@protected.test',
    phone: '9876543202',
    password: 'Password123!',
    role: 'business',
  },
  {
    firstName: 'Sam',
    lastName: 'Supplier',
    email: 'sam.supplier@protected.test',
    phone: '9876543203',
    password: 'Password123!',
    role: 'supplier',
  },
  {
    firstName: 'Adam',
    lastName: 'Admin',
    email: 'adam.admin@protected.test',
    phone: '9876543204',
    password: 'Password123!',
    role: 'admin',
  },
  {
    firstName: 'Dan',
    lastName: 'Delivery',
    email: 'dan.delivery@protected.test',
    phone: '9876543205',
    password: 'Password123!',
    role: 'delivery',
  },
];

async function runProtectedRoutesTests() {
  console.log('🚀 Running PR3 – Phase 3.4 Protected Routes & JWT Authentication Tests...\n');

  await sequelize.authenticate();

  // Clean up any old test records
  const testEmails = ROLES_TEST_USERS.map((u) => u.email);
  await User.destroy({ where: { email: testEmails } });

  // Create test users for all 5 roles
  const users = {};
  const tokens = {};

  for (const u of ROLES_TEST_USERS) {
    const passwordHash = await bcrypt.hash(u.password, 12);
    const createdUser = await User.create({
      firstName: u.firstName,
      lastName: u.lastName,
      email: u.email,
      phone: u.phone,
      passwordHash,
      role: u.role,
      isActive: true,
    });
    users[u.role] = createdUser;
    tokens[u.role] = generateToken({
      sub: createdUser.id,
      id: createdUser.id,
      role: createdUser.role,
    });
  }
  console.log('✔ Seeded 5 test accounts across all 5 roles (customer, business, supplier, admin, delivery)\n');

  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  const meUrl = `http://localhost:${port}/api/auth/me`;
  const adminUrl = `http://localhost:${port}/api/auth/admin-only`;

  let passed = 0;
  const total = 12;

  try {
    // -----------------------------------------------------------------
    // Scenario 1: Request without token – 401
    // -----------------------------------------------------------------
    console.log('--- Scenario 1: Request Without Token ---');
    const res1 = await fetch(meUrl);
    const data1 = await res1.json();
    console.log(`Status: ${res1.status} (Expected 401)`);
    console.log(`Message: ${data1.message}`);
    if (res1.status === 401 && data1.message.includes('No authentication token provided')) {
      console.log('✔ Scenario 1 Passed: Missing token rejected with HTTP 401\n');
      passed++;
    } else {
      throw new Error('Scenario 1 Failed');
    }

    // -----------------------------------------------------------------
    // Scenario 2: Request with invalid token – 401
    // -----------------------------------------------------------------
    console.log('--- Scenario 2: Request With Invalid Token ---');
    const res2 = await fetch(meUrl, {
      headers: { Authorization: 'Bearer this-is-not-a-valid-jwt-token' },
    });
    const data2 = await res2.json();
    console.log(`Status: ${res2.status} (Expected 401)`);
    console.log(`Message: ${data2.message}`);
    if (res2.status === 401 && data2.message.includes('Invalid token')) {
      console.log('✔ Scenario 2 Passed: Malformed token rejected with HTTP 401\n');
      passed++;
    } else {
      throw new Error('Scenario 2 Failed');
    }

    // -----------------------------------------------------------------
    // Scenario 3: Request with expired token – 401
    // -----------------------------------------------------------------
    console.log('--- Scenario 3: Request With Expired Token ---');
    const expiredToken = jwt.sign(
      { sub: users.customer.id, id: users.customer.id, role: 'customer' },
      process.env.JWT_SECRET,
      { expiresIn: '-5s' } // Expired 5 seconds ago
    );
    const res3 = await fetch(meUrl, {
      headers: { Authorization: `Bearer ${expiredToken}` },
    });
    const data3 = await res3.json();
    console.log(`Status: ${res3.status} (Expected 401)`);
    console.log(`Message: ${data3.message}`);
    if (res3.status === 401 && data3.message.includes('Token has expired')) {
      console.log('✔ Scenario 3 Passed: Expired token rejected with HTTP 401\n');
      passed++;
    } else {
      throw new Error('Scenario 3 Failed');
    }

    // -----------------------------------------------------------------
    // Scenario 4: Request with valid customer token – 200
    // -----------------------------------------------------------------
    console.log('--- Scenario 4: Request With Valid Customer Token ---');
    const res4 = await fetch(meUrl, {
      headers: { Authorization: `Bearer ${tokens.customer}` },
    });
    const data4 = await res4.json();
    console.log(`Status: ${res4.status} (Expected 200)`);
    console.log(`User: ${JSON.stringify(data4.user)}`);
    if (res4.status === 200 && data4.user.role === 'customer' && !data4.user.password && !data4.user.password_hash) {
      console.log('✔ Scenario 4 Passed: Customer identity verified safely\n');
      passed++;
    } else {
      throw new Error('Scenario 4 Failed');
    }

    // -----------------------------------------------------------------
    // Scenario 5: Request with valid business token – 200
    // -----------------------------------------------------------------
    console.log('--- Scenario 5: Request With Valid Business Token ---');
    const res5 = await fetch(meUrl, {
      headers: { Authorization: `Bearer ${tokens.business}` },
    });
    const data5 = await res5.json();
    console.log(`Status: ${res5.status} (Expected 200)`);
    console.log(`User: ${JSON.stringify(data5.user)}`);
    if (res5.status === 200 && data5.user.role === 'business') {
      console.log('✔ Scenario 5 Passed: Business identity verified safely\n');
      passed++;
    } else {
      throw new Error('Scenario 5 Failed');
    }

    // -----------------------------------------------------------------
    // Scenario 6: Request with valid supplier token – 200
    // -----------------------------------------------------------------
    console.log('--- Scenario 6: Request With Valid Supplier Token ---');
    const res6 = await fetch(meUrl, {
      headers: { Authorization: `Bearer ${tokens.supplier}` },
    });
    const data6 = await res6.json();
    console.log(`Status: ${res6.status} (Expected 200)`);
    console.log(`User: ${JSON.stringify(data6.user)}`);
    if (res6.status === 200 && data6.user.role === 'supplier') {
      console.log('✔ Scenario 6 Passed: Supplier identity verified safely\n');
      passed++;
    } else {
      throw new Error('Scenario 6 Failed');
    }

    // -----------------------------------------------------------------
    // Scenario 7: Request with valid admin token – 200
    // -----------------------------------------------------------------
    console.log('--- Scenario 7: Request With Valid Admin Token ---');
    const res7 = await fetch(meUrl, {
      headers: { Authorization: `Bearer ${tokens.admin}` },
    });
    const data7 = await res7.json();
    console.log(`Status: ${res7.status} (Expected 200)`);
    console.log(`User: ${JSON.stringify(data7.user)}`);
    if (res7.status === 200 && data7.user.role === 'admin') {
      console.log('✔ Scenario 7 Passed: Admin identity verified safely\n');
      passed++;
    } else {
      throw new Error('Scenario 7 Failed');
    }

    // -----------------------------------------------------------------
    // Scenario 8: Request with valid delivery token – 200
    // -----------------------------------------------------------------
    console.log('--- Scenario 8: Request With Valid Delivery Token ---');
    const res8 = await fetch(meUrl, {
      headers: { Authorization: `Bearer ${tokens.delivery}` },
    });
    const data8 = await res8.json();
    console.log(`Status: ${res8.status} (Expected 200)`);
    console.log(`User: ${JSON.stringify(data8.user)}`);
    if (res8.status === 200 && data8.user.role === 'delivery') {
      console.log('✔ Scenario 8 Passed: Delivery staff identity verified safely\n');
      passed++;
    } else {
      throw new Error('Scenario 8 Failed');
    }

    // -----------------------------------------------------------------
    // Scenario 9: Customer accessing admin-only route – 403
    // -----------------------------------------------------------------
    console.log('--- Scenario 9: Customer Accessing Admin-Only Route ---');
    const res9 = await fetch(adminUrl, {
      headers: { Authorization: `Bearer ${tokens.customer}` },
    });
    const data9 = await res9.json();
    console.log(`Status: ${res9.status} (Expected 403)`);
    console.log(`Message: ${data9.message}`);
    if (res9.status === 403 && data9.message.includes('Forbidden')) {
      console.log('✔ Scenario 9 Passed: Customer blocked from admin route with HTTP 403\n');
      passed++;
    } else {
      throw new Error('Scenario 9 Failed');
    }

    // -----------------------------------------------------------------
    // Scenario 10: Delivery accessing admin-only route – 403
    // -----------------------------------------------------------------
    console.log('--- Scenario 10: Delivery Accessing Admin-Only Route ---');
    const res10 = await fetch(adminUrl, {
      headers: { Authorization: `Bearer ${tokens.delivery}` },
    });
    const data10 = await res10.json();
    console.log(`Status: ${res10.status} (Expected 403)`);
    console.log(`Message: ${data10.message}`);
    if (res10.status === 403 && data10.message.includes('Forbidden')) {
      console.log('✔ Scenario 10 Passed: Delivery staff blocked from admin route with HTTP 403\n');
      passed++;
    } else {
      throw new Error('Scenario 10 Failed');
    }

    // -----------------------------------------------------------------
    // Scenario 11: Admin accessing admin-only route – 200
    // -----------------------------------------------------------------
    console.log('--- Scenario 11: Admin Accessing Admin-Only Route ---');
    const res11 = await fetch(adminUrl, {
      headers: { Authorization: `Bearer ${tokens.admin}` },
    });
    const data11 = await res11.json();
    console.log(`Status: ${res11.status} (Expected 200)`);
    console.log(`Message: ${data11.message}`);
    if (res11.status === 200 && data11.user.role === 'admin') {
      console.log('✔ Scenario 11 Passed: Admin successfully granted access with HTTP 200\n');
      passed++;
    } else {
      throw new Error('Scenario 11 Failed');
    }

    // -----------------------------------------------------------------
    // Scenario 12: Token with modified payload/signature – 401
    // -----------------------------------------------------------------
    console.log('--- Scenario 12: Token With Tampered Payload/Signature ---');
    // Alter the signature by replacing the last 5 characters
    const tamperedToken = tokens.customer.slice(0, -5) + 'ABCDE';
    const res12 = await fetch(meUrl, {
      headers: { Authorization: `Bearer ${tamperedToken}` },
    });
    const data12 = await res12.json();
    console.log(`Status: ${res12.status} (Expected 401)`);
    console.log(`Message: ${data12.message}`);
    if (res12.status === 401 && data12.message.includes('Invalid token')) {
      console.log('✔ Scenario 12 Passed: Tampered token signature rejected with HTTP 401\n');
      passed++;
    } else {
      throw new Error('Scenario 12 Failed');
    }

    console.log('================================================================');
    console.log(`🎉 ALL ${passed}/${total} PROTECTED ROUTE TEST SCENARIOS PASSED WITH ZERO ERRORS!`);
    console.log('================================================================');
  } finally {
    // Cleanup test users
    await User.destroy({ where: { email: testEmails } });
    server.close();
  }
}

runProtectedRoutesTests().catch((err) => {
  console.error('❌ Test execution error:', err);
  process.exit(1);
});

