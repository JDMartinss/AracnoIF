import { requestJSON } from './http';

export const isDemo = import.meta.env.VITE_API_MODE === 'demo';
const apiBase = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');
let csrf = null;

export async function api(path, method = 'GET', body) {
  if (isDemo) {
    const { demoRequest } = await import('./demo');
    return structuredClone(await demoRequest(path, method, body));
  }
  if (method !== 'GET' && !csrf) {
    const data = await requestJSON(`${apiBase}/api/csrf`, { credentials: 'same-origin' });
    csrf = data.token;
  }
  let data;
  try {
    data = await requestJSON(`${apiBase}/api${path}`, {
      method,
      credentials: 'same-origin',
      headers: {
        'Content-Type': 'application/json',
        ...(method === 'GET' ? {} : { 'X-CSRF-Token': csrf }),
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
  } catch (error) {
    if (error.status === 401 || error.status === 403) csrf = null;
    throw error;
  }
  if (data.token) csrf = data.token;
  if (path === '/logout') csrf = null;
  return data;
}
