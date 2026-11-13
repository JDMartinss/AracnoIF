import React, { useState } from 'react';
import { Bell, Send, Users } from 'lucide-react';
import { api } from '../services/api';
import { formData } from '../utils/format';
import { Field, Panel, PageTitle } from '../components/ui';

export function Communication({ user, data, run, refresh, busy }) {
  const [message, setMessage] = useState(false);
  const notices = data.notices || [];
  return (
    <>
      <PageTitle
        title="Central de comunicação"
        subtitle="Avisos importantes sobre aulas, horários e campus."
        action={
          user.role !== 'student' && (
            <button className="button primary" onClick={() => setMessage(!message)}>
              <Send size={17} /> Novo aviso
            </button>
          )
        }
      />
      {message && user.role !== 'student' && (
        <Panel title="Publicar aviso" icon={Send}>
          <form
            onSubmit={async (event) => {
              event.preventDefault();
              const p = formData(event);
              if (p.class_id) p.class_id = Number(p.class_id);
              const result = await run(() => api('/notices', 'POST', p), 'Aviso publicado.');
              if (result) {
                setMessage(false);
                await refresh();
              }
            }}
          >
            <Field label="Destinatários">
              <select name="class_id" defaultValue="">
                <option value="">Todos os usuários</option>
                {data.classes.map((item) => (
                  <option value={item.id} key={item.id}>
                    {item.subject} · {item.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Mensagem">
              <textarea name="body" minLength={3} maxLength={2000} rows={4} required placeholder="Escreva um aviso claro para a comunidade." />
            </Field>
            <button className="button primary" disabled={busy}>
              Publicar aviso
            </button>
          </form>
        </Panel>
      )}
      <Panel title="Avisos recentes" icon={Bell}>
        <div className="notice-feed">
          {notices.map((notice) => (
            <article className="notice-item" key={notice.id}>
              <div className="notice-item-icon"><Bell size={16} /></div>
              <div><p>{notice.body}</p><small>{new Date(notice.created).toLocaleString('pt-BR')}</small></div>
            </article>
          ))}
          {!notices.length && <p className="muted">Nenhum aviso publicado ainda.</p>}
        </div>
      </Panel>
      <Panel title="Professores disponíveis" icon={Users}>
        <div className="group-cards">
          {(data.teachers || []).map((teacher) => (
            <article key={teacher.id}><div><strong>{teacher.name}</strong><span>{teacher.course || 'Professor do IFSP'}{teacher.villain ? ` · ${teacher.villain}` : ''}</span></div></article>
          ))}
          {!data.teachers?.length && <p className="muted">Nenhum professor ativo cadastrado.</p>}
        </div>
      </Panel>
    </>
  );
}
