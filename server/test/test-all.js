const assert = require('assert');
const app = require('../src/app');

async function runEndToEndTests() {
  console.log('====================================================');
  console.log('STARTING BUGHUNT PRO END-TO-END AUTOMATED TEST SUITE');
  console.log('====================================================\n');

  const server = app.listen(5097);
  const baseUrl = 'http://localhost:5097/api';

  try {
    // -------------------------------------------------------------
    // TEST 1: Register Reporter
    // -------------------------------------------------------------
    const reporterEmail = `rep_e2e_${Date.now()}@bughunt.local`;
    const regRes = await fetch(`${baseUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Jane Reporter',
        email: reporterEmail,
        password: 'Password123!',
        role: 'REPORTER'
      })
    });
    const regData = await regRes.json();
    assert.strictEqual(regRes.status, 201, 'Reporter registration failed');
    console.log('✔ TEST 1 PASSED: Registered Reporter successfully');

    // -------------------------------------------------------------
    // TEST 2: Login Reporter
    // -------------------------------------------------------------
    const loginRes = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: reporterEmail,
        password: 'Password123!'
      })
    });
    const loginData = await loginRes.json();
    assert.strictEqual(loginRes.status, 200, 'Reporter login failed');
    const reporterToken = loginData.token;
    const reporterId = loginData.user.id;
    console.log('✔ TEST 2 PASSED: Logged in Reporter');

    // -------------------------------------------------------------
    // TEST 3: Create Bug
    // -------------------------------------------------------------
    const createBugRes = await fetch(`${baseUrl}/bugs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${reporterToken}`
      },
      body: JSON.stringify({
        title: 'Buffer overflow vulnerability in image upload parser',
        description: 'Large PNG chunk headers cause segmentation fault in image buffer processing.',
        category: 'Security',
        severity: 'CRITICAL',
        priority: 'HIGH',
        reproduction_steps: '1. Navigate to upload\n2. Supply crafted PNG\n3. Observe crash',
        expected_result: 'File is validated and rejected with HTTP 400',
        actual_result: 'Process crashes with exit code 139'
      })
    });
    const createBugData = await createBugRes.json();
    assert.strictEqual(createBugRes.status, 201, 'Bug creation failed');
    assert.ok(createBugData.data.bug_code.startsWith('BUG-'), 'Bug code must match BUG-XXXX');
    assert.strictEqual(createBugData.data.status, 'OPEN');
    const bugId = createBugData.data.id;
    const bugCode = createBugData.data.bug_code;
    console.log(`✔ TEST 3 PASSED: Created Bug ${bugCode} (ID: ${bugId})`);

    // -------------------------------------------------------------
    // TEST 4: Verify Bug in Database
    // -------------------------------------------------------------
    const getBugRes = await fetch(`${baseUrl}/bugs/${bugId}`, {
      headers: { 'Authorization': `Bearer ${reporterToken}` }
    });
    const getBugData = await getBugRes.json();
    assert.strictEqual(getBugRes.status, 200);
    assert.strictEqual(getBugData.data.id, bugId);
    assert.strictEqual(getBugData.data.reporter_id, reporterId);
    console.log('✔ TEST 4 PASSED: Verified Bug in database via GET /api/bugs/:id');

    // -------------------------------------------------------------
    // TEST 5: Login Admin
    // -------------------------------------------------------------
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
    const adminToken = adminLoginData.token;
    console.log('✔ TEST 5 PASSED: Logged in Admin');

    // Fetch developers to get Alex Developer ID
    const devsRes = await fetch(`${baseUrl}/auth/developers`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    const devsData = await devsRes.json();
    assert.ok(devsData.data.length > 0, 'Must have seeded developers');
    const devAlex = devsData.data.find(d => d.email === 'dev1@bughunt.local');
    const devSarah = devsData.data.find(d => d.email === 'dev2@bughunt.local');
    assert.ok(devAlex, 'dev1@bughunt.local not found');
    console.log(`Found developer Alex (ID: ${devAlex.id})`);

    // -------------------------------------------------------------
    // TEST 6: Admin Assigns Bug to Developer Alex
    // -------------------------------------------------------------
    const assignRes = await fetch(`${baseUrl}/bugs/${bugId}/assign`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({ developer_id: devAlex.id })
    });
    const assignData = await assignRes.json();
    assert.strictEqual(assignRes.status, 200);
    assert.strictEqual(assignData.data.status, 'ASSIGNED');
    assert.strictEqual(assignData.data.assigned_to, devAlex.id);
    console.log('✔ TEST 6 PASSED: Admin assigned bug to Developer Alex');

    // -------------------------------------------------------------
    // TEST 7: Login Developer Alex & Verify Notification
    // -------------------------------------------------------------
    const devLoginRes = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'dev1@bughunt.local',
        password: 'DevPass123!'
      })
    });
    const devLoginData = await devLoginRes.json();
    assert.strictEqual(devLoginRes.status, 200);
    const devToken = devLoginData.token;

    const devNotifRes = await fetch(`${baseUrl}/notifications`, {
      headers: { 'Authorization': `Bearer ${devToken}` }
    });
    const devNotifData = await devNotifRes.json();
    assert.strictEqual(devNotifRes.status, 200);
    assert.ok(devNotifData.unreadCount >= 1, 'Developer should have unread notification');
    const assignedNotif = devNotifData.data.find(n => n.bug_id === bugId);
    assert.ok(assignedNotif, 'Developer should receive assignment notification');
    console.log('✔ TEST 7 PASSED: Developer Alex verified assignment notification');

    // Verify Developer Sarah does NOT see this bug as assigned
    const dev2LoginRes = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'dev2@bughunt.local',
        password: 'DevPass123!'
      })
    });
    const dev2Token = (await dev2LoginRes.json()).token;
    const dev2BugsRes = await fetch(`${baseUrl}/bugs`, {
      headers: { 'Authorization': `Bearer ${dev2Token}` }
    });
    const dev2BugsData = await dev2BugsRes.json();
    assert.ok(!dev2BugsData.data.some(b => b.id === bugId), 'Developer Sarah must not see bug assigned to Alex');
    console.log('✔ Verified Developer Sarah does not see bug assigned to Alex');

    // -------------------------------------------------------------
    // TEST 8 & 9: Developer Alex moves status to IN PROGRESS
    // -------------------------------------------------------------
    const inProgressRes = await fetch(`${baseUrl}/bugs/${bugId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${devToken}`
      },
      body: JSON.stringify({ status: 'IN PROGRESS' })
    });
    const inProgressData = await inProgressRes.json();
    assert.strictEqual(inProgressRes.status, 200);
    assert.strictEqual(inProgressData.data.status, 'IN PROGRESS');
    console.log('✔ TEST 8 & 9 PASSED: Developer Alex moved status to IN PROGRESS');

    // -------------------------------------------------------------
    // TEST 10: Add Comment as Developer
    // -------------------------------------------------------------
    const commentRes = await fetch(`${baseUrl}/bugs/${bugId}/comments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${devToken}`
      },
      body: JSON.stringify({
        content: 'I have patched the image buffer parser in commit #89ac12. Testing memory bounds.'
      })
    });
    const commentData = await commentRes.json();
    assert.strictEqual(commentRes.status, 201);
    assert.strictEqual(commentData.data.author_role, 'DEVELOPER');
    console.log('✔ TEST 10 PASSED: Developer Alex added progress comment');

    // -------------------------------------------------------------
    // TEST 11: Developer Alex moves status to FIXED
    // -------------------------------------------------------------
    const fixedRes = await fetch(`${baseUrl}/bugs/${bugId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${devToken}`
      },
      body: JSON.stringify({ status: 'FIXED' })
    });
    const fixedData = await fixedRes.json();
    assert.strictEqual(fixedRes.status, 200);
    assert.strictEqual(fixedData.data.status, 'FIXED');
    console.log('✔ TEST 11 PASSED: Developer Alex marked bug FIXED');

    // -------------------------------------------------------------
    // TEST 12 & 13: Reporter verifies notification for FIXED
    // -------------------------------------------------------------
    const repNotifRes = await fetch(`${baseUrl}/notifications`, {
      headers: { 'Authorization': `Bearer ${reporterToken}` }
    });
    const repNotifData = await repNotifRes.json();
    const fixedNotif = repNotifData.data.find(n => n.bug_id === bugId && n.message.includes('FIXED'));
    assert.ok(fixedNotif, 'Reporter should receive notification that bug is FIXED');
    console.log('✔ TEST 12 & 13 PASSED: Reporter received FIXED notification');

    // -------------------------------------------------------------
    // TEST 14: Move to UNDER VERIFICATION
    // -------------------------------------------------------------
    const underVerifRes = await fetch(`${baseUrl}/bugs/${bugId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${reporterToken}`
      },
      body: JSON.stringify({ status: 'UNDER VERIFICATION' })
    });
    const underVerifData = await underVerifRes.json();
    assert.strictEqual(underVerifRes.status, 200);
    assert.strictEqual(underVerifData.data.status, 'UNDER VERIFICATION');
    console.log('✔ TEST 14 PASSED: Reporter moved bug to UNDER VERIFICATION');

    // -------------------------------------------------------------
    // TEST 15: Reporter Verifies Bug (status -> VERIFIED)
    // -------------------------------------------------------------
    const verifRes = await fetch(`${baseUrl}/bugs/${bugId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${reporterToken}`
      },
      body: JSON.stringify({ status: 'VERIFIED' })
    });
    const verifData = await verifRes.json();
    assert.strictEqual(verifRes.status, 200);
    assert.strictEqual(verifData.data.status, 'VERIFIED');
    console.log('✔ TEST 15 PASSED: Reporter verified bug fix');

    // -------------------------------------------------------------
    // TEST 16: Close Bug (status -> CLOSED)
    // -------------------------------------------------------------
    const closeRes = await fetch(`${baseUrl}/bugs/${bugId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${reporterToken}`
      },
      body: JSON.stringify({ status: 'CLOSED' })
    });
    const closeData = await closeRes.json();
    assert.strictEqual(closeRes.status, 200);
    assert.strictEqual(closeData.data.status, 'CLOSED');
    console.log('✔ TEST 16 PASSED: Reporter closed bug');

    // -------------------------------------------------------------
    // TEST 17: Verify Real Dashboard Statistics
    // -------------------------------------------------------------
    const repStatsRes = await fetch(`${baseUrl}/dashboard/stats`, {
      headers: { 'Authorization': `Bearer ${reporterToken}` }
    });
    const repStats = await repStatsRes.json();
    assert.strictEqual(repStats.data.closedBugs, 1, 'Reporter closed bugs count should be 1');

    const adminStatsRes = await fetch(`${baseUrl}/dashboard/stats`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    const adminStats = await adminStatsRes.json();
    assert.ok(adminStats.data.totalBugs >= 2, 'Admin stats total bugs should be >= 2');
    console.log('✔ TEST 17 PASSED: Verified real dynamic dashboard statistics');

    // -------------------------------------------------------------
    // TEST 18: Verify Audit Logs
    // -------------------------------------------------------------
    const auditRes = await fetch(`${baseUrl}/admin/audit-logs`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    const auditData = await auditRes.json();
    assert.strictEqual(auditRes.status, 200);
    assert.ok(auditData.data.length > 0, 'Audit logs must contain recorded actions');
    const actions = auditData.data.map(l => l.action);
    assert.ok(actions.includes('BUG_CREATED'), 'Should record BUG_CREATED');
    assert.ok(actions.includes('BUG_ASSIGNED'), 'Should record BUG_ASSIGNED');
    assert.ok(actions.includes('STATUS_CHANGED'), 'Should record STATUS_CHANGED');
    console.log('✔ TEST 18 PASSED: Admin verified complete audit logs trail');

    // -------------------------------------------------------------
    // TEST 19: Security & Unauthorized Access Tests (IDOR / RBAC)
    // -------------------------------------------------------------
    // 19a: Reporter Sarah (dev2) attempting to access another user's bug directly
    const unauthorizedBugRes = await fetch(`${baseUrl}/bugs/${bugId}`, {
      headers: { 'Authorization': `Bearer ${dev2Token}` }
    });
    assert.strictEqual(unauthorizedBugRes.status, 403, 'Unauthorized bug access must be 403 Forbidden');
    console.log('✔ TEST 19a PASSED: IDOR protection prevented unauthorized bug access');

    // 19b: Non-admin trying to assign bug
    const unauthAssignRes = await fetch(`${baseUrl}/bugs/${bugId}/assign`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${reporterToken}`
      },
      body: JSON.stringify({ developer_id: devAlex.id })
    });
    assert.strictEqual(unauthAssignRes.status, 403, 'Non-admin assigning bug must return 403');
    console.log('✔ TEST 19b PASSED: RBAC prevented non-admin bug assignment');

    // 19c: Invalid status transition (e.g. CLOSED to IN PROGRESS without reopening)
    const invalidTransRes = await fetch(`${baseUrl}/bugs/${bugId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${reporterToken}`
      },
      body: JSON.stringify({ status: 'IN PROGRESS' })
    });
    assert.strictEqual(invalidTransRes.status, 400, 'Invalid transition should be 400 Bad Request');
    console.log('✔ TEST 19c PASSED: State machine prevented invalid status transition');

    console.log('\n====================================================');
    console.log('ALL BACKEND & WORKFLOW TESTS (PHASES 1-12) PASSED!');
    console.log('====================================================');
  } finally {
    server.close();
  }
}

runEndToEndTests().then(() => {
  process.exit(0);
}).catch(err => {
  console.error('Test Suite Failed:', err);
  process.exit(1);
});
