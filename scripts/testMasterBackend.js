// scripts/testMasterBackend.js – Master End-to-End Test Suite (Phases 4 – 16)
// --------------------------------------------------------------------------
// Validates all completed backend modules with real PostgreSQL operations.

require('dotenv').config();
const http = require('http');
const bcrypt = require('bcrypt');
const app = require('../app');
const { sequelize, User, Category, Product, ProductVariant, Inventory } = require('../models');
const generateToken = require('../utils/generateToken');

async function runMasterTests() {
  console.log('🚀 Running PR3 – Master Backend End-to-End Test Suite (Phases 4 - 16)...\n');

  await sequelize.authenticate();

  // Create test actors for Customer, Admin, Delivery, Business, Supplier
  const testUsersData = [
    { firstName: 'Cust', lastName: 'User', email: 'master.cust@test.com', role: 'customer' },
    { firstName: 'Admin', lastName: 'Boss', email: 'master.admin@test.com', role: 'admin' },
    { firstName: 'Driver', lastName: 'Fast', email: 'master.delivery@test.com', role: 'delivery' },
    { firstName: 'Biz', lastName: 'Owner', email: 'master.biz@test.com', role: 'business' },
    { firstName: 'Vendor', lastName: 'Supply', email: 'master.supplier@test.com', role: 'supplier' },
  ];

  const testEmails = testUsersData.map((u) => u.email);

  const cleanTestUsers = async () => {
    const existing = await User.findAll({ where: { email: testEmails } });
    const userIds = existing.map((u) => u.id);
    if (userIds.length > 0) {
      const idList = userIds.join(',');
      await sequelize.query(`DELETE FROM "notifications" WHERE "user_id" IN (${idList});`);
      await sequelize.query(`DELETE FROM "return_items" WHERE "order_item_id" IN (SELECT id FROM "order_items" WHERE "order_id" IN (SELECT id FROM "orders" WHERE "user_id" IN (${idList})));`);
      await sequelize.query(`DELETE FROM "return_requests" WHERE "user_id" IN (${idList});`);
      await sequelize.query(`DELETE FROM "deliveries" WHERE "order_id" IN (SELECT id FROM "orders" WHERE "user_id" IN (${idList})) OR "delivery_staff_id" IN (${idList});`);
      await sequelize.query(`DELETE FROM "payments" WHERE "order_id" IN (SELECT id FROM "orders" WHERE "user_id" IN (${idList}));`);
      await sequelize.query(`DELETE FROM "order_items" WHERE "order_id" IN (SELECT id FROM "orders" WHERE "user_id" IN (${idList}));`);
      await sequelize.query(`DELETE FROM "orders" WHERE "user_id" IN (${idList});`);
      await sequelize.query(`DELETE FROM "cart_items" WHERE "cart_id" IN (SELECT id FROM "carts" WHERE "user_id" IN (${idList}));`);
      await sequelize.query(`DELETE FROM "carts" WHERE "user_id" IN (${idList});`);
      await sequelize.query(`DELETE FROM "stock_movements" WHERE "user_id" IN (${idList});`);
      await sequelize.query(`DELETE FROM "production_records" WHERE "worker_id" IN (${idList});`);
      await sequelize.query(`DELETE FROM "quality_inspections" WHERE "inspector_id" IN (${idList});`);
      await sequelize.query(`DELETE FROM "manufacturing_orders" WHERE "assigned_worker_id" IN (${idList});`);
      await sequelize.query(`DELETE FROM "business_profiles" WHERE "user_id" IN (${idList});`);
      await sequelize.query(`DELETE FROM "supplier_profiles" WHERE "user_id" IN (${idList});`);
      await User.destroy({ where: { id: userIds } });
    }
  };

  await cleanTestUsers();

  const tokens = {};
  const users = {};

  for (const u of testUsersData) {
    const passwordHash = await bcrypt.hash('Secret123!', 12);
    const created = await User.create({
      firstName: u.firstName,
      lastName: u.lastName,
      email: u.email,
      phone: '0771234567',
      passwordHash,
      role: u.role,
      isActive: true,
    });
    users[u.role] = created;
    tokens[u.role] = generateToken({ sub: created.id, id: created.id, role: created.role });
  }

  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  const baseUrl = `http://localhost:${port}/api`;

  let passed = 0;
  const total = 16;

  try {
    // -------------------------------------------------------------
    // Test 1: Category Management (Phase 4)
    // -------------------------------------------------------------
    console.log('--- Test 1: Category Creation & Listing (Phase 4) ---');
    const catRes = await fetch(`${baseUrl}/products/categories`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokens.admin}`,
      },
      body: JSON.stringify({
        name: `Test Category ${Date.now()}`,
        description: 'Quality apparel category',
      }),
    });
    const catData = await catRes.json();
    console.log(`Create Category Status: ${catRes.status} (Expected 201)`);
    if (catRes.status !== 201) throw new Error('Test 1 Failed: Category creation failed');
    const categoryId = catData.data.id;
    console.log(`✔ Test 1 Passed: Category ID ${categoryId} created\n`);
    passed++;

    // -------------------------------------------------------------
    // Test 2: Product & Variant Creation with Stock (Phase 4)
    // -------------------------------------------------------------
    console.log('--- Test 2: Product & Variant Creation (Phase 4) ---');
    const testSku = `SKU-TSHIRT-${Date.now()}`;
    const prodRes = await fetch(`${baseUrl}/products`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokens.admin}`,
      },
      body: JSON.stringify({
        category_id: categoryId,
        name: 'Premium Cotton Polo T-Shirt',
        description: '100% breathable organic cotton',
        variants: [
          {
            sku: testSku,
            size: 'L',
            color: 'Navy Blue',
            price: 2500.00,
            initial_stock: 50,
          },
        ],
      }),
    });
    const prodData = await prodRes.json();
    console.log(`Create Product Status: ${prodRes.status} (Expected 201)`);
    if (prodRes.status !== 201) throw new Error('Test 2 Failed: Product creation failed');
    const product = prodData.data;
    const variantId = product.variants[0].id;
    console.log(`✔ Test 2 Passed: Product ID ${product.id}, Variant SKU: ${testSku}, Initial Stock: 50\n`);
    passed++;

    // -------------------------------------------------------------
    // Test 3: Product Search, Filter & Pagination (Phase 4)
    // -------------------------------------------------------------
    console.log('--- Test 3: Product Search & Pagination (Phase 4) ---');
    const searchRes = await fetch(`${baseUrl}/products?search=Cotton&category_id=${categoryId}&page=1&limit=5`);
    const searchData = await searchRes.json();
    console.log(`Search Status: ${searchRes.status}, Total matches: ${searchData.total}`);
    if (searchRes.status !== 200 || searchData.data.length === 0) throw new Error('Test 3 Failed: Product search');
    console.log(`✔ Test 3 Passed: Found ${searchData.data.length} product(s) matching criteria\n`);
    passed++;

    // -------------------------------------------------------------
    // Test 4: Cart Management & Stock Check (Phase 6)
    // -------------------------------------------------------------
    console.log('--- Test 4: Cart Operations (Phase 6) ---');
    const cartRes = await fetch(`${baseUrl}/cart/items`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokens.customer}`,
      },
      body: JSON.stringify({
        product_variant_id: variantId,
        quantity: 2,
      }),
    });
    const cartData = await cartRes.json();
    console.log(`Add to Cart Status: ${cartRes.status}, Subtotal: LKR ${cartData.data.subtotal}`);
    if (cartRes.status !== 200 || cartData.data.subtotal !== 5000) throw new Error('Test 4 Failed: Cart calculation');
    console.log('✔ Test 4 Passed: 2 units added to cart, Subtotal calculated correctly\n');
    passed++;

    // -------------------------------------------------------------
    // Test 5: Order Checkout & Stock Decrement (Phase 7)
    // -------------------------------------------------------------
    console.log('--- Test 5: Order Checkout via Database Transaction (Phase 7) ---');
    const orderRes = await fetch(`${baseUrl}/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokens.customer}`,
      },
      body: JSON.stringify({
        shipping_name: 'Charlie Customer',
        shipping_phone: '0771234567',
        shipping_address: 'No 45, Galle Road',
        shipping_city: 'Colombo',
      }),
    });
    const orderData = await orderRes.json();
    console.log(`Order Status: ${orderRes.status} (Expected 201), Order #: ${orderData.data.orderNumber || orderData.data.order_number}`);
    if (orderRes.status !== 201) throw new Error('Test 5 Failed: Order creation failed');
    const orderId = orderData.data.id;

    // Verify inventory was automatically decremented from 50 to 48
    const updatedInv = await Inventory.findOne({ where: { product_variant_id: variantId } });
    console.log(`Inventory Stock after Order: ${updatedInv.quantity} (Expected 48)`);
    if (updatedInv.quantity !== 48) throw new Error('Test 5 Failed: Inventory was not decremented');
    console.log('✔ Test 5 Passed: Order created, stock atomically decremented in PostgreSQL\n');
    passed++;

    // -------------------------------------------------------------
    // Test 6: Payment Verification (Phase 8)
    // -------------------------------------------------------------
    console.log('--- Test 6: Payment Verification (Phase 8) ---');
    const initPay = await fetch(`${baseUrl}/payments/initiate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokens.customer}`,
      },
      body: JSON.stringify({ order_id: orderId }),
    });
    const initPayData = await initPay.json();
    const txnId = initPayData.data.transaction_id;

    const verifyPay = await fetch(`${baseUrl}/payments/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokens.customer}`,
      },
      body: JSON.stringify({ transaction_id: txnId, status: 'successful' }),
    });
    const verifyData = await verifyPay.json();
    const payStatus = verifyData.data?.paymentStatus || verifyData.data?.payment_status || verifyData.data?.status;
    console.log(`Payment Verify Status: ${verifyPay.status}, Payment Status: ${payStatus}`);
    if (verifyPay.status !== 200 || payStatus !== 'successful') throw new Error('Test 6 Failed');
    console.log('✔ Test 6 Passed: Payment verified and order confirmed\n');
    passed++;

    // -------------------------------------------------------------
    // Test 7: Order Cancellation & Inventory Restoration (Phase 7)
    // -------------------------------------------------------------
    console.log('--- Test 7: Order Cancellation & Stock Restoration (Phase 7) ---');
    // Place a secondary order to test cancellation
    await fetch(`${baseUrl}/cart/items`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokens.customer}` },
      body: JSON.stringify({ product_variant_id: variantId, quantity: 3 }),
    });
    const order2Res = await fetch(`${baseUrl}/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokens.customer}` },
      body: JSON.stringify({ shipping_name: 'Test Cancel' }),
    });
    const order2Data = await order2Res.json();
    const order2Id = order2Data.data.id;

    // Stock should now be 45
    const invBeforeCancel = await Inventory.findOne({ where: { product_variant_id: variantId } });
    console.log(`Stock before cancel: ${invBeforeCancel.quantity} (Expected 45)`);

    // Cancel order 2
    const cancelRes = await fetch(`${baseUrl}/orders/${order2Id}/cancel`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokens.customer}` },
    });
    console.log(`Cancel Status: ${cancelRes.status} (Expected 200)`);
    const invAfterCancel = await Inventory.findOne({ where: { product_variant_id: variantId } });
    console.log(`Stock after cancel: ${invAfterCancel.quantity} (Expected 48)`);
    if (invAfterCancel.quantity !== 48) throw new Error('Test 7 Failed: Stock was not restored on cancel');
    console.log('✔ Test 7 Passed: Order cancelled and stock restored to 48\n');
    passed++;

    // -------------------------------------------------------------
    // Test 8: Inventory Adjustments & Movement Audit (Phase 9)
    // -------------------------------------------------------------
    console.log('--- Test 8: Manual Stock Adjustment & Audit Trail (Phase 9) ---');
    const adjRes = await fetch(`${baseUrl}/inventory/adjust`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokens.admin}`,
      },
      body: JSON.stringify({
        product_variant_id: variantId,
        quantity: 10,
        reason: 'Warehouse restock from factory',
      }),
    });
    const adjData = await adjRes.json();
    console.log(`Adjust Status: ${adjRes.status}, New Stock: ${adjData.data.inventory.quantity} (Expected 58)`);
    if (adjData.data.inventory.quantity !== 58) throw new Error('Test 8 Failed: Stock adjustment failed');

    // Fetch movements
    const movRes = await fetch(`${baseUrl}/inventory/movements/${variantId}`, {
      headers: { Authorization: `Bearer ${tokens.admin}` },
    });
    const movData = await movRes.json();
    console.log(`Movement Audit Count: ${movData.count} (Expected >= 3 movements)`);
    if (movData.count < 3) throw new Error('Test 8 Failed: Movement audit trail missing');
    console.log('✔ Test 8 Passed: Inventory adjusted and stock movements recorded\n');
    passed++;

    // -------------------------------------------------------------
    // Test 9: Manufacturing Work Order (Phase 10)
    // -------------------------------------------------------------
    console.log('--- Test 9: Manufacturing Work Order Creation (Phase 10) ---');
    const moRes = await fetch(`${baseUrl}/manufacturing`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokens.admin}`,
      },
      body: JSON.stringify({
        product_id: product.id,
        product_variant_id: variantId,
        target_quantity: 100,
        raw_materials: { fabric: 'Organic Cotton Pique', buttons: 3 },
      }),
    });
    const moData = await moRes.json();
    console.log(`Work Order Status: ${moRes.status} (Expected 201), Order #: ${moData.data.order_number}`);
    if (moRes.status !== 201) throw new Error('Test 9 Failed');
    const moId = moData.data.id;
    console.log('✔ Test 9 Passed: Manufacturing order created\n');
    passed++;

    // -------------------------------------------------------------
    // Test 10: Production Stage Progress (Phase 11)
    // -------------------------------------------------------------
    console.log('--- Test 10: Production Stage Progress (Phase 11) ---');
    const prodStageRes = await fetch(`${baseUrl}/manufacturing/production`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokens.admin}`,
      },
      body: JSON.stringify({
        manufacturing_order_id: moId,
        stage: 'cutting',
        quantity_processed: 100,
      }),
    });
    const prodStageData = await prodStageRes.json();
    console.log(`Production Stage Status: ${prodStageRes.status} (Expected 201), Stage: ${prodStageData.data.stage}`);
    if (prodStageRes.status !== 201) throw new Error('Test 10 Failed');
    console.log('✔ Test 10 Passed: Cutting stage completed for work order\n');
    passed++;

    // -------------------------------------------------------------
    // Test 11: Quality Inspection & Stock Crediting (Phase 12)
    // -------------------------------------------------------------
    console.log('--- Test 11: QC Inspection & Approved Stock Transfer (Phase 12) ---');
    const invBeforeQc = await Inventory.findOne({ where: { product_variant_id: variantId } });
    console.log(`Inventory before QC: ${invBeforeQc.quantity}`);

    const qcRes = await fetch(`${baseUrl}/manufacturing/inspection`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokens.admin}`,
      },
      body: JSON.stringify({
        manufacturing_order_id: moId,
        total_inspected: 100,
        approved_quantity: 95,
        rejected_quantity: 5,
        defect_details: '5 items had minor stitching defects',
      }),
    });
    const qcData = await qcRes.json();
    console.log(`QC Status: ${qcRes.status} (Expected 201), Result: ${qcData.data.status}`);

    const invAfterQc = await Inventory.findOne({ where: { product_variant_id: variantId } });
    console.log(`Inventory after QC: ${invAfterQc.quantity} (Expected ${invBeforeQc.quantity + 95})`);
    if (invAfterQc.quantity !== invBeforeQc.quantity + 95) {
      throw new Error('Test 11 Failed: Only approved units (95) should be added to inventory');
    }
    console.log('✔ Test 11 Passed: Only approved 95 units credited to sellable stock\n');
    passed++;

    // -------------------------------------------------------------
    // Test 12: Delivery Management Lifecycle (Phase 13)
    // -------------------------------------------------------------
    console.log('--- Test 12: Delivery Dispatch & Status Tracking (Phase 13) ---');
    const delivRes = await fetch(`${baseUrl}/deliveries`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokens.admin}`,
      },
      body: JSON.stringify({
        order_id: orderId,
        delivery_staff_id: users.delivery.id,
      }),
    });
    const delivData = await delivRes.json();
    console.log(`Dispatch Status: ${delivRes.status} (Expected 201), Tracking: ${delivData.data.tracking_number}`);
    if (delivRes.status !== 201) throw new Error('Test 12 Failed: Delivery creation');
    const deliveryId = delivData.data.id;

    // Delivery staff marks as delivered
    const deliverUpdate = await fetch(`${baseUrl}/deliveries/${deliveryId}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokens.delivery}`,
      },
      body: JSON.stringify({ status: 'delivered' }),
    });
    const deliverUpdateData = await deliverUpdate.json();
    const delivUpdateStatus = deliverUpdateData.data?.deliveryStatus || deliverUpdateData.data?.delivery_status || deliverUpdateData.data?.status;
    console.log(`Delivery Update Status: ${deliverUpdate.status}, Delivery Status: ${delivUpdateStatus}`);
    if (deliverUpdate.status !== 200 || delivUpdateStatus !== 'delivered') throw new Error('Test 12 Failed');
    console.log('✔ Test 12 Passed: Order marked delivered by delivery personnel\n');
    passed++;

    // -------------------------------------------------------------
    // Test 13: Return Request & Restock Inspection (Phase 14)
    // -------------------------------------------------------------
    console.log('--- Test 13: Customer Return Request & Inspection (Phase 14) ---');
    const orderDetails = await fetch(`${baseUrl}/orders/${orderId}`, {
      headers: { Authorization: `Bearer ${tokens.customer}` },
    });
    const orderDetailsData = await orderDetails.json();
    const orderItemId = orderDetailsData.data.order_items[0].id;

    // Customer requests return
    const returnReqRes = await fetch(`${baseUrl}/returns`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokens.customer}`,
      },
      body: JSON.stringify({
        order_id: orderId,
        reason: 'Slightly loose fit',
        items: [{ order_item_id: orderItemId, quantity: 1 }],
      }),
    });
    const returnReqData = await returnReqRes.json();
    console.log(`Return Request Status: ${returnReqRes.status} (Expected 201), RMA: ${returnReqData.data.request_number}`);
    if (returnReqRes.status !== 201) throw new Error('Test 13 Failed');
    const returnId = returnReqData.data.id;

    // Admin approves return request
    await fetch(`${baseUrl}/returns/${returnId}/review`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokens.admin}`,
      },
      body: JSON.stringify({ status: 'approved' }),
    });

    // Admin inspects returned physical item and restocks
    const stockBeforeRma = (await Inventory.findOne({ where: { product_variant_id: variantId } })).quantity;
    const rmaList = await fetch(`${baseUrl}/returns`, {
      headers: { Authorization: `Bearer ${tokens.admin}` },
    });
    const rmaListData = await rmaList.json();
    const rmaItemId = rmaListData.data[0].return_items[0].id;

    const inspectRes = await fetch(`${baseUrl}/returns/items/${rmaItemId}/inspect`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokens.admin}`,
      },
      body: JSON.stringify({ is_restockable: true }),
    });
    console.log(`Inspect & Restock Status: ${inspectRes.status} (Expected 200)`);
    const stockAfterRma = (await Inventory.findOne({ where: { product_variant_id: variantId } })).quantity;
    console.log(`Stock before RMA: ${stockBeforeRma}, Stock after RMA restock: ${stockAfterRma}`);
    if (stockAfterRma !== stockBeforeRma + 1) throw new Error('Test 13 Failed: Stock was not restored after good RMA');
    console.log('✔ Test 13 Passed: Returned item inspected and safely restocked\n');
    passed++;

    // -------------------------------------------------------------
    // Test 14: Business & Supplier Profiles (Phase 5)
    // -------------------------------------------------------------
    console.log('--- Test 14: Business and Supplier Profiles (Phase 5) ---');
    const bizProfRes = await fetch(`${baseUrl}/suppliers/profile/me`, {
      headers: { Authorization: `Bearer ${tokens.business}` },
    });
    const bizProfData = await bizProfRes.json();
    console.log(`Business Profile Status: ${bizProfRes.status}, Company: ${bizProfData.data.profile.company_name}`);

    const suppProfRes = await fetch(`${baseUrl}/suppliers/profile/me`, {
      headers: { Authorization: `Bearer ${tokens.supplier}` },
    });
    const suppProfData = await suppProfRes.json();
    console.log(`Supplier Profile Status: ${suppProfRes.status}, Code: ${suppProfData.data.profile.supplier_code}`);

    if (bizProfRes.status === 200 && suppProfRes.status === 200) {
      console.log('✔ Test 14 Passed: Business & Supplier profiles retrieved successfully\n');
      passed++;
    } else {
      throw new Error('Test 14 Failed');
    }

    // -------------------------------------------------------------
    // Test 15: Notifications System (Phase 15)
    // -------------------------------------------------------------
    console.log('--- Test 15: Notifications System (Phase 15) ---');
    const notifRes = await fetch(`${baseUrl}/notifications`, {
      headers: { Authorization: `Bearer ${tokens.customer}` },
    });
    const notifData = await notifRes.json();
    console.log(`Notification Count for Customer: ${notifData.count} (Expected >= 3 alerts)`);

    const unreadRes = await fetch(`${baseUrl}/notifications/unread-count`, {
      headers: { Authorization: `Bearer ${tokens.customer}` },
    });
    const unreadData = await unreadRes.json();
    console.log(`Unread Notifications: ${unreadData.data.unread_count}`);

    // Mark all as read
    const markRes = await fetch(`${baseUrl}/notifications/read-all`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${tokens.customer}` },
    });
    console.log(`Mark Read Status: ${markRes.status} (Expected 200)`);
    if (notifData.count > 0 && markRes.status === 200) {
      console.log('✔ Test 15 Passed: In-app notifications verified\n');
      passed++;
    } else {
      throw new Error('Test 15 Failed');
    }

    // -------------------------------------------------------------
    // Test 16: Role-Based Dashboard & Analytics (Phase 16)
    // -------------------------------------------------------------
    console.log('--- Test 16: Role-Based Dashboard Reports (Phase 16) ---');
    const adminDash = await (await fetch(`${baseUrl}/dashboard`, { headers: { Authorization: `Bearer ${tokens.admin}` } })).json();
    console.log('Admin Metrics:', JSON.stringify(adminDash.data.metrics));

    const custDash = await (await fetch(`${baseUrl}/dashboard`, { headers: { Authorization: `Bearer ${tokens.customer}` } })).json();
    console.log('Customer Metrics:', JSON.stringify(custDash.data.metrics));

    const delivDash = await (await fetch(`${baseUrl}/dashboard`, { headers: { Authorization: `Bearer ${tokens.delivery}` } })).json();
    console.log('Delivery Metrics:', JSON.stringify(delivDash.data.metrics));

    if (adminDash.success && custDash.success && delivDash.success) {
      console.log('✔ Test 16 Passed: Role-scoped analytics dashboards verified\n');
      passed++;
    } else {
      throw new Error('Test 16 Failed');
    }

    console.log('================================================================');
    console.log(`🎉 ALL ${passed}/${total} MASTER BACKEND TESTS PASSED WITH ZERO ERRORS!`);
    console.log('================================================================');
  } finally {
    // Clean up test users
    await cleanTestUsers();
    server.close();
  }
}

runMasterTests().catch((err) => {
  console.error('❌ Master Test Error:', err);
  process.exit(1);
});
