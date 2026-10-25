#!/usr/bin/env node
// Explicit, local operator action. No default database, no password/token output.
const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3');
const argv = process.argv.slice(2);
const value = flag => { const i = argv.indexOf(flag); return i < 0 ? '' : argv[i + 1]; };
const database = value('--database');
const name = value('--user');
if (!database || !path.isAbsolute(database) || !fs.existsSync(database) || !name || name.length > 64) {
  console.error('Usage: node scripts/economy-admin.cjs --database /absolute/existing/database.sq3 --user NAME [--apply]');
  process.exitCode = 1;
} else {
  const apply = argv.includes('--apply');
  const db = new sqlite3.Database(database, apply ? sqlite3.OPEN_READWRITE : sqlite3.OPEN_READONLY);
  db.get('SELECT id, name, roleId FROM user WHERE name = ?', [name], (error, user) => {
    if (error || !user || user.roleId === 1) {
      console.error(error ? 'Cannot read the selected database.' : 'User not found or banned.');
      process.exitCode = 1; db.close(); return;
    }
    console.log(`Database: ${database}\nUser: ${user.name} (#${user.id}), roleId=${user.roleId}`);
    if (!apply) { console.log('Preview only. Add --apply to grant roleId=4 (full existing administrator privileges).'); db.close(); return; }
    db.run('UPDATE user SET roleId = 4 WHERE id = ? AND roleId <> 1', [user.id], function (error) {
      if (error || this.changes !== 1) { console.error('Administrator update failed.'); process.exitCode = 1; }
      else console.log('Administrator enabled. Sign out and back in to refresh the navigation.');
      db.close();
    });
  });
}
