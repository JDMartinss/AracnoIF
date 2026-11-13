import React, { useState, useEffect } from 'react';

export function AppStatus() {
  const [offline, setOffline] = useState(false);
  useEffect(() => {
    const connection = () => setOffline(!navigator.onLine);
    connection();
    window.addEventListener('online', connection);
    window.addEventListener('offline', connection);
    return () => {
      window.removeEventListener('online', connection);
      window.removeEventListener('offline', connection);
    };
  }, []);
  return offline ? (
    <div className="connection-banner" role="status">
      Sem conexão. Alterações precisam de internet.
    </div>
  ) : null;
}
