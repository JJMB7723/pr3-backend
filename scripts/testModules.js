// scripts/testModules.js – Verification script for all 10 modules
const http = require('http');
const app = require('../app');

const server = http.createServer(app);

server.listen(0, async () => {
  const port = server.address().port;
  console.log(`Ephemeral test server running on port: ${port}`);

  const endpoints = [
    { path: '/', method: 'GET' },
    { path: '/api/health', method: 'GET' },
    { path: '/api/products', method: 'GET' },
    { path: '/api/inventory', method: 'GET' },
    { path: '/api/cart?user_id=1', method: 'GET' },
    { path: '/api/orders', method: 'GET' },
    { path: '/api/payments/order/1', method: 'GET' },
    { path: '/api/deliveries', method: 'GET' },
    { path: '/api/returns', method: 'GET' },
    { path: '/api/suppliers', method: 'GET' },
    { path: '/api/quotations', method: 'GET' },
  ];

  let passed = 0;
  for (const ep of endpoints) {
    try {
      const res = await fetch(`http://localhost:${port}${ep.path}`, { method: ep.method });
      const data = await res.json();
      console.log(`[PASS] ${ep.method} ${ep.path} -> HTTP ${res.status}`);
      passed++;
    } catch (err) {
      console.error(`[FAIL] ${ep.method} ${ep.path} -> Error: ${err.message}`);
    }
  }

  console.log(`\nCompleted module tests: ${passed}/${endpoints.length} passed.`);
  server.close(() => {
    process.exit(passed === endpoints.length ? 0 : 1);
  });
});
