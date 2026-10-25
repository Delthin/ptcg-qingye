#!/usr/bin/env node
// Exercise the real maintenance method and real SQLite driver in a fresh in-memory DB.
require('reflect-metadata');
const assert = require('node:assert/strict');
const { Storage, DisconnectedSession } = require('../output/storage');
const { ReconnectionCleanupService } = require('../output/backend/services/reconnection-cleanup.service');
process.env.STORAGE_TYPE = 'sqlite';
process.env.STORAGE_DATABASE = ':memory:';
const storage = new Storage();
(async () => {
  await storage.connect();
  const original = DisconnectedSession.query;
  const queries = [], failures = [];
  DisconnectedSession.query = async function(sql, ...args) {
    queries.push(sql);
    try { return await original.call(this, sql, ...args); }
    catch (error) { failures.push(error.message); throw error; }
  };
  try {
    const service = Object.create(ReconnectionCleanupService.prototype);
    await service.optimizeSessionTable();
    assert.deepEqual(queries, ['PRAGMA optimize']);
    assert.deepEqual(failures, []);
    assert.deepEqual(await storage.manager.query('PRAGMA foreign_key_check'), []);
    console.log(JSON.stringify({ passed: true, queries, foreignKeyErrors: 0 }));
  } finally {
    DisconnectedSession.query = original;
    await storage.disconnect();
  }
})().catch(error => { console.error(error.message); process.exitCode = 1; });
