import initialAdmin from './initial-admin.json';
export const villains = [
  'Doutor Octopus',
  'Duende Verde',
  'Venom',
  'Mystério',
  'Electro',
  'Abutre',
  'Homem-Areia',
  'Lagarto',
];
export const floorLabels = {
  1: 'Mecânica e serviços',
  2: 'Eletrônica e laboratórios',
  3: 'Pátio, biblioteca e cantina',
  4: 'Informática e professores',
  5: 'Salas de aula e informática',
};
const locations = {
  1: [
    'Laboratório de mecânica',
    'Laboratório de metalografia',
    'Solda',
    'Laboratório de ensaios não destrutivos',
    'Laboratório de ensaios mecânicos',
    'Sala do CTI',
  ],
  2: [
    'Laboratório de eletrônica 1',
    'Laboratório de eletrônica 2',
    'Laboratório de eletrônica 3',
    'Laboratório de eletrônica 4',
    'Laboratório de CLP',
    'Laboratório de CNC',
    'Laboratório de hidráulica e pneumática',
  ],
  3: [
    'Guarita',
    'Secretaria de atendimento ao aluno',
    'Pátio',
    'Cantina',
    'Biblioteca',
    'Terraço descoberto',
  ],
  4: [
    'Informática 01',
    'Informática 02',
    'Informática 03',
    'Informática 04',
    'Informática 05',
    'Informática 08',
    'Laboratório de física',
    'Laboratório de artes e línguas',
    'Sala dos professores',
  ],
  5: [
    'Sala de reunião 3',
    'Informática 07',
    'Informática 08 (5º pavimento)',
    'Informática 09',
    'Informática 10',
    'Sala de aula 01',
    'Sala de aula 02',
    'Sala de aula 03',
    'Sala de aula 04',
    'Sala de aula 05',
    'Sala de aula 06',
    'Sala de aula 07',
    'Sala de aula 08',
  ],
};

// O ID usa o pavimento como começo (ex.: 501 é uma sala do 5º pavimento).
export const rooms = Object.entries(locations).flatMap(([floor, names]) =>
  names.map((name, i) => ({
    id: Number(floor) * 100 + i + 1,
    name,
    floor: Number(floor),
    node: `f${floor}-r${i + 1}`,
  })),
);
// Apenas o administrador é pré-configurado. Alunos e professores entram pelo cadastro.
export function demoStore() {
  return {
    users: [
      {
        id: 1,
        name: initialAdmin.name,
        email: initialAdmin.email,
        identifier: initialAdmin.identifier,
        role: 'admin',
        active: true,
        course: '',
        semester: '',
        villain: '',
      },
    ],
    classes: [],
    rooms: structuredClone(rooms),
    lessons: [],
    notices: [],
    memberships: [],
  };
}
