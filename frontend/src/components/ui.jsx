import React, { useState, useEffect, useRef } from 'react';
import { Shield, X } from 'lucide-react';

export function ThemeIcon({ kind = 'mask', size = 24, className = '' }) {
  return (
    <img
      className={`theme-icon ${className}`}
      src={kind === 'spider' ? '/icons/spider-emblem.png' : '/icons/spider-mask-red.png'}
      width={size}
      height={size}
      alt=""
      aria-hidden="true"
    />
  );
}
export function MaskIcon(props) {
  return <ThemeIcon {...props} kind="mask" />;
}
export function SpiderIcon(props) {
  return <ThemeIcon {...props} kind="spider" />;
}
export function Brand() {
  return (
    <div className="brand">
      <div className="brand-mark">
        <SpiderIcon size={34} />
      </div>
      <div>
        <strong>
          ARACNO<span>IF</span>
        </strong>
        <small>CAMPUS BRAGANÇA PAULISTA</small>
      </div>
    </div>
  );
}
const villainImages = {
  'Doutor Octopus': '/icons/villains-cutout/octopus.png',
  'Duende Verde': '/icons/villains-cutout/goblin.png',
  Venom: '/icons/villains-cutout/venom.png',
  Mystério: '/icons/villains-cutout/mysterio.png',
  Electro: '/icons/villains-cutout/electro.png',
  Abutre: '/icons/villains-cutout/vulture.png',
  'Homem-Areia': '/icons/villains-cutout/sandman.png',
  Lagarto: '/icons/villains-cutout/lizard.png',
};
export function VillainAvatar({ villain, size = 48 }) {
  return (
    <img
      className="villain-avatar"
      width={size}
      height={size}
      src={villainImages[villain] || villainImages['Doutor Octopus']}
      alt={villain || 'Identidade temática'}
    />
  );
}
export function Avatar({ user, small = false }) {
  return (
    <div className={`avatar ${user?.role || ''} ${small ? 'small' : ''}`}>
      {user?.avatar ? (
        <img
          className="avatar-photo"
          src={user.avatar}
          alt={user.name ? `Foto de ${user.name}` : ''}
        />
      ) : user?.role === 'student' ? (
        <MaskIcon size={small ? 26 : 42} />
      ) : user?.role === 'teacher' ? (
        <VillainAvatar villain={user.villain} size={small ? 28 : 42} />
      ) : (
        <Shield size={small ? 24 : 34} />
      )}
    </div>
  );
}
export function LessonStatus({ status }) {
  return (
    <span className={`status ${status}`}>
      {{
        scheduled: 'Agendada',
        started: 'Iniciada',
        cancelled: 'Cancelada',
        completed: 'Encerrada',
      }[status] || status}
    </span>
  );
}
export function Field({ label, children }) {
  return (
    <label className="field">
      <span>{label}</span>
      {children}
    </label>
  );
}
export function Panel({ title, icon: Icon, action, children, className = '' }) {
  return (
    <section className={`panel ${className}`}>
      <div className="panel-head">
        <h2>
          {Icon && <Icon size={18} />} {title}
        </h2>
        {action}
      </div>
      {children}
    </section>
  );
}
export function Modal({ title, children, onClose }) {
  const ref = useRef(),
    closeRef = useRef(onClose);
  closeRef.current = onClose;
  useEffect(() => {
    const previous = document.activeElement;
    const dialog = ref.current;
    dialog.showModal();
    const handler = (e) => {
      e.preventDefault();
      closeRef.current();
    };
    dialog.addEventListener('cancel', handler);
    return () => {
      dialog.removeEventListener('cancel', handler);
      dialog.close();
      previous?.focus();
    };
  }, []);
  return (
    <dialog
      ref={ref}
      aria-label={title}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="dialog-head">
        <h2>{title}</h2>
        <button className="icon-button" onClick={onClose} aria-label="Fechar">
          <X />
        </button>
      </div>
      {children}
    </dialog>
  );
}
export function PageLoading() {
  return (
    <div className="page-loading" role="status">
      <div className="loading-heading" />
      <div className="loading-stats">
        <i />
        <i />
        <i />
      </div>
      <div className="loading-cards">
        <i />
        <i />
      </div>
      <p>Carregando seus dados…</p>
    </div>
  );
}
export function PageTitle({ title, subtitle, action }) {
  return (
    <div className="page-title">
      <div>
        <h1>{title}</h1>
        {subtitle && <p>{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}
