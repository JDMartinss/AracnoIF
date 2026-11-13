import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Plus, Navigation, Layers, ArrowUpDown, AlertCircle } from 'lucide-react';
import { Field, Panel, PageTitle } from '../components/ui';
import { useMapGestures } from '../hooks/useMapGestures';
import { floorLabels } from '../data';
import { FloorPlan } from '../campus-plan';
import { campusLayouts } from '../campus-layouts';

export function CampusMap({ rooms, initialDestination, compact = false, nextLesson }) {
  const [floor, setFloor] = useState(initialDestination?.floor || 5),
    [origin, setOrigin] = useState(''),
    [destination, setDestination] = useState(initialDestination?.id || ''),
    [route, setRoute] = useState(false),
    [original, setOriginal] = useState(false),
    [mapZoom, setMapZoom] = useState(1),
    [infrastructure, setInfrastructure] = useState(null),
    [query, setQuery] = useState('');
  const mapViewport = useRef(null);
  useMapGestures(mapViewport, mapZoom, setMapZoom, !original);
  useEffect(() => {
    setMapZoom(1);
    mapViewport.current?.scrollTo({ left: 0, top: 0 });
  }, [floor]);
  function fitMap() {
    setMapZoom(1);
    mapViewport.current?.scrollTo({ left: 0, top: 0 });
  }
  const normalized = (value) =>
    value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim()
      .toLowerCase();
  const results = query.trim()
    ? rooms.filter((room) => normalized(room.name).includes(normalized(query)))
    : [];
  const src = rooms.find((r) => r.id === Number(origin)),
    dest = rooms.find((r) => r.id === Number(destination));
  useEffect(() => {
    if (initialDestination) {
      setDestination(initialDestination.id);
      setFloor(initialDestination.floor);
      setRoute(false);
    }
  }, [initialDestination?.id]);
  function selectRoom(r) {
    setDestination(r.id);
    setFloor(r.floor);
    setRoute(false);
    setQuery('');
  }
  const steps =
    route && src && dest
      ? src.id === dest.id
        ? ['Você já selecionou o destino como origem.']
        : src.floor === dest.floor
          ? [`Parta de ${src.name}.`, 'Siga pelo corredor do pavimento.', `Localize ${dest.name}.`]
          : [
              `Parta de ${src.name}, no ${src.floor}º pavimento.`,
              'Siga até a escada do núcleo esquerdo, indicada na planta.',
              `${src.floor < dest.floor ? 'Suba' : 'Desça'} até o ${dest.floor}º pavimento.`,
              `Siga pelo corredor até ${dest.name}.`,
            ]
      : [];
  return (
    <>
      {!compact && (
        <PageTitle
          title="Mapa do campus"
          subtitle="Selecione um pavimento e encontre seu próximo destino."
        />
      )}
      <div className="map-layout">
        <div className="map-main">
          {nextLesson && (
            <div className="agenda-next">
              <div>
                <span>Próxima aula</span>
                <strong>{nextLesson.subject}</strong>
                <p>
                  {nextLesson.room.name} · {nextLesson.room.floor}º pavimento
                </p>
              </div>
              <button
                className="button primary"
                onClick={() => {
                  setOriginal(false);
                  selectRoom(nextLesson.room);
                }}
              >
                Localizar sala
              </button>
            </div>
          )}
          <div className="map-search">
            <Field label="Buscar sala no campus">
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Nome da sala ou laboratório"
                autoComplete="off"
              />
            </Field>
            {query.trim() && (
              <div className="map-search-results" aria-label="Resultados da busca">
                {results.map((r) => (
                  <button key={r.id} onClick={() => selectRoom(r)}>
                    <MapPin size={16} />
                    <span>{r.name}</span>
                    <small>{r.floor}º pavimento</small>
                  </button>
                ))}
                {!results.length && <p role="status">Nenhuma sala encontrada.</p>}
              </div>
            )}
          </div>
          {dest && (
            <p className="map-destination" role="status">
              <MapPin size={18} /> Destino: {dest.name} · {dest.floor}º pavimento
            </p>
          )}
          <div className="floor-tabs">
            {[1, 2, 3, 4, 5].map((f) => (
              <button key={f} className={floor === f ? 'selected' : ''} onClick={() => setFloor(f)}>
                {f}º<span> pavimento</span>
              </button>
            ))}
          </div>
          <div className="map-canvas">
            <div className="map-canvas-head">
              <div>
                <span className="eyebrow">{floor}º PAVIMENTO</span>
                <h2>{floorLabels[floor]}</h2>
                {campusLayouts[floor].pavilions && (
                  <div className="pavilion-key" aria-label="Identificação dos pavilhões">
                    {campusLayouts[floor].pavilions.map((pavilion) => (
                      <span key={pavilion.code} className={`pavilion-chip pavilion-${pavilion.code.toLowerCase()}`}>
                        <strong>Pavilhão {pavilion.code}</strong>
                        <small>{pavilion.position}</small>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
            {original ? (
              <img
                className="original-map"
                src={`/maps/floor-${floor}.jpg`}
                alt={`Planta original enviada do ${floor}º pavimento`}
              />
            ) : (
              <>
                <div className="map-tools">
                  <div>
                    <button
                      className="icon-button"
                      aria-label="Afastar o mapa"
                      disabled={mapZoom <= 1}
                      onClick={() =>
                        setMapZoom((z) => Math.max(1, Math.round((z - 0.5) * 100) / 100))
                      }
                    >
                      −
                    </button>
                    <button className="text-button" onClick={fitMap}>
                      Ajustar
                    </button>
                    <button
                      className="icon-button"
                      aria-label="Aproximar o mapa"
                      disabled={mapZoom >= 3}
                      onClick={() =>
                        setMapZoom((z) => Math.min(3, Math.round((z + 0.5) * 100) / 100))
                      }
                    >
                      <Plus size={18} />
                    </button>
                  </div>
                </div>
                <div
                  className="map-pan"
                  ref={mapViewport}
                  tabIndex="0"
                  aria-label="Mapa do pavimento, área com rolagem ao ampliar"
                >
                  <div
                    className="map-diagram"
                    style={{
                      width: `${mapZoom * 100}%`,
                    }}
                  >
                    <FloorPlan
                      floor={floor}
                      rooms={rooms}
                      origin={Number(origin)}
                      destination={Number(destination)}
                      route={route}
                      onSelect={selectRoom}
                      onFeatureSelect={setInfrastructure}
                      selectedFeature={infrastructure?.floor === floor ? infrastructure : null}
                    />
                  </div>
                </div>
              </>
            )}
            <details className="quiet-details">
              <summary>Legenda e foto</summary>
              <div className="map-legend">
                <span>
                  <i className="cyan" /> Percurso esquemático
                </span>
                <span>
                  <i className="red" /> Destino
                </span>
                <span>
                  <i className="map-stairs" /> Escada
                </span>
                <span>
                  <i className="map-ramp" /> Rampa
                </span>
                {campusLayouts[floor].features.some((f) => f.kind === 'elevator') && (
                  <span>
                    <i className="map-elevator" /> Elevador
                  </span>
                )}
                <button className="text-button" onClick={() => setOriginal(!original)}>
                  {original ? 'Mapa digital' : 'Foto original'} <Layers size={15} />
                </button>
              </div>
            </details>
          </div>
          <details className="quiet-details" open={infrastructure?.floor === floor}>
            <summary>Escadas, elevador e rampa</summary>
            <div className="map-warning">
              <AlertCircle size={18} />
              <p>
                <strong>Detalhes do {floor}º pavimento.</strong> {campusLayouts[floor].note}
              </p>
            </div>
            <div className="infrastructure-panel">
              <div className="infrastructure-buttons">
                {campusLayouts[floor].features.map(
                  (f, i) =>
                    ['stairs', 'elevator'].includes(f.kind) && (
                      <button
                        key={i}
                        className={
                          infrastructure?.floor === floor && infrastructure?.key === i
                            ? 'selected'
                            : ''
                        }
                        onClick={() => {
                          setOriginal(false);
                          setInfrastructure({ ...f, key: i, floor });
                        }}
                      >
                        {f.kind === 'elevator'
                          ? 'Elevador'
                          : f.x < 400
                            ? 'Escada esquerda'
                            : 'Escada direita'}
                      </button>
                    ),
                )}
                {campusLayouts[floor].ramp && (
                  <button
                    className={
                      infrastructure?.floor === floor && infrastructure?.kind === 'ramp'
                        ? 'selected'
                        : ''
                    }
                    onClick={() => {
                      setOriginal(false);
                      setInfrastructure({ kind: 'ramp', label: ['Rampa central'], floor });
                    }}
                  >
                    Rampa central
                  </button>
                )}
              </div>
              {infrastructure?.floor === floor && (
                <div className="infrastructure-detail">
                  <strong>
                    {infrastructure.kind === 'elevator'
                      ? 'Elevador'
                      : infrastructure.label.join(' ')}
                  </strong>
                  <p>
                    Identificado na foto do {floor}º pavimento.{' '}
                    {infrastructure.kind === 'elevator'
                      ? 'O elevador também está identificado nas fotos dos pavimentos 4 e 5.'
                      : infrastructure.kind === 'ramp'
                        ? 'A rampa central aparece nas fotos dos pavimentos 2 a 5.'
                        : 'As escadas aparecem nas cinco plantas.'}
                  </p>
                  <p className="muted">
                    A ligação exata entre andares e a disponibilidade de uso precisam de conferência
                    no campus.
                  </p>
                </div>
              )}
            </div>
          </details>
        </div>
        <Panel title="Rota" icon={Navigation} className="route-panel">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              setRoute(true);
              setFloor(dest.floor);
            }}
          >
            <Field label="Origem">
              <select
                required
                value={origin}
                onChange={(e) => {
                  setOrigin(e.target.value);
                  setRoute(false);
                }}
              >
                <option value="">Selecione a origem</option>
                {rooms.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name} · {r.floor}º
                  </option>
                ))}
              </select>
            </Field>
            <div className="route-divider">
              <ArrowUpDown size={16} />
            </div>
            <Field label="Destino">
              <select
                required
                value={destination}
                onChange={(e) => {
                  setDestination(e.target.value);
                  setRoute(false);
                  const r = rooms.find((r) => r.id === Number(e.target.value));
                  if (r) setFloor(r.floor);
                }}
              >
                <option value="">Selecione o destino</option>
                {rooms.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name} · {r.floor}º
                  </option>
                ))}
              </select>
            </Field>
            <button className="button primary full">
              <Navigation size={17} /> Ver rota
            </button>
          </form>
          {dest && !route && (
            <div className="selected-room">
              <MapPin size={21} />
              <div>
                <strong>{dest.name}</strong>
                <small>{dest.floor}º pavimento</small>
              </div>
            </div>
          )}
          {route && (
            <div className="route-steps">
              <h3>Orientação preliminar</h3>
              <ol>
                {steps.map((s, i) => (
                  <li key={i}>
                    <span>{i + 1}</span>
                    {s}
                  </li>
                ))}
              </ol>
              <p className="muted small-text">
                O traçado acompanha os corredores do desenho e usa a escada esquerda entre
                pavimentos. O funcionamento do elevador e as ligações das rampas precisam de
                confirmação presencial. Sem escala ou GPS.
              </p>
            </div>
          )}
        </Panel>
      </div>
    </>
  );
}
