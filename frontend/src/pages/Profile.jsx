import React, { useEffect, useRef, useState } from 'react';
import { Settings, Check, UserRound, LogOut, Camera, Trash2 } from 'lucide-react';
import { api, isDemo } from '../services/api';
import { roleNames, formData } from '../utils/format';
import { SpiderIcon, Avatar, Field, Panel, Modal, PageTitle } from '../components/ui';

import { VillainPicker } from './Auth';

function compressAvatar(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Não foi possível ler essa imagem.'));
    reader.onload = () => {
      const image = new Image();
      image.onerror = () => reject(new Error('Use uma imagem JPG, PNG ou WEBP.'));
      image.onload = () => {
        const size = 256;
        const scale = Math.min(size / image.width, size / image.height, 1);
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, Math.round(image.width * scale));
        canvas.height = Math.max(1, Math.round(image.height * scale));
        const context = canvas.getContext('2d');
        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Não foi possível preparar essa imagem.'));
              return;
            }
            const output = new FileReader();
            output.onerror = () => reject(new Error('Não foi possível preparar essa imagem.'));
            output.onload = () => resolve(output.result);
            output.readAsDataURL(blob);
          },
          'image/jpeg',
          0.82,
        );
      };
      image.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

export function Profile({ user, setUser, run, busy, onLogout }) {
  const [choose, setChoose] = useState(false);
  const [avatar, setAvatar] = useState(user.avatar || '');
  const [avatarError, setAvatarError] = useState('');
  const [photoBusy, setPhotoBusy] = useState(false);
  const photoInput = useRef(null);
  useEffect(() => setAvatar(user.avatar || ''), [user.avatar]);
  async function handlePhotoChange(event) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setAvatarError('Escolha uma imagem JPG, PNG ou WEBP.');
      return;
    }
    setPhotoBusy(true);
    setAvatarError('');
    try {
      setAvatar(await compressAvatar(file));
    } catch (error) {
      setAvatarError(error.message);
    } finally {
      setPhotoBusy(false);
    }
  }
  return (
    <>
      <PageTitle title="CONFIGURAÇÕES" subtitle="Ajuste sua conta e sua identidade no AracnoIF." />
      <div className="profile-layout">
        <Panel title="IDENTIDADE" icon={UserRound}>
          <div className="profile-identity">
            <Avatar user={{ ...user, avatar }} />
            <h2>{user.name}</h2>
            <span className="status">{roleNames[user.role]}</span>
            <p>{user.identifier}</p>
            <p className="muted">
              {user.course}
              {user.semester && ` · ${user.semester} semestre`}
            </p>
            {user.villain && <span className="villain-label">{user.villain}</span>}
            {user.role === 'teacher' && (
              <button
                className="button primary full choose-villain-action"
                onClick={() => setChoose(true)}
              >
                <SpiderIcon size={24} /> ESCOLHER MEU VILÃO
              </button>
            )}
          </div>
        </Panel>
        <Panel title="SEUS DADOS" icon={Settings}>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              const p = formData(e);
              const result = await run(
                () => api('/profile', 'PATCH', { ...p, avatar }),
                'Configurações salvas.',
              );
              if (result) setUser({ ...result });
            }}
          >
            <div className="profile-photo-editor">
              <Avatar user={{ ...user, avatar }} />
              <div>
                <strong>FOTO DE PERFIL</strong>
                <p className="muted">Escolha uma imagem quadrada para aparecer no app.</p>
                <div className="profile-photo-actions">
                  <input
                    ref={photoInput}
                    className="visually-hidden"
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handlePhotoChange}
                    disabled={photoBusy || busy}
                  />
                  <button
                    type="button"
                    className="button secondary"
                    onClick={() => photoInput.current?.click()}
                    disabled={photoBusy || busy}
                  >
                    <Camera size={16} /> {photoBusy ? 'PREPARANDO...' : 'ESCOLHER FOTO'}
                  </button>
                  {avatar && (
                    <button
                      type="button"
                      className="text-button danger"
                      onClick={() => {
                        setAvatar('');
                        setAvatarError('');
                      }}
                      disabled={photoBusy || busy}
                    >
                      <Trash2 size={15} /> Remover
                    </button>
                  )}
                </div>
                {avatarError && (
                  <p className="field-error" role="alert">
                    {avatarError}
                  </p>
                )}
              </div>
            </div>
            <Field label="NOME COMPLETO">
              <input name="name" defaultValue={user.name} required minLength={3} maxLength={120} />
            </Field>
            <Field label="E-MAIL INSTITUCIONAL">
              <input name="email" type="email" defaultValue={user.email} required maxLength={180} />
            </Field>
            {!isDemo && (
              <>
                <Field label="SENHA ATUAL (PARA ALTERAR A SENHA)">
                  <input name="current_password" type="password" autoComplete="current-password" />
                </Field>
                <Field label="NOVA SENHA (OPCIONAL)">
                  <input
                    name="password"
                    type="password"
                    autoComplete="new-password"
                    minLength={8}
                  />
                </Field>
              </>
            )}
            <button className="button primary" disabled={busy}>
              <Check size={17} /> SALVAR ALTERAÇÕES
            </button>
          </form>
        </Panel>
      </div>
      {onLogout && (
        <button className="button secondary full" onClick={onLogout} disabled={busy}>
          <LogOut size={18} /> Sair da conta
        </button>
      )}
      {choose && (
        <Modal title="Sua identidade temática" onClose={() => setChoose(false)}>
          <VillainPicker
            value={user.villain}
            busy={busy}
            onBack={() => setChoose(false)}
            onConfirm={async (villain) => {
              const result = await run(
                () => api('/profile', 'PATCH', { villain }),
                'Vilão confirmado.',
              );
              if (result) {
                setUser({ ...result });
                setChoose(false);
              }
            }}
          />
        </Modal>
      )}
    </>
  );
}
