const { test } = require('node:test');
const assert = require('node:assert/strict');
const { validateBeeperRequest } = require('./beeper-request.cjs');
const request = { baseUrl: 'http://localhost:23373', token: 'test-token', path: '/v1/accounts', method: 'GET' };

test('desktop connections only target local Beeper, never hosted accounts', () => {
  assert.equal(validateBeeperRequest(request).href, 'http://localhost:23373/v1/accounts');
  assert.throws(() => validateBeeperRequest({ ...request, baseUrl: 'https://example.com' }));
  assert.throws(() => validateBeeperRequest({ ...request, baseUrl: 'http://localhost.example.com:23373' }));
});
test('bridge rejects redirects, arbitrary paths and unsupported methods', () => {
  assert.throws(() => validateBeeperRequest({ ...request, path: '//example.com/v1/accounts' }));
  assert.throws(() => validateBeeperRequest({ ...request, path: '/v1/chats/../../private' }));
  assert.throws(() => validateBeeperRequest({ ...request, method: 'DELETE' }));
  assert.equal(validateBeeperRequest({ ...request, method: 'POST', path: '/v1/chats/test/messages', body: '{"text":"hello"}' }).pathname, '/v1/chats/test/messages');
});