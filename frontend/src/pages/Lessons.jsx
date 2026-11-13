import React, { useState, useEffect } from 'react';
import { CalendarDays, Users, MapPin, Clock, Play, Settings, Plus, Navigation } from 'lucide-react';
import { nextLesson } from '../utils/agenda';
import { api } from '../services/api';
import { time, date, day, formData } from '../utils/format';
import { Avatar, LessonStatus, Field, Panel, Modal, PageTitle } from '../components/ui';

export function Lessons({ user, data, viewRoute, run, refresh, busy }) {
  const [filter, setFilter] = useState('today'),
    [teacherFilter, setTeacherFilter] = useState('all'),
    [edit, setEdit] = useState(null),
    [groupEdit, setGroupEdit] = useState(null),
    [cancel, setCancel] = useState(null),
    [join, setJoin] = useState(false);
  const manager = user.role !== 'student';
  const items = data.lessons
    .filter((lesson) => {
      const closed = ['completed', 'cancelled'].includes(lesson.status);
      return (
        (filter === 'history' ? closed : !closed) &&
        (teacherFilter === 'all' || String(lesson.teacher.id) === teacherFilter) &&
        (filter !== 'today' || new Date(lesson.start).toDateString() === new Date().toDateString())
      );
    })
    .sort((a, b) => a.start.localeCompare(b.start));
  const next = nextLesson(data.lessons);
  async function saveLesson(e) {
    e.preventDefault();
    const p = formData(e);
    p.room_id = Number(p.room_id);
    if (!edit.id) p.class_id = Number(p.class_id);
    const r = await run(
      () => api(edit.id ? `/lessons/${edit.id}` : '/lessons', edit.id ? 'PATCH' : 'POST', p),
      'Aula salva e turma avisada.',
    );
    if (r) {
      setEdit(null);
      await refresh();
    }
  }
  return (
    <>
      <PageTitle
        title={manager ? 'Turmas e aulas' : 'Minhas aulas'}
        subtitle="Agenda, salas e avisos da sua turma."
        action={
          manager ? (
            <div className="button-row">
              <button className="button secondary" onClick={() => setGroupEdit({})}>
                <Users size={17} /> Nova turma
              </button>
              <button
                className="button primary"
                disabled={!data.classes.length}
                onClick={() => setEdit({})}
              >
                <Plus size={17} /> Nova aula
              </button>
            </div>
          ) : (
            <button className="button secondary" onClick={() => setJoin(true)}>
              Entrar em turma
            </button>
          )
        }
      />
      {manager && (
        <Panel title="Suas turmas e matérias" icon={Users}>
          <div className="group-cards">
            {data.classes.map((c) => (
              <article key={c.id}>
                <Avatar user={c.teacher} small />
                <div>
                  <strong>{c.subject}</strong>
                  <span>
                    {c.name} · {c.teacher.name} · código {c.id}
                  </span>
                </div>
                <button
                  className="icon-button"
                  aria-label={`Editar ${c.name}, ${c.subject}`}
                  onClick={() => setGroupEdit(c)}
                >
                  <Settings size={18} />
                </button>
              </article>
            ))}
            {!data.classes.length && <p>Crie sua primeira turma e informe a matéria.</p>}
          </div>
        </Panel>
      )}
      {next && (
        <section className="agenda-next" aria-label="Próxima aula">
          <div>
            <span>Próxima aula</span>
            <strong>{next.subject}</strong>
            <p>
              {date(next.start)} · {time(next.start)} · {next.room.name}
            </p>
          </div>
          <button className="button primary" onClick={() => viewRoute(next.room)}>
            <Navigation size={17} /> Abrir sala no mapa
          </button>
        </section>
      )}
      <div className="lesson-toolbar">
        <div className="segmented">
          {[
            ['today', 'Hoje'],
            ['all', 'Agenda'],
            ['history', 'Histórico'],
          ].map(([value, label]) => (
            <button
              key={value}
              className={filter === value ? 'selected' : ''}
              onClick={() => {
                setFilter(value);
              }}
            >
              {label}
            </button>
          ))}
        </div>
        <select aria-label="Filtrar por professor" value={teacherFilter} onChange={(event) => setTeacherFilter(event.target.value)}>
          <option value="all">Todos os professores</option>
          {(data.teachers || []).map((teacher) => <option value={teacher.id} key={teacher.id}>{teacher.name}</option>)}
        </select>
      </div>
      <div className="lesson-grid">
        {items.map((l) => (
          <section className={`panel lesson-card ${next?.id === l.id ? 'is-next' : ''}`} key={l.id}>
            <div className="lesson-card-top">
              <span className="eyebrow">{l.class_name}</span>
              <LessonStatus status={l.status} />
            </div>
            <div className="lesson-subject">
              <Avatar user={l.teacher} />
              <div>
                <h2>{l.subject}</h2>
                <p>Prof. {l.teacher.name}</p>
                <span className="villain-label">{l.teacher.villain}</span>
              </div>
            </div>
            <div className="lesson-info">
              <span>
                <CalendarDays size={17} /> {date(l.start)} · {day(l.start)}
              </span>
              <span>
                <Clock size={17} /> {time(l.start)} – {time(l.end)}
              </span>
              <span>
                <MapPin size={17} /> {l.room.name} · {l.room.floor}º pavimento
              </span>
            </div>
            {data.notices?.find(
              (notice) =>
                notice.lesson_id === l.id && ['changed', 'cancelled'].includes(notice.kind),
            ) && (
              <p className="lesson-notice">
                {
                  data.notices.find(
                    (notice) =>
                      notice.lesson_id === l.id && ['changed', 'cancelled'].includes(notice.kind),
                  ).body
                }
              </p>
            )}
            <div className="lesson-actions">
              <button className="button primary" onClick={() => viewRoute(l.room)}>
                <Navigation size={17} /> Ver rota
              </button>
              {manager && !['cancelled', 'completed'].includes(l.status) && (
                <>
                  <button className="button secondary" disabled={busy} onClick={() => setEdit(l)}>
                    <Settings size={16} /> Alterar
                  </button>
                  <button
                    className="button secondary"
                    disabled={busy}
                    onClick={async () => {
                      const started = l.status === 'started';
                      const r = await run(
                        () =>
                          api(
                            `/lessons/${l.id}/${started ? 'status' : 'start'}`,
                            'POST',
                            started ? { status: 'completed' } : undefined,
                          ),
                        started
                          ? 'Aula encerrada e turma avisada.'
                          : 'Aula iniciada e turma avisada.',
                      );
                      if (r) await refresh();
                    }}
                  >
                    <Play size={16} /> {l.status === 'started' ? 'Encerrar' : 'Iniciar'}
                  </button>
                  <button
                    className="text-button cancel-action"
                    disabled={busy}
                    onClick={() => setCancel(l)}
                  >
                    Cancelar aula
                  </button>
                </>
              )}
            </div>
          </section>
        ))}
      </div>
      {!items.length && (
        <div className="empty-state">
          <CalendarDays />
          <h3>Nenhuma aula neste período.</h3>
          <p>
            {filter === 'today'
              ? 'Veja a agenda completa ou cadastre uma aula.'
              : 'As aulas deste período aparecerão aqui.'}
          </p>
          {filter === 'today' && (
            <button className="button secondary" onClick={() => setFilter('all')}>
              Ver agenda
            </button>
          )}
        </div>
      )}
      {join && (
        <Modal title="Entrar em turma" onClose={() => setJoin(false)}>
          <p className="muted">Peça ao professor o código numérico da turma.</p>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              const p = formData(e);
              const result = await run(
                () => api('/memberships', 'POST', { class_id: Number(p.class_id) }),
                'Você entrou na turma.',
              );
              if (result) {
                setJoin(false);
                await refresh();
              }
            }}
          >
            <Field label="CÓDIGO DA TURMA">
              <input name="class_id" inputMode="numeric" required />
            </Field>
            <button className="button primary full" disabled={busy}>
              Entrar na turma
            </button>
          </form>
        </Modal>
      )}
      {edit && (
        <Modal
          title={edit.id ? 'Alterar sala ou horário' : 'Cadastrar aula'}
          onClose={() => setEdit(null)}
        >
          <p className="muted">A turma receberá um aviso. Horários em Brasília.</p>
          <form onSubmit={saveLesson}>
            {!edit.id && (
              <Field label="Turma / matéria">
                <select name="class_id" required>
                  {data.classes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.subject} · {c.name}
                    </option>
                  ))}
                </select>
              </Field>
            )}
            <Field label="Sala">
              <select name="room_id" defaultValue={edit.room?.id} required>
                {data.rooms.map((r) => (
                  <option value={r.id} key={r.id}>
                    {r.name} · {r.floor}º pavimento
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Início">
              <input
                name="start"
                type="datetime-local"
                defaultValue={edit.start?.slice(0, 16)}
                required
              />
            </Field>
            <Field label="Término">
              <input
                name="end"
                type="datetime-local"
                defaultValue={edit.end?.slice(0, 16)}
                required
              />
            </Field>
            <button className="button primary full" disabled={busy}>
              Salvar e avisar turma
            </button>
          </form>
        </Modal>
      )}
      {groupEdit && (
        <Modal
          title={groupEdit.id ? 'Editar turma e matéria' : 'Nova turma e matéria'}
          onClose={() => setGroupEdit(null)}
        >
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              const p = formData(e);
              if (p.teacher_id) p.teacher_id = Number(p.teacher_id);
              const r = await run(
                () =>
                  api(
                    groupEdit.id ? `/classes/${groupEdit.id}` : '/classes',
                    groupEdit.id ? 'PATCH' : 'POST',
                    p,
                  ),
                'Turma salva.',
              );
              if (r) {
                setGroupEdit(null);
                await refresh();
              }
            }}
          >
            <Field label="Nome da turma">
              <input
                name="name"
                required
                maxLength={120}
                defaultValue={groupEdit.name}
                placeholder="Ex.: ADS · 3º módulo"
              />
            </Field>
            <Field label="Matéria">
              <input
                name="subject"
                required
                maxLength={120}
                defaultValue={groupEdit.subject}
                placeholder="Ex.: Programação Web"
              />
            </Field>
            {user.role === 'admin' && !groupEdit.id && (
              <Field label="Professor responsável">
                <select name="teacher_id" required>
                  {(data.teachers || []).map((teacher) => (
                    <option value={teacher.id} key={teacher.id}>{teacher.name}</option>
                  ))}
                </select>
              </Field>
            )}
            <button className="button primary full" disabled={busy}>
              Salvar turma
            </button>
          </form>
        </Modal>
      )}
      {cancel && (
        <Modal title="Cancelar aula" onClose={() => setCancel(null)}>
          <p>
            {cancel.subject} · {date(cancel.start)} · {time(cancel.start)}. Os alunos receberão um
            aviso.
          </p>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              const p = formData(e);
              const r = await run(
                () =>
                  api(`/lessons/${cancel.id}/status`, 'POST', {
                    status: 'cancelled',
                    reason: p.reason,
                  }),
                'Aula cancelada e turma avisada.',
              );
              if (r) {
                setCancel(null);
                await refresh();
              }
            }}
          >
            <Field label="Motivo (opcional)">
              <textarea name="reason" maxLength={300} />
            </Field>
            <div className="button-row">
              <button className="button secondary" type="button" onClick={() => setCancel(null)}>
                Manter aula
              </button>
              <button className="button primary" disabled={busy}>
                Confirmar cancelamento
              </button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}
