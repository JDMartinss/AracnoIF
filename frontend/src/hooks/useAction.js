import { useRef, useState } from 'react';

// Keep duplicate clicks from submitting the same operation twice.
export function useAction({ onError, onSuccess, onStart }) {
  const locked = useRef(false);
  const [busy, setBusy] = useState(false);
  async function run(action, message) {
    if (locked.current) return null;
    locked.current = true;
    onStart?.();
    setBusy(true);
    try {
      const result = await action();
      if (message) onSuccess?.(message);
      return result;
    } catch (error) {
      onError?.(error);
      return null;
    } finally {
      locked.current = false;
      setBusy(false);
    }
  }
  return { busy, run };
}
