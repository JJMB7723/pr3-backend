// scripts/testAuth.js – Comprehensive Phase 3 Auth Tests
// -------------------------------------------------------
// Verifies all 10 required authentication and authorization test scenarios

require('dotenv').config();
const { sequelize, User } = require('../models');
const app = require('../app');
const bcrypt = require('bcryptjs');

const PORT = 5055; // Dedicated test port
const BASE_URL = `http://localhost:${PORT}/api/auth`;

async function runTests() {
  console.log('🚀 Starting Phase 3 Authentication & Authorization Test Suite...\n');

  // Connect to DB and start temporary test server
  await sequelize.authenticate();
  const server = app.listen(PORT);

  let customerToken = null;
  let adminToken = null;
  let testUserId = null;

  try {
    // Clean up any previous test user data
    await User.destroy({
      where: {
        email: [
          'john.doe@example.com',
          'jane.admin@example.com',
          'inactive.user@example.com',
        ],
      },
    });

    // ----------------------------------------------------
    // Test 1: Successful registration
    // ----------------------------------------------------
    console.log('--- Test 1: Successful Registration (POST /api/auth/register) ---');
    const regRes = await fetch(`${BASE_URL}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        first_name: 'John',
        last_name: 'Doe',
        email: 'john.doe@example.com',
        phone: '0771234567',
        password: 'Password123!',
      }),
    });
    const regData = await regRes.json();
    console.log(`Status: ${regRes.status}`);
    console.log(`Response:`, JSON.stringify(regData, null, 2));

    if (regRes.status !== 201 || !regData.data.token) {
      throw new Error('Test 1 Failed: User registration failed');
    }
    if (regData.data.user.passwordHash || regData.data.user.password_hash) {
      throw new Error('Test 1 Failed: password_hash was exposed in response!');
    }
    customerToken = regData.data.token;
    testUserId = regData.data.user.id;
    console.log('✔ Test 1 Passed: User registered as customer without exposing password_hash\n');

    // ----------------------------------------------------
    // Test 2: Duplicate registration rejection
    // ----------------------------------------------------
    console.log('--- Test 2: Duplicate Registration Rejection ---');
    const dupRes = await fetch(`${BASE_URL}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        first_name: 'John',
        last_name: 'Duplicate',
        email: 'john.doe@example.com',
        password: 'Password123!',
      }),
    });
    const dupData = await dupRes.json();
    console.log(`Status: ${dupRes.status} (Expected 409)`);
    console.log(`Message:`, dupData.message);

    if (dupRes.status !== 409) {
      throw new Error('Test 2 Failed: Duplicate registration did not return 409');
    }
    console.log('✔ Test 2 Passed: Duplicate email properly rejected\n');

    // ----------------------------------------------------
    // Test 3: Successful login & JWT generation
    // ----------------------------------------------------
    console.log('--- Test 3: Successful Login & JWT Generation (POST /api/auth/login) ---');
    const loginRes = await fetch(`${BASE_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'john.doe@example.com',
        password: 'Password123!',
      }),
    });
    const loginData = await loginRes.json();
    console.log(`Status: ${loginRes.status}`);
    console.log(`Response:`, JSON.stringify(loginData, null, 2));

    if (loginRes.status !== 200 || !loginData.data.token) {
      throw new Error('Test 3 Failed: Login failed');
    }
    if (loginData.data.user.passwordHash || loginData.data.user.password_hash) {
      throw new Error('Test 3 Failed: password_hash was exposed in login response!');
    }
    console.log('✔ Test 3 Passed: User logged in, valid JWT returned\n');

    // ----------------------------------------------------
    // Test 4: Incorrect password rejection
    // ----------------------------------------------------
    console.log('--- Test 4: Incorrect Password Rejection ---');
    const wrongPassRes = await fetch(`${BASE_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'john.doe@example.com',
        password: 'WrongPassword999',
      }),
    });
    const wrongPassData = await wrongPassRes.json();
    console.log(`Status: ${wrongPassRes.status} (Expected 401)`);
    console.log(`Message:`, wrongPassData.message);

    if (wrongPassRes.status !== 401) {
      throw new Error('Test 4 Failed: Wrong password did not return 401');
    }
    console.log('✔ Test 4 Passed: Incorrect password correctly rejected\n');

    // ----------------------------------------------------
    // Test 5: Access protected route with JWT (GET /api/auth/me)
    // ----------------------------------------------------
    console.log('--- Test 5: Access Protected Route (GET /api/auth/me) ---');
    const meRes = await fetch(`${BASE_URL}/me`, {
      headers: { Authorization: `Bearer ${customerToken}` },
    });
    const meData = await meRes.json();
    console.log(`Status: ${meRes.status}`);
    console.log(`User Profile:`, JSON.stringify(meData, null, 2));

    if (meRes.status !== 200 || meData.data.user.email !== 'john.doe@example.com') {
      throw new Error('Test 5 Failed: Could not access /api/auth/me with valid token');
    }
    console.log('✔ Test 5 Passed: Profile fetched successfully using JWT\n');

    // ----------------------------------------------------
    // Test 6: Missing token rejection
    // ----------------------------------------------------
    console.log('--- Test 6: Missing Token Rejection ---');
    const noTokenRes = await fetch(`${BASE_URL}/me`);
    const noTokenData = await noTokenRes.json();
    console.log(`Status: ${noTokenRes.status} (Expected 401)`);
    console.log(`Message:`, noTokenData.message);

    if (noTokenRes.status !== 401) {
      throw new Error('Test 6 Failed: Missing token was not rejected with 401');
    }
    console.log('✔ Test 6 Passed: Missing token rejected\n');

    // ----------------------------------------------------
    // Test 7: Invalid token rejection
    // ----------------------------------------------------
    console.log('--- Test 7: Invalid Token Rejection ---');
    const invalidTokenRes = await fetch(`${BASE_URL}/me`, {
      headers: { Authorization: 'Bearer this.is.an.invalid.token' },
    });
    const invalidTokenData = await invalidTokenRes.json();
    console.log(`Status: ${invalidTokenRes.status} (Expected 401)`);
    console.log(`Message:`, invalidTokenData.message);

    if (invalidTokenRes.status !== 401) {
      throw new Error('Test 7 Failed: Invalid token was not rejected with 401');
    }
    console.log('✔ Test 7 Passed: Invalid token rejected\n');

    // ----------------------------------------------------
    // Test 8: Role-based access control (RBAC)
    // ----------------------------------------------------
    console.log('--- Test 8: Role-Based Authorization (RBAC) ---');
    // Customer attempts to access admin-only route
    const forbiddenRes = await fetch(`${BASE_URL}/admin-only`, {
      headers: { Authorization: `Bearer ${customerToken}` },
    });
    const forbiddenData = await forbiddenRes.json();
    console.log(`Customer accessing Admin route Status: ${forbiddenRes.status} (Expected 403)`);
    console.log(`Message:`, forbiddenData.message);

    if (forbiddenRes.status !== 403) {
      throw new Error('Test 8 Failed: Customer access to admin route did not return 403');
    }

    // Create an Admin user to verify authorized access
    const adminHash = await bcrypt.hash('AdminPassword123!', 10);
    const adminUser = await User.create({
      firstName: 'Jane',
      lastName: 'Admin',
      email: 'jane.admin@example.com',
      passwordHash: adminHash,
      role: 'admin',
      isActive: true,
    });

    const adminLoginRes = await fetch(`${BASE_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'jane.admin@example.com',
        password: 'AdminPassword123!',
      }),
    });
    const adminLoginData = await adminLoginRes.json();
    adminToken = adminLoginData.data.token;

    // Admin accesses admin-only route
    const adminRes = await fetch(`${BASE_URL}/admin-only`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const adminData = await adminRes.json();
    console.log(`Admin accessing Admin route Status: ${adminRes.status} (Expected 200)`);
    console.log(`Message:`, adminData.message);

    if (adminRes.status !== 200) {
      throw new Error('Test 8 Failed: Admin could not access admin route');
    }
    console.log('✔ Test 8 Passed: Role-based access control working (403 for unauthorized, 200 for authorized)\n');

    // ----------------------------------------------------
    // Test 9: Inactive user rejection
    // ----------------------------------------------------
    console.log('--- Test 9: Inactive User Rejection ---');
    const inactiveHash = await bcrypt.hash('Password123!', 10);
    const inactiveUser = await User.create({
      firstName: 'Inactive',
      lastName: 'User',
      email: 'inactive.user@example.com',
      passwordHash: inactiveHash,
      role: 'customer',
      isActive: false, // DEACTIVATED
    });

    const inactiveLoginRes = await fetch(`${BASE_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'inactive.user@example.com',
        password: 'Password123!',
      }),
    });
    const inactiveLoginData = await inactiveLoginRes.json();
    console.log(`Inactive user login Status: ${inactiveLoginRes.status} (Expected 403)`);
    console.log(`Message:`, inactiveLoginData.message);

    if (inactiveLoginRes.status !== 403) {
      throw new Error('Test 9 Failed: Inactive user login was not blocked with 403');
    }
    console.log('✔ Test 9 Passed: Deactivated account properly blocked\n');

    // ----------------------------------------------------
    // Test 10: Logout API (POST /api/auth/logout)
    // ----------------------------------------------------
    console.log('--- Test 10: Logout API (POST /api/auth/logout) ---');
    const logoutRes = await fetch(`${BASE_URL}/logout`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${customerToken}` },
    });
    const logoutData = await logoutRes.json();
    console.log(`Logout Status: ${logoutRes.status}`);
    console.log(`Message:`, logoutData.message);

    if (logoutRes.status !== 200) {
      throw new Error('Test 10 Failed: Logout endpoint did not return 200');
    }
    console.log('✔ Test 10 Passed: Logout endpoint functional\n');

    console.log('====================================================');
    console.log('🎉 ALL 10 AUTHENTICATION & AUTHORIZATION TESTS PASSED!');
    console.log('====================================================');
  } catch (err) {
    console.error('❌ Test Suite Error:', err.message);
    process.exitCode = 1;
  } finally {
    // Clean up test users
    await User.destroy({
      where: {
        email: [
          'john.doe@example.com',
          'jane.admin@example.com',
          'inactive.user@example.com',
        ],
      },
    });

    // Close server and database connection
    server.close(() => {
      sequelize.close().then(() => {
        console.log('Server and database connection closed cleanly.');
      });
    });
  }
}

runTests();

