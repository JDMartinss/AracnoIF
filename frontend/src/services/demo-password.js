export async function verifyDemoPassword(password, encoded) {
  const [method, salt, expected] = encoded.split('$');
  const [algorithm, digest, iterations] = method.split(':');
  if (algorithm !== 'pbkdf2' || digest !== 'sha256') return false;
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey('raw', encoder.encode(password), 'PBKDF2', false, [
    'deriveBits',
  ]);
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', hash: 'SHA-256', salt: encoder.encode(salt), iterations: Number(iterations) },
    key,
    256,
  );
  const actual = Array.from(new Uint8Array(bits), (byte) =>
    byte.toString(16).padStart(2, '0'),
  ).join('');
  return actual === expected;
}
