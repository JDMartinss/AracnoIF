import React from 'react';
import { campusLayouts, mappedRooms, localRoute } from './campus-layouts';
function Label({ x, y, lines, color = '#bad6e5', size = 14 }) {
  return (
    <text
      x={x}
      y={y - (lines.length - 1) * size * 0.62}
      fill={color}
      textAnchor="middle"
      fontSize={size}
      fontFamily="Arial, Helvetica, sans-serif"
    >
      {lines.map((line, i) => (
        <tspan key={i} x={x} dy={i ? size * 1.25 : 0}>
          {line}
        </tspan>
      ))}
    </text>
  );
}
function Feature({ item, mini, onSelect, selected }) {
  const f = item,
    isStairs = f.kind === 'stairs',
    isElevator = f.kind === 'elevator';
  return (
    <g
      role={onSelect ? 'button' : undefined}
      tabIndex={onSelect ? 0 : undefined}
      aria-label={isElevator ? 'Elevador' : f.label.join(' ')}
      onClick={onSelect}
      onKeyDown={(e) => {
        if (onSelect && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          onSelect();
        }
      }}
    >
      <title>{isElevator ? 'Elevador identificado na planta' : f.label.join(' ')}</title>
      <rect
        x={f.x}
        y={f.y}
        width={f.w}
        height={f.h}
        fill={
          isStairs
            ? '#24304c'
            : isElevator
              ? '#403214'
              : f.kind === 'restricted'
                ? '#20192d'
                : '#0c2132'
        }
        stroke={isStairs ? '#ae94ff' : isElevator ? '#ffbc43' : '#426880'}
        strokeWidth={selected ? 4 : isStairs || isElevator ? 2 : 1}
      />
      {selected && (
        <rect
          x={f.x - 7}
          y={f.y - 7}
          width={f.w + 14}
          height={f.h + 14}
          fill="none"
          stroke="#fff"
          strokeWidth="3"
          strokeDasharray="6 4"
        />
      )}
      {isStairs &&
        Array.from({ length: 8 }, (_, i) => (
          <path
            key={i}
            d={`M ${f.x + 5} ${f.y + 6 + (i * (f.h - 12)) / 8} H ${f.x + f.w - 5}`}
            stroke="#897bb1"
          />
        ))}
      {!mini &&
        (isStairs ? (
          <Label x={f.x + f.w / 2} y={f.y - 11} lines={f.label} size={12} color="#cabaff" />
        ) : (
          <Label
            x={f.x + f.w / 2}
            y={f.y + f.h / 2}
            lines={f.label}
            size={f.w < 60 ? 10 : 13}
            color={isElevator ? '#ffd379' : '#8caabd'}
          />
        ))}
      {isElevator && (
        <path d={`M${f.x + 9} ${f.y + 8}l4 -4 4 4m4 22l4 4 4 -4`} stroke="#ffbc43" fill="none" />
      )}
    </g>
  );
}
function Ramp({ ramp, mini, onSelect, selected }) {
  if (!ramp) return null;
  const pointString = (p) => p.map((p) => p.join(',')).join(' ');
  return (
    <g
      role={onSelect ? 'button' : undefined}
      tabIndex={onSelect ? 0 : undefined}
      aria-label="Rampa central"
      onClick={onSelect}
      onKeyDown={(e) => {
        if (onSelect && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          onSelect();
        }
      }}
    >
      <title>Rampa central em zigue-zague, conforme a foto</title>
      {[ramp.upper, ramp.lower, ramp.turn].map((p, i) => (
        <polygon
          key={i}
          points={pointString(p)}
          fill="#102a33"
          stroke={selected ? '#fff' : '#53bcad'}
          strokeWidth={selected ? 4 : 2}
        />
      ))}
      {[ramp.upper, ramp.lower].map((p, i) => (
        <g key={i}>
          {[0.22, 0.44, 0.66, 0.88].map((t) => (
            <line
              key={t}
              x1={p[0][0] + (p[1][0] - p[0][0]) * t}
              y1={p[0][1] + (p[1][1] - p[0][1]) * t}
              x2={p[3][0] + (p[2][0] - p[3][0]) * t}
              y2={p[3][1] + (p[2][1] - p[3][1]) * t}
              stroke="#315f64"
            />
          ))}
        </g>
      ))}
      {!mini && (
        <Label
          x={(ramp.upper[0][0] + ramp.upper[1][0]) / 2}
          y={(ramp.upper[0][1] + ramp.upper[1][1]) / 2 + 21}
          lines={['RAMPA']}
          color="#9de6d9"
          size={14}
        />
      )}
    </g>
  );
}
function PavilionMarker({ marker, mini }) {
  if (mini) return null;
  const width = 170;
  return (
    <g aria-label={`Pavilhão ${marker.code}`}>
      <rect
        x={marker.x - width / 2}
        y={marker.y - 16}
        width={width}
        height="32"
        rx="8"
        fill={marker.code === 'B' ? '#123750' : '#3c1f32'}
        stroke={marker.code === 'B' ? '#64c6e8' : '#ff6e86'}
        strokeWidth="1.5"
      />
      <text
        x={marker.x}
        y={marker.y + 5}
        textAnchor="middle"
        fill="#f6fbff"
        fontSize="13"
        fontWeight="700"
        fontFamily="Arial, Helvetica, sans-serif"
      >
        PAVILHÃO {marker.code}
      </text>
    </g>
  );
}
export function FloorPlan({
  floor,
  rooms,
  origin,
  destination,
  mini = false,
  onSelect,
  route = false,
  onFeatureSelect,
  selectedFeature,
}) {
  const layout = campusLayouts[floor],
    list = mappedRooms(floor, rooms),
    dest = list.find((r) => r.id === destination),
    src = list.find((r) => r.id === origin),
    points = route ? localRoute(floor, rooms, origin, destination) : null;
  return (
    <svg
      className={`floor-plan campus-plan ${mini ? 'is-mini' : ''}`}
      viewBox={`0 0 1000 ${layout.height}`}
      role={onSelect ? 'group' : 'img'}
      aria-label={`Planta redesenhada do ${floor}º pavimento, com corredores, escadas${layout.ramp ? ', rampa' : ''}${layout.features.some((f) => f.kind === 'elevator') ? ' e elevador' : ''}`}
    >
      <defs>
        <pattern
          id={`campusGrid-${floor}-${mini}`}
          width="25"
          height="25"
          patternUnits="userSpaceOnUse"
        >
          <path d="M25 0H0V25" fill="none" stroke="#143046" strokeWidth=".5" />
        </pattern>
      </defs>
      <rect width="1000" height={layout.height} fill="#061322" />
      <rect width="1000" height={layout.height} fill={`url(#campusGrid-${floor}-${mini})`} />
      {layout.corridors.map((p, i) => (
        <g key={i}>
          <polyline
            points={p.map((p) => p.join(',')).join(' ')}
            fill="none"
            stroke="#315670"
            strokeWidth="41"
            strokeLinejoin="miter"
          />
          <polyline
            points={p.map((p) => p.join(',')).join(' ')}
            fill="none"
            stroke="#122b3d"
            strokeWidth="37"
            strokeLinejoin="miter"
          />
        </g>
      ))}
      {(layout.pavilions || []).map((marker) => (
        <PavilionMarker key={marker.code} marker={marker} mini={mini} />
      ))}
      <Ramp
        ramp={layout.ramp}
        mini={mini}
        selected={selectedFeature?.kind === 'ramp'}
        onSelect={
          onFeatureSelect
            ? () => onFeatureSelect({ kind: 'ramp', label: ['Rampa central'], floor })
            : undefined
        }
      />
      {layout.features.map((f, i) => (
        <Feature
          key={i}
          item={f}
          mini={mini}
          selected={selectedFeature?.key === i && selectedFeature?.kind === f.kind}
          onSelect={
            onFeatureSelect && ['stairs', 'elevator'].includes(f.kind)
              ? () => onFeatureSelect({ ...f, key: i, floor })
              : undefined
          }
        />
      ))}
      {list.map((r) => (
        <g
          key={r.id}
          className={onSelect ? 'map-room' : ''}
          role={onSelect ? 'button' : undefined}
          tabIndex={onSelect ? 0 : undefined}
          aria-label={`${r.name}, ${floor}º pavimento${r.id === destination ? ', destino selecionado' : ''}`}
          aria-pressed={onSelect ? r.id === destination : undefined}
          onClick={() => onSelect?.(r)}
          onKeyDown={(e) => {
            if (onSelect && (e.key === 'Enter' || e.key === ' ')) {
              e.preventDefault();
              onSelect(r);
            }
          }}
        >
          <title>{r.name}</title>
          <rect
            x={r.x}
            y={r.y}
            width={r.w}
            height={r.h}
            vectorEffect={r.id === destination ? 'non-scaling-stroke' : undefined}
            fill={r.id === destination ? '#371626' : r.id === origin ? '#11382f' : '#0b1e30'}
            stroke={r.id === destination ? '#ff536a' : r.id === origin ? '#4be5b8' : '#5890ad'}
            strokeWidth={r.id === destination || r.id === origin ? 3 : 1.5}
          />
          {!mini && (
            <Label
              x={r.x + r.w / 2}
              y={r.y + r.h / 2}
              lines={r.label}
              size={r.w < 80 ? 12 : 14}
              color={r.id === destination ? '#ffbec7' : '#d3e7f0'}
            />
          )}
          <circle cx={r.door[0]} cy={r.door[1]} r="4" fill="#9fcad8" />
        </g>
      ))}
      {points && (
        <polyline
          points={points.map((p) => p.join(',')).join(' ')}
          fill="none"
          stroke="#00e2ff"
          strokeWidth="5"
          strokeDasharray="9 6"
          strokeLinejoin="round"
        />
      )}
      {src && (
        <circle
          cx={src.door[0]}
          cy={src.door[1]}
          r="8"
          fill="#51e5b8"
          stroke="#072b25"
          strokeWidth="2"
        />
      )}
      {dest && (
        <g>
          <circle
            cx={dest.door[0]}
            cy={dest.door[1]}
            r="11"
            fill="#ff3048"
            stroke="#f5c7d0"
            strokeWidth="2"
          />
          <circle
            cx={dest.door[0]}
            cy={dest.door[1]}
            r="18"
            fill="none"
            stroke="#ff3048"
            opacity=".5"
          />
        </g>
      )}
      {!mini && (
        <text x="44" y={layout.height - 17} fill="#6b9ab0" fontSize="12" fontFamily="Arial">
          Redesenho das fotos enviadas · sem escala
        </text>
      )}
    </svg>
  );
}
