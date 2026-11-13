// Traced proportions and room order from the five supplied campus photographs.
// Coordinates describe the diagram only: no measured scale or certified floor links.
const room = (n, x, y, w, h, label, door, hall) => ({ node: n, x, y, w, h, label, door, hall });
const box = (x, y, w, h, label, kind = 'context') => ({ x, y, w, h, label, kind });
const commonCore = [
  box(222, 282, 35, 118, ['Escada'], 'stairs'),
  box(260, 324, 38, 42, ['Elev.'], 'elevator'),
  box(904, 428, 54, 40, ['Escada'], 'stairs'),
];
const upperRamp = {
  upper: [
    [350, 230],
    [745, 294],
    [745, 330],
    [350, 267],
  ],
  lower: [
    [350, 408],
    [745, 330],
    [745, 367],
    [350, 446],
  ],
  turn: [
    [745, 294],
    [769, 294],
    [769, 367],
    [745, 367],
  ],
};
const upperHall = [
  [
    [305, 185],
    [740, 185],
  ],
  [
    [315, 185],
    [315, 458],
  ],
  [
    [70, 458],
    [930, 458],
  ],
  [
    [315, 250],
    [350, 250],
  ],
  [
    [315, 428],
    [350, 428],
  ],
  [
    [257, 300],
    [315, 300],
  ],
];
const upperNodes = { u: [315, 185], s: [315, 300], b: [315, 458], stairs: [257, 300] };
const upperEdges = [
  ['u', 's'],
  ['s', 'b'],
  ['s', 'stairs'],
];
const upperAncillary = [
  box(263, 45, 44, 121, ['San.', 'masc.']),
  box(309, 45, 44, 121, ['San.', 'fem.']),
];
export const campusLayouts = {
  1: {
    height: 650,
    corridors: [
      [
        [278, 178],
        [278, 296],
      ],
      [
        [278, 296],
        [926, 296],
      ],
    ],
    nodes: { s: [278, 178], b: [278, 296], stairs: [244, 178] },
    edges: [
      ['s', 'b'],
      ['s', 'stairs'],
    ],
    stairs: 'stairs',
    ramp: null,
    features: [
      box(210, 112, 55, 94, ['Escada'], 'stairs'),
      box(893, 305, 60, 37, ['Escada'], 'stairs'),
      box(688, 218, 108, 48, ['Desfazimento']),
      box(800, 296, 93, 70, ['Copa', 'servidores']),
      box(893, 267, 60, 36, ['Depósito']),
      box(376, 318, 27, 105, ['Alm.']),
      box(405, 318, 32, 105, ['San.', 'fem.']),
      box(439, 318, 32, 105, ['San.', 'masc.']),
      box(657, 371, 58, 28, ['Manut.']),
      box(657, 401, 58, 25, ['Serv.']),
      box(720, 318, 34, 108, ['Oficina']),
      box(758, 318, 43, 108, ['Almox.']),
      box(855, 370, 35, 55, ['San.', 'fem.']),
      box(896, 370, 35, 55, ['San.', 'masc.']),
    ],
    rooms: [
      room('f1-r1', 70, 276, 200, 260, ['Laboratório', 'de mecânica'], [270, 307], [278, 296]),
      room('f1-r2', 278, 318, 94, 108, ['Lab. de', 'metalografia'], [325, 318], [325, 296]),
      room('f1-r3', 278, 430, 94, 106, ['Solda'], [325, 430], [325, 296]),
      room('f1-r4', 476, 318, 89, 108, ['Ensaios não', 'destrutivos'], [520, 318], [520, 296]),
      room('f1-r5', 569, 318, 83, 108, ['Ensaios', 'mecânicos'], [610, 318], [610, 296]),
      room('f1-r6', 657, 318, 58, 49, ['Sala CTI'], [686, 318], [686, 296]),
    ],
    note: 'Escada à esquerda, corredor horizontal e escada na extremidade direita. A foto deste pavimento não mostra a rampa central nem identifica o elevador.',
  },
  2: {
    height: 650,
    corridors: [
      [
        [161, 154],
        [161, 369],
      ],
      [
        [161, 369],
        [925, 369],
      ],
      [
        [161, 193],
        [220, 193],
      ],
      [
        [161, 326],
        [220, 326],
      ],
      [
        [137, 154],
        [161, 154],
      ],
    ],
    nodes: { s: [161, 154], b: [161, 369], stairs: [137, 154] },
    edges: [
      ['s', 'b'],
      ['s', 'stairs'],
    ],
    stairs: 'stairs',
    ramp: {
      upper: [
        [220, 173],
        [638, 231],
        [638, 267],
        [220, 211],
      ],
      lower: [
        [220, 307],
        [638, 267],
        [638, 303],
        [220, 345],
      ],
      turn: [
        [638, 231],
        [662, 231],
        [662, 303],
        [638, 303],
      ],
    },
    features: [
      box(97, 116, 40, 89, ['Escada'], 'stairs'),
      box(891, 347, 59, 43, ['Escada'], 'stairs'),
      box(267, 394, 39, 115, ['San.', 'masc.']),
      box(309, 394, 39, 115, ['San.', 'fem.']),
    ],
    rooms: [
      room('f2-r1', 155, 394, 109, 115, ['Eletrônica 1'], [210, 394], [210, 369]),
      room('f2-r2', 155, 513, 109, 95, ['Eletrônica 2'], [210, 513], [210, 369]),
      room('f2-r3', 352, 394, 115, 115, ['Eletrônica 3'], [410, 394], [410, 369]),
      room('f2-r4', 471, 394, 115, 115, ['Eletrônica 4'], [528, 394], [528, 369]),
      room('f2-r5', 590, 394, 105, 115, ['Laboratório', 'CLP'], [642, 394], [642, 369]),
      room('f2-r6', 699, 394, 105, 115, ['Laboratório', 'CNC'], [751, 394], [751, 369]),
      room('f2-r7', 808, 394, 142, 115, ['Hidráulica e', 'pneumática'], [879, 394], [879, 369]),
    ],
    note: 'Rampa em duas pernas no centro, escada à esquerda e escada à direita do corredor dos laboratórios. O elevador não está identificado nesta foto.',
  },
  3: {
    height: 690,
    corridors: [
      [
        [235, 257],
        [235, 471],
      ],
      [
        [166, 471],
        [939, 471],
      ],
      [
        [178, 365],
        [235, 365],
      ],
      [
        [235, 302],
        [270, 302],
      ],
      [
        [235, 424],
        [270, 424],
      ],
    ],
    nodes: { u: [235, 257], s: [235, 365], b: [235, 471], stairs: [178, 365] },
    edges: [
      ['u', 's'],
      ['s', 'b'],
      ['s', 'stairs'],
    ],
    stairs: 'stairs',
    ramp: {
      upper: [
        [270, 283],
        [663, 332],
        [663, 367],
        [270, 320],
      ],
      lower: [
        [270, 408],
        [663, 367],
        [663, 401],
        [270, 446],
      ],
      turn: [
        [663, 332],
        [689, 332],
        [689, 401],
        [663, 401],
      ],
    },
    features: [
      box(137, 306, 41, 123, ['Escada'], 'stairs'),
      box(910, 450, 57, 34, ['Escada'], 'stairs'),
      box(320, 495, 55, 96, ['San.', 'masc.']),
      box(379, 495, 55, 96, ['San.', 'fem.']),
      box(438, 495, 529, 96, ['ÁREA RESTRITA'], 'restricted'),
    ],
    rooms: [
      room('f3-r1', 661, 38, 100, 69, ['Guarita'], [661, 72], [235, 257]),
      room('f3-r2', 52, 157, 135, 100, ['Secretaria de', 'atendimento'], [187, 207], [235, 257]),
      room('f3-r3', 191, 157, 312, 100, ['Pátio'], [235, 257], [235, 257]),
      room('f3-r4', 507, 180, 153, 77, ['Cantina'], [507, 218], [235, 257]),
      room('f3-r5', 52, 495, 263, 124, ['Biblioteca'], [184, 495], [184, 471]),
      room('f3-r6', 52, 623, 263, 41, ['Terraço descoberto'], [184, 623], [184, 471]),
    ],
    note: 'Guarita acima do pátio; secretaria à esquerda, cantina à direita. Biblioteca e terraço ficam na ala inferior, com setor restrito ao lado. Escadas nas duas extremidades; elevador não identificado na foto.',
  },
  4: {
    height: 650,
    corridors: upperHall,
    nodes: upperNodes,
    edges: upperEdges,
    stairs: 'stairs',
    ramp: upperRamp,
    pavilions: [
      { code: 'B', x: 835, y: 24 },
      { code: 'A', x: 760, y: 625 },
    ],
    features: [
      ...commonCore,
      ...upperAncillary,
      box(70, 483, 92, 110, ['Química /', 'Biologia']),
      box(367, 483, 31, 110, ['San.', 'fem.']),
      box(401, 483, 31, 110, ['San.', 'masc.']),
      box(436, 483, 29, 110, ['San.']),
      box(469, 483, 77, 43, ['At. aluno']),
      ...Array.from({ length: 15 }, (_, i) =>
        box(550 + Math.floor(i / 2) * 50, 483 + (i % 2) * 56, 47, 52, [
          `Prof./pesq.`,
          `${String(i + 1).padStart(2, '0')}`,
        ]),
      ),
    ],
    rooms: [
      room('f4-r1', 70, 45, 96, 157, ['Informática', '01'], [166, 157], [315, 185]),
      room('f4-r2', 170, 45, 89, 121, ['Informática', '02'], [214, 166], [214, 185]),
      room('f4-r3', 357, 45, 92, 121, ['Informática', '03'], [403, 166], [403, 185]),
      room('f4-r4', 453, 45, 92, 121, ['Informática', '04'], [499, 166], [499, 185]),
      room('f4-r5', 549, 45, 92, 121, ['Informática', '05'], [595, 166], [595, 185]),
      room('f4-r6', 645, 45, 95, 157, ['Informática', '08'], [692, 202], [692, 185]),
      room('f4-r7', 166, 483, 95, 110, ['Laboratório', 'de física'], [213, 483], [213, 458]),
      room('f4-r8', 265, 483, 98, 110, ['Artes e', 'línguas'], [314, 483], [314, 458]),
      room('f4-r9', 469, 530, 77, 63, ['Sala dos', 'professores'], [507, 530], [507, 458]),
    ],
    note: 'Pavilhão B fica na parte superior da planta, com as salas de informática. Pavilhão A fica na parte inferior, com laboratórios e professores. Escada e elevador ficam na circulação esquerda; a rampa central liga as áreas.',
  },
  5: {
    height: 650,
    corridors: upperHall,
    nodes: upperNodes,
    edges: upperEdges,
    stairs: 'stairs',
    ramp: upperRamp,
    pavilions: [
      { code: 'B', x: 835, y: 24 },
      { code: 'A', x: 760, y: 625 },
    ],
    features: [
      ...commonCore,
      ...upperAncillary,
      box(376, 483, 43, 119, ['San.', 'masc.']),
      box(423, 483, 43, 119, ['San.', 'fem.']),
    ],
    rooms: [
      room('f5-r1', 70, 45, 189, 157, ['Sala de', 'reunião 3'], [259, 158], [315, 185]),
      room('f5-r2', 357, 45, 92, 121, ['Informática', '07'], [403, 166], [403, 185]),
      room('f5-r3', 453, 45, 92, 121, ['Informática', '08'], [499, 166], [499, 185]),
      room('f5-r4', 549, 45, 92, 121, ['Informática', '09'], [595, 166], [595, 185]),
      room('f5-r5', 645, 45, 95, 157, ['Informática', '10'], [692, 202], [692, 185]),
      room('f5-r6', 70, 483, 98, 119, ['Sala de aula', '01'], [168, 496], [168, 458]),
      room('f5-r7', 172, 483, 98, 119, ['Sala de aula', '02'], [221, 483], [221, 458]),
      room('f5-r8', 274, 483, 98, 119, ['Sala de aula', '03'], [323, 483], [323, 458]),
      room('f5-r9', 470, 483, 94, 119, ['Sala de aula', '04'], [517, 483], [517, 458]),
      room('f5-r10', 568, 483, 94, 119, ['Sala de aula', '05'], [615, 483], [615, 458]),
      room('f5-r11', 666, 483, 94, 119, ['Sala de aula', '06'], [713, 483], [713, 458]),
      room('f5-r12', 764, 483, 94, 119, ['Sala de aula', '07'], [811, 483], [811, 458]),
      room('f5-r13', 862, 483, 96, 119, ['Sala de aula', '08'], [910, 483], [910, 458]),
    ],
    note: 'Pavilhão B fica na parte superior da planta, com a sala de reunião e informática. Pavilhão A fica na parte inferior, com as salas de aula 01 a 08. Escada e elevador ficam no núcleo esquerdo; a rampa central aparece entre as duas áreas.',
  },
};

