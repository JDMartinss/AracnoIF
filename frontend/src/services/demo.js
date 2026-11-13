import initialAdmin from '../initial-admin.json';
import { verifyDemoPassword } from './demo-password';
import { demoStore, villains } from '../data';
let state = demoStore(),
  user = null;
const nextId = (items) => Math.max(0, ...items.map((i) => i.id)) + 1;

const publicUser = (account) => {
  if (!account) return account;
  const { password, current_password, ...safe } = account;
  return structuredClone(safe);
};
const accessible = (id) =>
  user?.role === 'admin' ||
  state.classes.find((c) => c.id === id)?.teacher.id === user?.id ||
  state.memberships.some((m) => m.class_id === id && m.user_id === user?.id);

export async function demoRequest(path, method = 'GET', body) {
  if (path === '/me') {
    if (!user) throw new Error('Entre na sua conta.');
    return publicUser(user);
  }
  if (path === '/login') {
    const identifier = String(body?.identifier || '')
      .trim()
      .toLowerCase();
    const account = state.users.find(
      (u) => u.active && (u.email === identifier || u.identifier === identifier),
    );
    const password = String(body?.password || '');
    const adminLogin =
      account?.email === initialAdmin.email &&
      (await verifyDemoPassword(password, initialAdmin.password_hash));
    const accountLogin = account?.role !== 'admin' && account?.password === password;
    if (!account || (!adminLogin && !accountLogin)) {
      const error = new Error('Identificação ou senha inválida.');
      error.status = 401;
      throw error;
    }
    user = account;
    return { user: publicUser(user) };
  }
  if (path === '/logout') {
    user = null;
    return { ok: true };
  }
  if (path === '/rooms') return state.rooms;
  if (path === '/teachers')
    return state.users.filter((u) => u.role === 'teacher' && u.active).map(publicUser);
  if (path === '/contact' && method === 'POST') {
    if (!body?.name || !body?.email || !body?.subject || !body?.body) throw new Error('Preencha todos os campos.');
    return { ok: true };
  }
  if (path === '/register/teacher') {
    if (state.users.some((u) => u.email === body.email || u.identifier === body.identifier))
      throw new Error('E-mail ou SIAPE já cadastrado.');
    const { confirm_password, confirm_server, ...safe } = body;
    state.users.push({ id: nextId(state.users), ...safe, role: 'teacher', active: false });
    return { ok: true, pending: true };
  }
  if (!user) throw new Error('Entre na sua conta.');
  if (path === '/profile') {
    const { name, email, villain, avatar } = body;
    body = {
      ...(name ? { name } : {}),
      ...(email ? { email } : {}),
      ...(user.role === 'teacher' && villain ? { villain } : {}),
      ...(typeof avatar === 'string' ? { avatar } : {}),
    };
    if (body.villain && !villains.includes(body.villain))
      throw new Error('Escolha um vilão válido.');
    if (
      body.avatar &&
      (body.avatar.length > 50000 ||
        !/^data:image\/(?:jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(body.avatar))
    )
      throw new Error('Use uma foto JPG, PNG ou WEBP de até 50 KB.');
    Object.assign(user, body);
    delete user.current_password;
    for (const c of state.classes) if (c.teacher.id === user.id) c.teacher = publicUser(user);
    for (const l of state.lessons) if (l.teacher.id === user.id) l.teacher = publicUser(user);
    return publicUser(user);
  }
  if (path === '/classes') {
    if (method === 'GET') return state.classes.filter((c) => accessible(c.id));
    if (!['teacher', 'admin'].includes(user.role)) throw new Error('Acesso negado.');
    const teacher =
      user.role === 'teacher'
        ? user
        : state.users.find(
            (u) => u.id === Number(body.teacher_id) && u.role === 'teacher' && u.active,
          );
    if (!teacher || !body.name?.trim() || !body.subject?.trim())
      throw new Error('Informe turma, matéria e professor ativo.');
    const group = {
      id: nextId(state.classes),
      name: body.name.trim(),
      subject: body.subject.trim(),
      teacher: publicUser(teacher),
    };
    state.classes.push(group);
    return group;
  }
  if (path.startsWith('/classes/')) {
    const group = state.classes.find((c) => c.id === Number(path.split('/')[2]));
    if (!group || user.role === 'student' || !accessible(group.id))
      throw new Error('Acesso negado.');
    if (!body.name?.trim() || !body.subject?.trim()) throw new Error('Informe turma e matéria.');
    Object.assign(group, { name: body.name.trim(), subject: body.subject.trim() });
    for (const l of state.lessons)
      if (l.class_id === group.id)
        Object.assign(l, { class_name: group.name, subject: group.subject });
    return group;
  }
  if (path === '/lessons') {
    if (method === 'GET') return state.lessons.filter((c) => accessible(c.class_id));
    const group = state.classes.find((c) => c.id === Number(body.class_id)),
      room = state.rooms.find((r) => r.id === Number(body.room_id));
    if (user.role === 'student' || !group || !accessible(group.id))
      throw new Error('Acesso negado.');
    if (
      !room ||
      !body.start ||
      !body.end ||
      !Number.isFinite(Date.parse(body.start)) ||
      new Date(body.end) <= new Date(body.start)
    )
      throw new Error('Informe sala e horários válidos.');
    if (
      state.lessons.some(
        (l) =>
          !['cancelled', 'completed'].includes(l.status) &&
          (l.room.id === room.id || l.teacher.id === group.teacher.id) &&
          l.start < body.end &&
          l.end > body.start,
      )
    )
      throw new Error('A sala ou o professor já tem aula neste horário.');
    const lesson = {
      id: nextId(state.lessons),
      class_id: group.id,
      class_name: group.name,
      subject: group.subject,
      teacher: publicUser(group.teacher),
      room,
      start: body.start,
      end: body.end,
      status: 'scheduled',
    };
    state.lessons.push(lesson);
    demoNotice(`Nova aula de ${lesson.subject}: ${room.name}.`, group.id, 'scheduled', lesson.id);
    return lesson;
  }
  const statusMatch = path.match(/^\/lessons\/(\d+)\/status$/);
  if (statusMatch) {
    const l = state.lessons.find((l) => l.id === Number(statusMatch[1]));
    if (user.role === 'student' || !l || !accessible(l.class_id)) throw new Error('Acesso negado.');
    if (l.status === body.status) return l;
    if (
      ['cancelled', 'completed'].includes(l.status) ||
      !['cancelled', 'completed'].includes(body.status) ||
      (body.status === 'completed' && l.status !== 'started')
    )
      throw new Error('Mudança de status inválida.');
    l.status = body.status;
    demoNotice(
      `Aula de ${l.subject} ${l.status === 'cancelled' ? 'cancelada' : 'encerrada'}.${body.reason ? ' Motivo: ' + body.reason : ''}`,
      l.class_id,
      l.status,
      l.id,
    );
    return l;
  }

  const lessonMatch = path.match(/^\/lessons\/(\d+)(\/start)?$/);
  if (lessonMatch) {
    if (!['teacher', 'admin'].includes(user.role)) throw new Error('Acesso negado.');
    const lesson = state.lessons.find((l) => l.id === Number(lessonMatch[1]));
    if (!lesson || !accessible(lesson.class_id)) throw new Error('Acesso negado.');
    if (['cancelled', 'completed'].includes(lesson.status))
      throw new Error('Esta aula foi encerrada ou cancelada.');
    if (lessonMatch[2]) {
      if (lesson.status === 'started') return structuredClone(lesson);
      lesson.status = 'started';
    } else {
      const room = state.rooms.find((r) => r.id === Number(body.room_id));
      if (!room) throw new Error('Sala inválida.');
      if (new Date(body.end) <= new Date(body.start))
        throw new Error('O término deve ser após o início.');
      if (
        state.lessons.some(
          (l) =>
            l.id !== lesson.id &&
            !['cancelled', 'completed'].includes(l.status) &&
            (l.room.id === room.id || l.teacher.id === lesson.teacher.id) &&
            l.start < body.end &&
            l.end > body.start,
        )
      )
        throw new Error('A sala ou o professor já tem aula neste horário.');
      Object.assign(lesson, { room, start: body.start, end: body.end });
    }
    const text = lessonMatch[2]
      ? `A aula de ${lesson.subject} começou em ${lesson.room.name}.`
      : `A aula de ${lesson.subject} foi atualizada. Sala: ${lesson.room.name}.`;
    demoNotice(text, lesson.class_id, lessonMatch[2] ? 'started' : 'changed', lesson.id);
    return structuredClone(lesson);
  }
  if (path === '/notices') {
    if (method === 'POST') {
      if (!['teacher', 'admin'].includes(user.role)) throw new Error('Acesso negado.');
      demoNotice(body.body, body.class_id || null);
      return state.notices[0];
    }
    return state.notices.filter((notice) => accessible(notice.class_id));
  }
  if (path === '/memberships') {
    if (!['student', 'admin'].includes(user.role)) throw new Error('Acesso negado.');
    const userId = user.role === 'student' ? user.id : Number(body.user_id);
    const classId = Number(body.class_id);
    const student = state.users.find(
      (candidate) =>
        candidate.id === userId && candidate.role === 'student' && candidate.active,
    );
    const group = state.classes.find((candidate) => candidate.id === classId);
    if (!student || !group) throw new Error('Selecione aluno e turma válidos.');
    if (state.memberships.some((membership) => membership.user_id === student.id && membership.class_id === group.id))
      throw new Error('Você já está vinculado a esta turma.');
    state.memberships.push({ user_id: student.id, class_id: group.id });
    return { ok: true };
  }
  if (user.role !== 'admin') throw new Error('Acesso negado.');
  if (path === '/users') {
    if (method === 'POST') {
      if (state.users.some((u) => u.email === body.email || u.identifier === body.identifier))
        throw new Error('E-mail ou identificação já cadastrado.');
      const u = { id: nextId(state.users), ...body, active: true };
      state.users.push(u);
      return publicUser(u);
    }
    return state.users.map(publicUser);
  }
  if (path.startsWith('/users/')) {
    const u = state.users.find((u) => u.id === Number(path.split('/')[2]));
    if (!u || u.role === 'admin') throw new Error('Acesso negado.');
    Object.assign(u, body);
    return publicUser(u);
  }
  throw new Error('Recurso ainda não disponível.');
}

function demoNotice(body, class_id, kind = 'info', lesson_id = null) {
  const n = {
    id: nextId(state.notices),
    body,
    class_id,
    kind,
    lesson_id,
    created: new Date().toISOString(),
  };
  state.notices.unshift(n);
}
