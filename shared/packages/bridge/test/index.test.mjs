import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  BridgeAdapter,
  getBridgeAdapter,
} from '../src/index.ts';

test('BridgeAdapter is exported and instantiable', () => {
  const adapter = new BridgeAdapter();
  assert.ok(adapter instanceof BridgeAdapter);
});

test('isNativePlatform returns false in a Node (non-native) environment', () => {
  const adapter = new BridgeAdapter();
  assert.equal(adapter.isNativePlatform(), false);
});

test('getPlatformInfo reports the web platform in Node', () => {
  const adapter = new BridgeAdapter();
  const info = adapter.getPlatformInfo();
  assert.equal(info.isNative, false);
  assert.equal(info.platform, 'web');
  assert.equal(typeof info.userAgent, 'string');
});

test('getBridgeAdapter returns a singleton instance', () => {
  const a = getBridgeAdapter();
  const b = getBridgeAdapter();
  assert.equal(a, b);
  assert.ok(a instanceof BridgeAdapter);
});
