const fs = require('fs');
const path = require('path');
const db = require('./index');

async function migrate() {
  console.log('[Migration] Starting database migration...');
  const schemaPath = path.join(__dirname, 'schema.sql');
  const schemaSql = fs.readFileSync(schemaPath, 'utf8');

  try {
    await db.exec(schemaSql);
    console.log('[Migration] Schema executed successfully.');

    // Verify all 5 tables exist
    const tables = await db.all(
      "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name;"
    );
    console.log('[Migration] Existing tables:', tables.map(t => t.name).join(', '));
    return tables;
  } catch (err) {
    console.error('[Migration] Failed:', err);
    throw err;
  }
}

if (require.main === module) {
  migrate().then(() => {
    console.log('[Migration] Finished.');
    process.exit(0);
  }).catch((err) => {
    console.error(err);
    process.exit(1);
  });
}

module.exports = migrate;
