function validateBeeperRequest(input) {
  if (!input || typeof input !== 'object') throw new Error('Invalid Beeper request');
  const base = new URL(input.baseUrl);
  if (base.protocol !== 'http:' || !['localhost', '127.0.0.1', '[::1]'].includes(base.hostname) || base.username || base.password || base.pathname !== '/' || base.search || base.hash) {
    throw new Error('Desktop Beeper connections must use a local HTTP address');
  }
  if (typeof input.path !== 'string' || !/^\/v1\/(accounts|chats)(?:[/?]|$)/.test(input.path) || input.path.includes('..') || input.path.includes('\\')) throw new Error('Invalid Beeper path');
  const target = new URL(input.path, base);
  if (target.origin !== base.origin || !target.pathname.startsWith('/v1/')) throw new Error('Invalid Beeper target');
  if (!['GET', 'POST'].includes(input.method) || typeof input.token !== 'string' || !input.token || input.token.length > 8192) throw new Error('Invalid Beeper credentials or method');
  if (input.body !== undefined && (typeof input.body !== 'string' || input.body.length > 1000000)) throw new Error('Invalid Beeper body');
  return target;
}
module.exports = { validateBeeperRequest };