export function mappedRooms(floor, rooms) {
  const layout = campusLayouts[floor];
  return layout.rooms.flatMap((p) => {
    const r = rooms.find((r) => r.floor === floor && r.node === p.node);
    return r ? [{ ...p, ...r }] : [];
  });
}
// Construct corridor routes from surveyed diagram junctions, not straight room-to-room lines.
export function localRoute(floor, rooms, origin, destination) {
  const layout = campusLayouts[floor];
  const list = mappedRooms(floor, rooms);
  const src = list.find((r) => r.id === origin),
    dest = list.find((r) => r.id === destination);
  if (!src && !dest) return null;
  if (src?.id === dest?.id) return null;
  const nodes = { ...layout.nodes },
    edges = [...layout.edges];
  // Room-to-corridor legs use the visible doors; rooms behind another room pass through it.
  const connections = list.map((r) => ({ key: `r${r.id}`, point: r.hall, room: r }));
  const rowGroups = new Map();
  for (const c of connections) {
    const y = c.point[1];
    const key = y.toString();
    if (!rowGroups.has(key)) rowGroups.set(key, []);
    rowGroups.get(key).push(c);
    nodes[c.key] = c.point;
  }
  for (const group of rowGroups.values()) {
    const y = group[0].point[1];
    const anchors = Object.entries(layout.nodes)
      .filter(([k, p]) => k !== 'stairs' && p[1] === y)
      .map(([key, point]) => ({ key, point }));
    const sorted = [...group, ...anchors].sort((a, b) => a.point[0] - b.point[0]);
    for (let i = 1; i < sorted.length; i++) edges.push([sorted[i - 1].key, sorted[i].key]);
  }
  const start = src ? `r${src.id}` : layout.stairs,
    end = dest ? `r${dest.id}` : layout.stairs;
  const queue = [[start]],
    seen = new Set([start]);
  let keys;
  while (queue.length) {
    const path = queue.shift(),
      key = path.at(-1);
    if (key === end) {
      keys = path;
      break;
    }
    for (const [a, b] of edges) {
      const next = a === key ? b : b === key ? a : null;
      if (next && !seen.has(next)) {
        seen.add(next);
        queue.push([...path, next]);
      }
    }
  }
  if (!keys) return null;
  let points = keys.map((k) => nodes[k]);
  const roomLeg = (r) => {
    if (r.node === 'f1-r3') return [r.door, [325, 426], [325, 318], r.hall];
    if (r.node === 'f2-r2') return [r.door, [210, 509], [210, 394], r.hall];
    if (r.node === 'f3-r6') return [r.door, [184, 619], [184, 495], r.hall];
    if (r.node === 'f3-r1') return [r.door, [560, 120], [400, 140], [235, 157], r.hall];
    if (r.node === 'f3-r2') return [r.door, [235, 207], r.hall];
    if (r.node === 'f3-r4') return [r.door, [400, 218], [235, 218], r.hall];
    if (r.node === 'f4-r9') return [r.door, [507, 526], [507, 483], r.hall];
    if (r.node === 'f4-r1' || r.node === 'f5-r1') return [r.door, [r.door[0], 185], r.hall];
    return [r.door, r.hall];
  };
  if (src) points = [...roomLeg(src), ...points.slice(1)];
  if (dest) points = [...points.slice(0, -1), ...roomLeg(dest).reverse()];
  return points.filter((p, i) => !i || p[0] !== points[i - 1][0] || p[1] !== points[i - 1][1]);
}
