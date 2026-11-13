import React, { useState, useEffect } from 'react';
import { Users, Plus } from 'lucide-react';
import { api } from '../services/api';
import { roleNames, formData } from '../utils/format';
import { Field, Panel, Modal, PageTitle } from '../components/ui';
import { villains } from '../data';

export function Admin({ data, run, busy, refresh }) {
  const [users, setUsers] = useState([]),
    [adding, setAdding] = useState(false),
    [linking, setLinking] = useState(false),
    [role, setRole] = useState('student'),
    [query, setQuery] = useState(''),
    [statusFilter, setStatusFilter] = useState('all'),
    [loadError, setLoadError] = useState('');
  const filteredUsers = users.filter(
    (user) =>
      [user.name, user.email, user.identifier].some((value) =>
        value.toLowerCase().includes(query.trim().toLowerCase()),
      ) &&
      (statusFilter === 'all' || (statusFilter === 'active' ? user.active : !user.active)),
  );
  const pendingTeachers = users.filter((user) => user.role === 'teacher' && !user.active);
  async function load() {
    setLoadError('');
    setUsers(await api('/users'));
  }
  useEffect(() => {
    load().catch((error) => setLoadError(error.message));
  }, []);
  return (
    <>
      <PageTitle
        title="Administração de usuários"
        subtitle="Cadastre alunos e professores e organize os acessos."
        action={
          <div className="button-row">
            <button className="button secondary" onClick={() => setLinking(true)}>
              <Users size={17} /> Vincular turma
            </button>
            <button className="button primary" onClick={() => setAdding(true)}>
              <Plus size={17} /> Novo usuário
            </button>
          </div>
        }
      />
      {loadError && (
        <div className="form-error" role="alert">
          {loadError}
          <button
            className="text-button"
            onClick={() => load().catch((error) => setLoadError(error.message))}
          >
            Tentar novamente
          </button>
        </div>
      )}
      {pendingTeachers.length > 0 && (
        <Panel title="Professores para revisar" icon={Users}>
          <p className="muted">
            Cadastros aguardando liberação e professores com acesso desativado.
          </p>
          {pendingTeachers.length ? (
            pendingTeachers.map((teacher) => (
              <article className="approval-card" key={teacher.id}>
                <div>
                  <strong>{teacher.name}</strong>
                  <p>
                    {teacher.email} · SIAPE {teacher.identifier}
                  </p>
                  <small>{teacher.villain}</small>
                </div>
                <button
                  className="button primary"
                  disabled={busy}
                  onClick={async () => {
                    const result = await run(
                      () => api(`/users/${teacher.id}`, 'PATCH', { active: true }),
                      'Professor liberado.',
                    );
                    if (result) await load();
                  }}
                >
                  Liberar acesso
                </button>
              </article>
            ))
          ) : (
            <p className="empty-small">Nenhum professor aguardando revisão.</p>
          )}
        </Panel>
      )}
      <div className="admin-filters">
        <Field label="Buscar usuário">
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Nome, e-mail, prontuário ou SIAPE"
          />
        </Field>
        <Field label="Acesso">
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
            <option value="all">Todos</option>
            <option value="active">Ativos</option>
            <option value="inactive">Inativos</option>
          </select>
        </Field>
      </div>
      <Panel title="Usuários cadastrados" icon={Users}>
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Usuário</th>
                <th>Identificação</th>
                <th>Perfil</th>
                <th>Status</th>
                <th>Ação</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((u) => (
                <tr key={u.id}>
                  <td>
                    <strong>{u.name}</strong>
                    <small>{u.email}</small>
                  </td>
                  <td>{u.identifier}</td>
                  <td>{roleNames[u.role]}</td>
                  <td>
                    <span className={`status ${u.active ? 'started' : ''}`}>
                      {u.active ? 'ATIVO' : 'INATIVO'}
                    </span>
                  </td>
                  <td>
                    {u.role !== 'admin' && (
                      <button
                        className="text-button"
                        disabled={busy}
                        onClick={async () => {
                          const r = await run(
                            () => api(`/users/${u.id}`, 'PATCH', { active: !u.active }),
                            'Acesso atualizado.',
                          );
                          if (r) await load();
                        }}
                      >
                        {u.active ? 'Desativar' : 'Reativar'}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
      {adding && (
        <Modal title="Cadastrar usuário" onClose={() => setAdding(false)}>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              const p = formData(e);
              p.role = role;
              const r = await run(() => api('/users', 'POST', p), 'Usuário cadastrado.');
              if (r) {
                setAdding(false);
                await load();
              }
            }}
          >
            <Field label="Perfil">
              <select value={role} onChange={(e) => setRole(e.target.value)}>
                <option value="student">Aluno</option>
                <option value="teacher">Professor</option>
              </select>
            </Field>
            <Field label="Nome completo">
              <input name="name" required minLength={3} maxLength={120} />
            </Field>
            <Field label={role === 'student' ? 'Prontuário' : 'SIAPE'}>
              <input name="identifier" required maxLength={40} />
            </Field>
            <Field label="E-mail institucional">
              <input
                name="email"
                type="email"
                pattern=".+@(.+\.)?ifsp\.edu\.br"
                required
                maxLength={180}
              />
            </Field>
            {role === 'teacher' ? (
              <Field label="Escolha o vilão">
                <select name="villain">
                  {villains.map((v) => (
                    <option key={v}>{v}</option>
                  ))}
                </select>
              </Field>
            ) : (
              <div className="form-row">
                <Field label="Semestre">
                  <input name="semester" maxLength={20} placeholder="3º" />
                </Field>
                <Field label="Curso">
                  <input name="course" maxLength={120} placeholder="ADS" />
                </Field>
              </div>
            )}
            <Field label="Senha inicial (mínimo 8 caracteres)">
              <input
                name="password"
                type="password"
                required
                minLength={8}
                autoComplete="new-password"
              />
            </Field>
            <button className="button primary full" disabled={busy}>
              Cadastrar usuário
            </button>
          </form>
        </Modal>
      )}
      {linking && (
        <Modal title="Vincular aluno à turma" onClose={() => setLinking(false)}>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              const p = formData(e);
              p.user_id = Number(p.user_id);
              p.class_id = Number(p.class_id);
              const r = await run(() => api('/memberships', 'POST', p), 'Aluno vinculado à turma.');
              if (r) {
                setLinking(false);
                await refresh();
              }
            }}
          >
            <Field label="Aluno">
              <select name="user_id" required>
                {users
                  .filter((u) => u.role === 'student' && u.active)
                  .map((u) => (
                    <option value={u.id} key={u.id}>
                      {u.name} · {u.identifier}
                    </option>
                  ))}
              </select>
            </Field>
            <Field label="Turma">
              <select name="class_id" required>
                {data.classes.map((c) => (
                  <option value={c.id} key={c.id}>
                    {c.name} · {c.subject}
                  </option>
                ))}
              </select>
            </Field>
            <button className="button primary full" disabled={busy}>
              Vincular aluno
            </button>
          </form>
        </Modal>
      )}
    </>
  );
}
