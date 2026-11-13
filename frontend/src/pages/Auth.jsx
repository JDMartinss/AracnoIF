import React, { useState, useEffect } from 'react';
import {
  Map,
  Shield,
  GraduationCap,
  FileText,
  Check,
  Mail,
  Lock,
  UserRound,
  AlertCircle,
  Eye,
  EyeOff,
} from 'lucide-react';
import { api, isDemo } from '../services/api';
import { roleNames, formData } from '../utils/format';
import { MaskIcon, Brand, VillainAvatar, Field, Modal } from '../components/ui';
import { villains } from '../data';

import { CampusMap } from './CampusMap';

const spiderQuotes = [
  { text: 'Com grandes poderes vêm grandes responsabilidades.', credit: 'Lema do Homem-Aranha' },
  { text: 'Seu amigo da vizinhança, Homem-Aranha.', credit: 'Homem-Aranha' },
  { text: 'Qualquer um pode usar a máscara.', credit: 'Miles Morales · No Aranhaverso' },
];

export function BootScreen({ progress = 100 }) {
  const [quoteIndex, setQuoteIndex] = useState(() =>
    Math.floor(Math.random() * spiderQuotes.length),
  );
  useEffect(() => {
    const timer = setInterval(() => setQuoteIndex((i) => (i + 1) % spiderQuotes.length), 4500);
    return () => clearInterval(timer);
  }, []);
  const quote = spiderQuotes[quoteIndex];
  return (
    <div className="boot-screen">
      <div className="boot-frame">
        <Brand />
        <div className="boot-web boot-mask-stage" aria-label="Identidade AracnoIF em expansão">
          <span className="boot-burst burst-one" aria-hidden="true" />
          <span className="boot-burst burst-two" aria-hidden="true" />
          <img
            className="boot-mask"
            src="/icons/spider-mask-red.png"
            alt="Máscara de aranha vermelha"
            width="512"
            height="512"
            fetchPriority="high"
          />
        </div>
        <p className="boot-label">CONECTANDO AO CAMPUS...</p>
        <div
          className="pixel-progress"
          role="progressbar"
          aria-label="Carregamento da interface"
          aria-valuenow={progress}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          {Array.from({ length: 24 }, (_, i) => (
            <i key={i} className={i < Math.round((progress / 100) * 24) ? 'filled' : ''} />
          ))}
        </div>
        <strong className="boot-percentage">{progress}%</strong>
        <div className="boot-quote">
          <img src="/icons/spider-web.svg" alt="" />
          <div className="boot-quote-copy" key={quoteIndex}>
            <p>“{quote.text}”</p>
            <small>{quote.credit}</small>
          </div>
        </div>
        <div className="boot-tip">
          <AlertCircle size={28} />
          <p>
            <strong>Dica:</strong> confira sua próxima sala antes da aula.
          </p>
        </div>
      </div>
    </div>
  );
}
export function VillainPicker({ value = '', onConfirm, onBack, busy = false }) {
  const [selected, setSelected] = useState(value || 'Doutor Octopus');
  return (
    <div className="villain-frame">
      <Brand />
      <div className="step-label">
        ETAPA <b>2</b> DE <b>2</b>
      </div>
      <h1>ESCOLHA SEU VILÃO</h1>
      <p className="villain-subtitle">Sua identidade será exibida aos alunos.</p>
      <div className="villain-grid" role="radiogroup" aria-label="Escolha sua identidade temática">
        {villains.map((v) => (
          <button
            key={v}
            role="radio"
            aria-checked={selected === v}
            className={selected === v ? 'chosen' : ''}
            onClick={() => setSelected(v)}
          >
            {selected === v && (
              <span className="villain-check">
                <Check size={24} />
              </span>
            )}
            <VillainAvatar villain={v} size={60} />
            <span>{v.toUpperCase()}</span>
          </button>
        ))}
      </div>
      <div className="villain-selected">
        <span>VILÃO SELECIONADO:</span>
        <strong>{selected.toUpperCase()}</strong>
      </div>
      <div className="villain-buttons">
        <button className="button secondary" onClick={onBack}>
          VOLTAR
        </button>
        <button className="button primary" disabled={busy} onClick={() => onConfirm(selected)}>
          {busy ? 'SALVANDO…' : 'CONFIRMAR'}
        </button>
      </div>
    </div>
  );
}
export function Login({ onLogin, run, busy, rooms, error }) {
  const [role, setRole] = useState('student'),
    [publicPage, setPublicPage] = useState(null),
    [passwordVisible, setPasswordVisible] = useState(false),
    [signup, setSignup] = useState(false),
    [register, setRegister] = useState(false),
    [registration, setRegistration] = useState(null),
    [registered, setRegistered] = useState(false);
  async function submit(e) {
    e.preventDefault();
    const r = await run(() => api('/login', 'POST', formData(e)));
    if (r) onLogin(r.user);
  }
  function beginRegistration(e) {
    e.preventDefault();
    const form = e.currentTarget;
    const values = formData(e);
    if (values.password !== values.confirm_password) {
      form.elements.confirm_password.setCustomValidity('As senhas precisam ser iguais.');
      form.elements.confirm_password.reportValidity();
      return;
    }
    values.confirm_server = true;
    setRegistration(values);
  }
  if (registration)
    return (
      <div className="villain-layout">
        <VillainPicker
          onBack={() => setRegistration(null)}
          busy={busy}
          onConfirm={async (villain) => {
            const r = await run(() =>
              api('/register/teacher', 'POST', { ...registration, villain }),
            );
            if (r) {
              setRegistration(null);
              setRegister(false);
              setRegistered(true);
            }
          }}
        />
      </div>
    );
  return (
    <div className={`prototype-login ${register ? 'is-registering' : ''}`}>
      <div className="desktop-login-shell">
        <aside className="desktop-login-identity" aria-label="AracnoIF, campus Bragança Paulista">
          <Brand />
          <div className="desktop-mask-display" aria-hidden="true">
            <img className="desktop-web" src="/icons/login-web.svg" alt="" />
            <MaskIcon size={230} />
          </div>
          <div className="desktop-campus-label">
            <span>INSTITUTO FEDERAL DE SÃO PAULO</span>
            <strong>
              BRAGANÇA
              <br />
              PAULISTA
            </strong>
          </div>
        </aside>
        <div className="login-frame" id="main-content" tabIndex="-1">
          <Brand />
          <div className="login-content">
            {register ? (
              <>
                <div className="step-label">
                  ETAPA <b>1</b> DE <b>2</b>
                </div>
                <h1>CADASTRO DE PROFESSOR</h1>
                <form className="teacher-registration" onSubmit={beginRegistration}>
                  <Field label="NOME COMPLETO">
                    <div className="input-icon">
                      <UserRound size={20} />
                      <input
                        name="name"
                        required
                        minLength={3}
                        maxLength={120}
                        autoComplete="name"
                      />
                    </div>
                  </Field>
                  <Field label="SIAPE">
                    <div className="input-icon">
                      <Shield size={20} />
                      <input name="identifier" required maxLength={40} />
                    </div>
                  </Field>
                  <Field label="E-MAIL INSTITUCIONAL">
                    <div className="input-icon">
                      <Mail size={20} />
                      <input
                        name="email"
                        type="email"
                        pattern=".+@(.+\.)?ifsp\.edu\.br"
                        required
                        maxLength={180}
                        autoComplete="email"
                      />
                    </div>
                  </Field>
                  <Field label="ÁREA DE FORMAÇÃO">
                    <div className="input-icon">
                      <GraduationCap size={20} />
                      <input
                        name="course"
                        required
                        maxLength={120}
                        placeholder="Sua área de formação"
                      />
                    </div>
                  </Field>
                  <Field label="SENHA">
                    <div className="input-icon">
                      <Lock size={20} />
                      <input
                        name="password"
                        type={passwordVisible ? 'text' : 'password'}
                        required
                        minLength={8}
                        autoComplete="new-password"
                      />
                    </div>
                  </Field>
                  <Field label="CONFIRMAR SENHA">
                    <div className="input-icon">
                      <Lock size={20} />
                      <input
                        name="confirm_password"
                        type={passwordVisible ? 'text' : 'password'}
                        required
                        minLength={8}
                        autoComplete="new-password"
                        onInput={(e) => e.target.setCustomValidity('')}
                      />
                    </div>
                  </Field>
                  <button
                    className="text-button"
                    type="button"
                    aria-pressed={passwordVisible}
                    onClick={() => setPasswordVisible(!passwordVisible)}
                  >
                    {passwordVisible ? 'Ocultar senhas' : 'Mostrar senhas'}
                  </button>
                  <label className="check-field">
                    <input type="checkbox" required /> Confirmo que sou servidor do IFSP
                  </label>
                  <button className="button primary full">CONTINUAR</button>
                </form>
                <button className="text-button back-login" onClick={() => setRegister(false)}>
                  Já possuo uma conta
                </button>
              </>
            ) : (
              <>
                <h1>ENTRAR</h1>
                <div className="role-tabs">
                  {['student', 'teacher', 'admin'].map((r) => (
                    <button
                      type="button"
                      key={r}
                      className={role === r ? 'selected' : ''}
                      onClick={() => setRole(r)}
                    >
                      {roleNames[r].toUpperCase()}
                    </button>
                  ))}
                </div>
                <form onSubmit={submit} aria-busy={busy}>
                  {error && (
                    <p className="form-error" role="alert">
                      {error}
                    </p>
                  )}
                  <Field label={role === 'student' ? 'PRONTUÁRIO OU E-MAIL' : 'E-MAIL OU SIAPE'}>
                    <div className="input-icon">
                      <UserRound size={24} />
                      <input
                        name="identifier"
                        autoComplete="username"
                        required
                        placeholder={
                          role === 'student' ? 'PRONTUÁRIO OU E-MAIL' : 'E-MAIL OU SIAPE'
                        }
                      />
                    </div>
                  </Field>
                  <Field label="SENHA">
                    <div className="input-icon">
                      <Lock size={24} />
                      <input
                        name="password"
                        type={passwordVisible ? 'text' : 'password'}
                        autoComplete="current-password"
                        required
                        placeholder="SENHA"
                      />
                      <button
                        type="button"
                        className="icon-button"
                        onClick={() => setPasswordVisible(!passwordVisible)}
                        aria-label={passwordVisible ? 'Ocultar senha' : 'Mostrar senha'}
                      >
                        {passwordVisible ? <EyeOff size={20} /> : <Eye size={20} />}
                      </button>
                    </div>
                  </Field>

                  <button className="button primary full" disabled={busy}>
                    {busy ? 'ENTRANDO…' : 'ENTRAR'}
                  </button>
                </form>
                {isDemo && <p className="login-caption">Dados reiniciam ao recarregar a página.</p>}
                {role !== 'admin' && (
                  <button
                    className="text-button create-account"
                    onClick={() => (role === 'teacher' ? setRegister(true) : setSignup(true))}
                  >
                    {role === 'teacher' ? 'Cadastrar professor' : 'Solicitar acesso'}
                  </button>
                )}
                <div className="public-links">
                  <button onClick={() => setPublicPage('map')}>
                    <Map size={16} /> Mapa público
                  </button>
                  <button onClick={() => setPublicPage('about')}>
                    <FileText size={16} /> Ajuda
                  </button>
                  <button onClick={() => setPublicPage('contact')}>
                    <Mail size={16} /> Contato
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
      {signup && (
        <Modal title="Acesso institucional" onClose={() => setSignup(false)}>
          <p>
            O administrador cadastra alunos e libera os acessos ao AracnoIF. Solicite seu cadastro à
            equipe responsável.
          </p>
          <p className="muted">
            Professores podem enviar seu cadastro e escolher um vilão, aguardando a ativação pelo
            administrador.
          </p>
          <button className="button primary full" onClick={() => setSignup(false)}>
            ENTENDI
          </button>
        </Modal>
      )}
      {registered && (
        <Modal title="Cadastro enviado" onClose={() => setRegistered(false)}>
          <p>Seu vilão foi escolhido! A conta está aguardando ativação pelo administrador.</p>
          <p className="muted">
            {isDemo
              ? 'Na demonstração, o cadastro permanece somente até recarregar a página.'
              : 'Após a ativação, entre usando seu e-mail ou SIAPE e sua senha.'}
          </p>
          <button className="button primary full" onClick={() => setRegistered(false)}>
            VOLTAR AO LOGIN
          </button>
        </Modal>
      )}
      {publicPage && (
        <Modal
          title={publicPage === 'map' ? 'Mapa público do campus' : publicPage === 'contact' ? 'Fale com o AracnoIF' : 'Ajuda'}
          onClose={() => setPublicPage(null)}
        >
          {publicPage === 'map' ? (
            <CampusMap rooms={rooms} compact />
          ) : publicPage === 'contact' ? (
            <form
              onSubmit={async (event) => {
                event.preventDefault();
                const result = await run(() => api('/contact', 'POST', formData(event)), 'Mensagem enviada.');
                if (result) setPublicPage(null);
              }}
            >
              <Field label="Nome"><input name="name" required minLength={3} maxLength={120} /></Field>
              <Field label="E-mail"><input name="email" type="email" required maxLength={180} /></Field>
              <Field label="Assunto"><input name="subject" required minLength={3} maxLength={160} /></Field>
              <Field label="Mensagem"><textarea name="body" required minLength={5} maxLength={2000} rows={5} /></Field>
              <button className="button primary full" disabled={busy}>Enviar mensagem</button>
            </form>
          ) : (
            <>
              <p>
                O AracnoIF é um projeto acadêmico para consultar aulas, conversar com a turma e
                localizar espaços no IFSP Bragança Paulista.
              </p>
              <details className="quiet-details">
                <summary>Instalar no iPhone</summary>
                <p>No Safari: Compartilhar → Adicionar à Tela de Início.</p>
              </details>
            </>
          )}
        </Modal>
      )}
    </div>
  );
}
