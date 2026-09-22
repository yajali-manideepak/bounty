const assert = require('assert');
const app = require('../src/app');

async function testPhase3() {
  console.log('[Test Phase 3] Starting Authentication & RBAC tests...');

  const server = app.listen(5098);
  const baseUrl = 'http://localhost:5098/api';

  try {
    // 1. Admin registration attempt should fail with 403
    const adminRegRes = await fetch(`${baseUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Hacker Admin',
        email: 'hacker@evil.com',
        password: 'Password123!',
        role: 'ADMIN'
      })
    });
    assert.strictEqual(adminRegRes.status, 403, 'Public ADMIN registration must be forbidden');
    console.log('✔ Public ADMIN registration properly blocked with 403');

    // 2. Reporter Registration
    const testReporterEmail = `test_reporter_${Date.now()}@bughunt.local`;
    const repRegRes = await fetch(`${baseUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Test Reporter',
        email: testReporterEmail,
        password: 'ReporterPass123!',
        role: 'REPORTER'
      })
    });
    const repRegData = await repRegRes.json();
    assert.strictEqual(repRegRes.status, 201, 'Reporter registration should succeed');
    assert.ok(repRegData.token, 'Should return JWT token');
    assert.strictEqual(repRegData.user.role, 'REPORTER');
    console.log('✔ Reporter registered successfully');

    // 3. Reporter Login
    const repLoginRes = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testReporterEmail,
        password: 'ReporterPass123!'
      })
    });
    const repLoginData = await repLoginRes.json();
    assert.strictEqual(repLoginRes.status, 200);
    const reporterToken = repLoginData.token;
    console.log('✔ Reporter logged in successfully');

    // 4. Admin Login with seeded credentials
    const adminLoginRes = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@bughunt.local',
        password: 'AdminPass123!'
      })
    });
    const adminLoginData = await adminLoginRes.json();
    assert.strictEqual(adminLoginRes.status, 200);
    assert.strictEqual(adminLoginData.user.role, 'ADMIN');
    const adminToken = adminLoginData.token;
    console.log('✔ Admin logged in with seeded credentials');

    // 5. Protected Endpoint /api/auth/me without token -> 401
    const unauthRes = await fetch(`${baseUrl}/auth/me`);
    assert.strictEqual(unauthRes.status, 401, 'Unauthenticated access should return 401');
    console.log('✔ Unauthenticated request properly rejected with 401');

    // 6. Protected Endpoint /api/auth/me with reporter token -> 200
    const authMeRes = await fetch(`${baseUrl}/auth/me`, {
      headers: { 'Authorization': `Bearer ${reporterToken}` }
    });
    const authMeData = await authMeRes.json();
    assert.strictEqual(authMeRes.status, 200);
    assert.strictEqual(authMeData.user.email, testReporterEmail);
    console.log('✔ Current-user endpoint /api/auth/me returns valid user');

    // 7. Role-protected endpoint: Reporter trying to access /api/auth/users (ADMIN only) -> 403
    const forbiddenRes = await fetch(`${baseUrl}/auth/users`, {
      headers: { 'Authorization': `Bearer ${reporterToken}` }
    });
    assert.strictEqual(forbiddenRes.status, 403, 'Reporter must not access admin-only endpoint');
    console.log('✔ Reporter access to Admin API correctly rejected with 403');

    // 8. Admin accessing /api/auth/users -> 200
    const adminUsersRes = await fetch(`${baseUrl}/auth/users`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    const adminUsersData = await adminUsersRes.json();
    assert.strictEqual(adminUsersRes.status, 200);
    assert.ok(Array.isArray(adminUsersData.data));
    console.log('✔ Admin successfully accessed /api/auth/users');

    console.log('--- ALL PHASE 3 AUTH & RBAC TESTS PASSED ---');
  } finally {
    server.close();
  }
}

testPhase3().catch(err => {
  console.error('Test Phase 3 Failed:', err);
  process.exit(1);
});
