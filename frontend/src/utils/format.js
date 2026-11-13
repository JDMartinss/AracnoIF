export const roleNames = { student: 'Aluno', teacher: 'Professor', admin: 'Administrador' };
export const time = (d) =>
  new Date(d).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
export const date = (d) =>
  new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
export const day = (d) => new Date(d).toLocaleDateString('pt-BR', { weekday: 'long' });
export const todayDate = new Date().toLocaleDateString('pt-BR', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
});
export const formData = (e) => Object.fromEntries(new FormData(e.currentTarget));
