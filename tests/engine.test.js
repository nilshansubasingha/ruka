import test from 'node:test';
import assert from 'node:assert/strict';
import { runSelfTests } from '../src/engine/selftest.js';

for (const r of runSelfTests()) test(r.name, () => assert.ok(r.ok, r.detail));
