#!/usr/bin/env node
'use strict';
// Create local-only credentials once. Existing configuration is never rewritten.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const root = path.resolve(__dirname, '..');
const server = path.join(root, 'ptcg-server');
const target = path.join(server, '.env');
function refuseLinks(file) {
  for (let current = file; ; current = path.dirname(current)) {
    try { if (fs.lstatSync(current).isSymbolicLink()) throw new Error('Refusing a symbolic-link configuration path.'); }
    catch (error) { if (error.code !== 'ENOENT') throw error; }
    if (path.dirname(current) === current) break;
  }
}
try {
  refuseLinks(target);
  if (process.argv.includes('--show-room-password')) {
    const text = fs.readFileSync(target, 'utf8');
    const value = text.match(/^DUO_ROOM_PASSWORD=(.*)$/m)?.[1]?.trim();
    if (!value) throw new Error('Registration is disabled. Configure DUO_ROOM_PASSWORD in ptcg-server/.env.');
    process.stdout.write(value + '\n');
  } else if (process.argv.length !== 2) {
    throw new Error('Usage: node deploy/init-config.cjs [--show-room-password]');
  } else if (fs.existsSync(target)) {
    if (!fs.statSync(target).isFile()) throw new Error('Configuration is not a regular file.');
    console.log('Existing ptcg-server/.env kept.');
  } else {
    let text = fs.readFileSync(path.join(server, '.env.example'), 'utf8');
    for (const [key, bytes] of [['secret', 32], ['DUO_ROOM_PASSWORD', 18]]) {
      text = text.replace(new RegExp(`^${key}=.*$`, 'm'), `${key}=${crypto.randomBytes(bytes).toString('hex')}`);
    }
    fs.writeFileSync(target, text, { flag: 'wx', mode: 0o600 });
    console.log('Created private ptcg-server/.env with independent random credentials.');
    console.log('View the local registration invitation with: npm run room:invite');
  }
} catch (error) {
  console.error(error.code === 'ENOENT' ? 'Missing configuration template; run from the complete source checkout.' : error.message);
  process.exitCode = 1;
}
