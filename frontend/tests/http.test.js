import { test, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { requestJSON } from '../src/services/http.js';
const originalFetch = globalThis.fetch;
afterEach(() => {
  globalThis.fetch = originalFetch;
});
test('returns JSON and preserves request options', async () => {
  globalThis.fetch = async (url, options) => {
    assert.equal(url, '/api/classes');
    assert.equal(options.method, 'POST');
    assert.equal(options.body, '{}');
    assert.ok(options.signal);
    return { ok: true, json: async () => ({ id: 7 }) };
  };
  assert.deepEqual(await requestJSON('/api/classes', { method: 'POST', body: '{}' }), { id: 7 });
});
test('keeps authentication status and server error message', async () => {
  globalThis.fetch = async () => ({
    ok: false,
    status: 401,
    json: async () => ({ error: 'Sessão encerrada.' }),
  });
  await assert.rejects(
    requestJSON('/api/me'),
    (e) => e.status === 401 && e.message === 'Sessão encerrada.',
  );
});
test('explains invalid server response', async () => {
  globalThis.fetch = async () => ({
    ok: false,
    json: async () => {
      throw new SyntaxError('HTML');
    },
  });
  await assert.rejects(requestJSON('/api/me'), /resposta inválida/);
});
test('explains network failure without automatically retrying a mutation', async () => {
  let calls = 0;
  globalThis.fetch = async () => {
    calls++;
    throw new TypeError('Failed to fetch');
  };
  await assert.rejects(requestJSON('/api/lessons', { method: 'POST' }), /Sem conexão/);
  assert.equal(calls, 1);
});
test('bounds stalled requests and explains unknown mutation result', async () => {
  globalThis.fetch = async (url, { signal }) =>
    new Promise((resolve, reject) =>
      signal.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError'))),
    );
  await assert.rejects(
    requestJSON('/api/lessons', { method: 'POST' }, 5),
    /Confira se a ação foi concluída/,
  );
});
test('also bounds response body download', async () => {
  globalThis.fetch = async (url, { signal }) => ({
    ok: true,
    json: () =>
      new Promise((resolve, reject) =>
        signal.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError'))),
      ),
  });
  await assert.rejects(requestJSON('/api/me', {}, 5), /demorou demais/);
});
