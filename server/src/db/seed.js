const bcrypt = require('bcryptjs');
const db = require('./index');
const migrate = require('./migrate');

async function seed() {
  console.log('[Seed] Running migrations first...');
  await migrate();

  console.log('[Seed] Seeding initial users...');
  const saltRounds = 10;

  const users = [
    {
      name: 'System Admin',
      email: 'admin@bughunt.local',
      password: 'AdminPass123!',
      role: 'ADMIN'
    },
    {
      name: 'Alex Developer',
      email: 'dev1@bughunt.local',
      password: 'DevPass123!',
      role: 'DEVELOPER'
    },
    {
      name: 'Sarah Developer',
      email: 'dev2@bughunt.local',
      password: 'DevPass123!',
      role: 'DEVELOPER'
    },
    {
      name: 'Riley Reporter',
      email: 'reporter1@bughunt.local',
      password: 'ReporterPass123!',
      role: 'REPORTER'
    },
    {
      name: 'Sam Researcher',
      email: 'sec1@bughunt.local',
      password: 'SecPass123!',
      role: 'SECURITY_RESEARCHER'
    }
  ];

  for (const user of users) {
    const existing = await db.get('SELECT id FROM users WHERE email = ?', [user.email]);
    if (!existing) {
      const passwordHash = await bcrypt.hash(user.password, saltRounds);
      await db.run(
        'INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)',
        [user.name, user.email, passwordHash, user.role]
      );
      console.log(`[Seed] Created user: ${user.email} (${user.role})`);
    } else {
      console.log(`[Seed] User already exists: ${user.email}`);
    }
  }

  // Seed sample bug if table empty
  const bugCount = await db.get('SELECT COUNT(*) as count FROM bugs');
  if (bugCount.count === 0) {
    const reporter = await db.get("SELECT id FROM users WHERE role = 'REPORTER' LIMIT 1");
    const dev = await db.get("SELECT id FROM users WHERE role = 'DEVELOPER' LIMIT 1");

    if (reporter && dev) {
      const bugResult = await db.run(
        `INSERT INTO bugs (
          bug_code, title, description, category, severity, priority, status,
          reporter_id, assigned_to, reproduction_steps, expected_result, actual_result
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          'BUG-0001',
          'JWT token expiration does not invalidate session immediately',
          'When token expires on client, background requests continue to retry without redirecting to login.',
          'Security',
          'HIGH',
          'HIGH',
          'ASSIGNED',
          reporter.id,
          dev.id,
          '1. Login as user\n2. Wait for expiration\n3. Trigger background call',
          'Session terminates and user is redirected to login',
          'App hangs in infinite retry loop'
        ]
      );

      const bugId = bugResult.lastID;

      // Seed comment
      await db.run(
        'INSERT INTO comments (bug_id, user_id, content) VALUES (?, ?, ?)',
        [bugId, dev.id, 'I am looking into this token refresh edge case.']
      );

      // Seed notification for developer
      await db.run(
        'INSERT INTO notifications (user_id, bug_id, message) VALUES (?, ?, ?)',
        [dev.id, bugId, 'You have been assigned to bug BUG-0001.']
      );

      // Seed audit log
      await db.run(
        'INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details) VALUES (?, ?, ?, ?, ?)',
        [reporter.id, 'BUG_CREATED', 'BUG', bugId.toString(), 'Initial seed bug created BUG-0001']
      );

      console.log('[Seed] Created initial seed bug BUG-0001, comments, and notifications.');
    }
  }

  console.log('[Seed] Seeding completed successfully!');
}

if (require.main === module) {
  seed().then(() => {
    process.exit(0);
  }).catch((err) => {
    console.error('[Seed] Error:', err);
    process.exit(1);
  });
}

module.exports = seed;
