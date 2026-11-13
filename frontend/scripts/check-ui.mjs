import { createServer } from 'vite';
import { fileURLToPath } from 'node:url';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import assert from 'node:assert/strict';
let server;
try {
  server = await createServer({
    root: fileURLToPath(new URL('../', import.meta.url)),
    server: { middlewareMode: true },
    appType: 'custom',
  });
  const views = {};
  for (const name of ['Lessons', 'CampusMap', 'Profile', 'Admin', 'Communication'])
    Object.assign(views, await server.ssrLoadModule(`/src/pages/${name}.jsx`));
  Object.assign(views, await server.ssrLoadModule('/src/pages/Auth.jsx'));
  Object.assign(views, await server.ssrLoadModule('/src/components/ui.jsx'));
  const adapter = await server.ssrLoadModule('/src/services/api.js');
  const { demoStore } = await server.ssrLoadModule('/src/data.js');
  const empty = demoStore();
  for (const key of ['classes', 'lessons', 'memberships', 'notices'])
    assert.equal(empty[key].length, 0);
  assert.equal(empty.users.length, 1);
  assert.ok(empty.users.some((user) => user.role === 'admin'));
  let rendered = 0;
  const render = (Component, props) => {
    const html = renderToStaticMarkup(React.createElement(Component, props));
    assert.ok(html.length > 50);
    rendered++;
    return html;
  };
  const noop = () => {},
    run = async (fn) => fn();
  for (const role of ['student', 'teacher', 'admin']) {
    // Rendering fixtures are never registered in the application's account store.
    const user = {
      id: 999,
      name: 'Teste de interface',
      identifier: 'test',
      role,
      villain: 'Doutor Octopus',
    };
    const data = demoStore();
    const common = {
      user,
      data,
      run,
      refresh: noop,
      busy: false,
      viewRoute: noop,
      navigate: noop,
      setUser: noop,
      onLogout: noop,
    };
    for (const page of ['Lessons', 'Profile']) {
      const html = render(views[page], common);
      if (page === 'Profile') {
        assert.ok(html.includes('FOTO DE PERFIL'));
        assert.ok(html.includes('type="file"'));
        assert.ok(html.includes('Sair da conta'));
      }
    }
    render(views.Communication, common);
    if (role === 'admin') render(views.Admin, { ...common, data: { ...data, classes: [] } });
    const mapHtml = render(views.CampusMap, { rooms: data.rooms });
    assert.ok(mapHtml.includes('PAVILHÃO B'));
    assert.ok(mapHtml.includes('PAVILHÃO A'));
    const start = new Date();
    start.setHours(19, 0, 0, 0);
    const end = new Date(start.getTime() + 3600000);
    const fixture = {
      ...data,
      classes: [{ id: 1, name: 'Turma de teste', subject: 'Web', teacher: user }],
      lessons: [
        {
          id: 1,
          class_id: 1,
          class_name: 'Turma de teste',
          subject: 'Web',
          teacher: user,
          room: data.rooms[0],
          start: start.toISOString(),
          end: end.toISOString(),
          status: 'scheduled',
        },
      ],
      notices: [
        { id: 1, lesson_id: 1, kind: 'changed', body: 'Sala atualizada para a apresentação.' },
      ],
    };
    const lessonsHtml = render(views.Lessons, { ...common, data: fixture });
    assert.ok(lessonsHtml.includes('Sala atualizada para a apresentação.'));
  }
  render(views.Login, { onLogin: noop, run, busy: false, rooms: [] });
  render(views.PageLoading, {});
  const { default: App } = await server.ssrLoadModule('/src/App.jsx');
  render(App, {});
  console.log(
    `${rendered} server-rendered UI states passed; student/teacher configuration and UI checks passed.`,
  );
} finally {
  await server?.close();
}
