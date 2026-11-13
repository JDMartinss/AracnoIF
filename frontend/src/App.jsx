import React, { useEffect, useState } from 'react';
import {
  Map,
  CalendarDays,
  Users,
  LogOut,
  X,
  Settings,
  Check,
  AlertCircle,
  MessageSquare,
} from 'lucide-react';
import { api } from './services/api';
import { nextLesson } from './utils/agenda';
import { Brand, Avatar, PageLoading } from './components/ui';
import { AppStatus } from './components/AppStatus';
import { useAction } from './hooks/useAction';
import { useCampusData } from './hooks/useCampusData';
import { BootScreen, Login, VillainPicker } from './pages/Auth';
import { Lessons } from './pages/Lessons';
import { CampusMap } from './pages/CampusMap';
import { Profile } from './pages/Profile';
import { Admin } from './pages/Admin';
import { Communication } from './pages/Communication';

export default function App() {
  const [user, setUser] = useState(null);
  const [page, setPage] = useState('lessons');
  const [loaded, setLoaded] = useState(false);
  const [menu, setMenu] = useState(false);
  const [choosingVillain, setChoosingVillain] = useState(false);
  const [routeRoom, setRouteRoom] = useState(null);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');
  function handleError(error) {
    if (error.status === 401) {
      setUser(null);
      setChoosingVillain(false);
    }
    setError(error.message);
  }
  const { data, status, refresh, reset } = useCampusData(user?.id, handleError);
  const { busy, run } = useAction({
    onStart: () => setError(''),
    onSuccess: setToast,
    onError: handleError,
  });
  useEffect(() => {
    let active = true;
    Promise.all([
      api('/me').catch(() => null),
      document.fonts.ready,
      new Promise((resolve) => setTimeout(resolve, 1200)),
    ]).then(([account]) => {
      if (active) {
        setUser(account);
        setLoaded(true);
      }
    });
    return () => {
      active = false;
    };
  }, []);
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(''), 3500);
    return () => clearTimeout(timer);
  }, [toast]);
  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === 'Escape' && menu) setMenu(false);
    }
    window.addEventListener('keydown', handleKeyDown);
    document.body.classList.toggle('menu-open', menu);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.classList.remove('menu-open');
    };
  }, [menu]);
  function navigate(value) {
    setPage(value);
    setMenu(false);
    setError('');
    window.scrollTo({ top: 0, behavior: 'instant' });
  }
  function viewRoute(room) {
    setRouteRoom(room);
    navigate('map');
  }
  async function logout() {
    if (await run(() => api('/logout', 'POST'))) {
      reset();
      setUser(null);
      navigate('lessons');
    }
  }
  const nav = [
    ['lessons', 'Aulas', CalendarDays],
    ['communication', 'Avisos', MessageSquare],
    ['map', 'Mapa', Map],
    ...(user?.role === 'admin' ? [['users', 'Usuários', Users]] : []),
    ['profile', 'Configurações', Settings],
  ];
  if (!loaded) return <BootScreen />;
  return (
    <>
      <AppStatus />
      <a className="skip-link" href="#main-content">
        Pular para o conteúdo
      </a>
      {!user ? (
        <Login
          rooms={data.rooms}
          run={run}
          busy={busy}
          error={error}
          onLogin={(account) => {
            setUser(account);
            setPage('lessons');
            setChoosingVillain(account.role === 'teacher');
          }}
        />
      ) : choosingVillain ? (
        <div className="villain-layout">
          <VillainPicker
            value={user.villain}
            busy={busy}
            onBack={() => setChoosingVillain(false)}
            onConfirm={async (villain) => {
              const result = await run(
                () => api('/profile', 'PATCH', { villain }),
                'Identidade salva.',
              );
              if (result) {
                setUser(result);
                setChoosingVillain(false);
              }
            }}
          />
        </div>
      ) : (
        <div className="app-shell">
          <aside id="campus-menu" className={`sidebar ${menu ? 'open' : ''}`}>
            <Brand />
            <div className="sidebar-label">CENTRAL DO CAMPUS</div>
            <nav>
              {nav.map(([id, label, Icon]) => (
                <button
                  key={id}
                  className={page === id ? 'active' : ''}
                  aria-current={page === id ? 'page' : undefined}
                  onClick={() => navigate(id)}
                >
                  <Icon size={19} />
                  <span>{label}</span>
                </button>
              ))}
            </nav>
            <div className="sidebar-bottom">
              <button className="logout" onClick={logout} disabled={busy}>
                <LogOut size={18} /> Sair
              </button>
            </div>
          </aside>
          {menu && (
            <button
              className="menu-overlay"
              aria-label="Fechar menu"
              onClick={() => setMenu(false)}
            />
          )}
          <div className="workspace">
            <header className="topbar">
              <Brand />
              <button
                className="user-button"
                aria-label="Abrir configurações"
                onClick={() => navigate('profile')}
              >
                <Avatar user={user} small />
                <span>{user.name.split(' ')[0]}</span>
              </button>
            </header>
            <main id="main-content" tabIndex="-1">
              {status === 'error' && (
                <div className="connection-banner" role="status">
                  Não foi possível atualizar os dados.
                  <button className="text-button" onClick={() => run(refresh)}>
                    Tentar novamente
                  </button>
                </div>
              )}
              {status === 'loading' ? (
                <PageLoading />
              ) : (
                <>
                  {page === 'lessons' && (
                    <Lessons
                      user={user}
                      data={data}
                      viewRoute={viewRoute}
                      run={run}
                      refresh={refresh}
                      busy={busy}
                    />
                  )}
                  {page === 'map' && (
                    <CampusMap
                      rooms={data.rooms}
                      initialDestination={routeRoom}
                      nextLesson={nextLesson(data.lessons)}
                    />
                  )}
                  {page === 'communication' && (
                    <Communication user={user} data={data} run={run} refresh={refresh} busy={busy} />
                  )}
                  {page === 'users' && user.role === 'admin' && (
                    <Admin data={data} run={run} refresh={refresh} busy={busy} />
                  )}
                  {page === 'profile' && (
                    <Profile user={user} setUser={setUser} run={run} busy={busy} onLogout={logout} />
                  )}
                </>
              )}
              <footer>
                <span>AracnoIF · IFSP Bragança Paulista</span>
              </footer>
            </main>
          </div>
          <nav
            className="mobile-tabs"
            style={{ gridTemplateColumns: `repeat(${nav.length}, minmax(0, 1fr))` }}
          >
            {nav.map(([id, label, Icon]) => (
              <button
                key={id}
                className={page === id ? 'active' : ''}
                aria-current={page === id ? 'page' : undefined}
                onClick={() => navigate(id)}
              >
                <Icon size={20} />
                <span>{label}</span>
              </button>
            ))}
          </nav>
        </div>
      )}
      {error && (
        <div className="feedback error" role="alert">
          <AlertCircle size={20} />
          <span>{error}</span>
          <button aria-label="Fechar erro" onClick={() => setError('')}>
            <X size={17} />
          </button>
        </div>
      )}
      {toast && (
        <div className="feedback success" role="status">
          <Check size={20} />
          {toast}
        </div>
      )}
    </>
  );
}
