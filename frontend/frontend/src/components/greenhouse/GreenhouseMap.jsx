import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import L from 'leaflet';
import { getZoneRegistry } from '../../services/zonesApi';

const serif = { fontFamily: "'Playfair Display', Georgia, serif" };
const mono  = { fontFamily: "'Source Code Pro', monospace" };

const MOLDOVA_CENTER = [47.0, 28.9];
const MOLDOVA_ZOOM   = 8;
const DETAIL_ZOOM    = 14;
const OFFLINE_AFTER_MS = 60_000;

function isZoneLive(lastSeenAt) {
  if (!lastSeenAt) return false;
  return Date.now() - new Date(lastSeenAt).getTime() <= OFFLINE_AFTER_MS;
}

function makeMarkerIcon(isSelected, photoUrl) {
  if (photoUrl) {
    const imgSize  = isSelected ? 50 : 42;
    const dotSize  = 8;
    const gap      = 3;
    const totalH   = imgSize + gap + dotSize;
    const border   = isSelected ? '3px solid #374426' : '3px solid #f5f3eb';
    const dotColor = isSelected ? '#374426' : '#799851';
    return L.divIcon({
      className: '',
      html: `<div style="display:flex;flex-direction:column;align-items:center;gap:${gap}px;">
        <div style="
          width:${imgSize}px;height:${imgSize}px;
          border-radius:50%;overflow:hidden;
          border:${border};
          box-shadow:0 3px 12px rgba(0,0,0,0.28);
        "><img src="${photoUrl}" style="width:100%;height:100%;object-fit:cover;" /></div>
        <div style="
          width:${dotSize}px;height:${dotSize}px;
          border-radius:50%;
          background:${dotColor};
          border:2px solid #f5f3eb;
          box-shadow:0 1px 4px rgba(0,0,0,0.2);
        "></div>
      </div>`,
      iconSize:   [imgSize, totalH],
      iconAnchor: [imgSize / 2, totalH],
    });
  }

  const bg   = isSelected ? '#374426' : '#799851';
  const size = isSelected ? 16 : 13;
  return L.divIcon({
    className: '',
    html: `<div style="
      width:${size}px;height:${size}px;
      border-radius:50%;
      background:${bg};
      border:2.5px solid #f5f3eb;
      box-shadow:0 2px 8px rgba(0,0,0,0.3);
    "></div>`,
    iconSize:   [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

// Flies the map to the selected greenhouse or back to Moldova on deselect
function FlyToController({ target }) {
  const map = useMap();
  useEffect(() => {
    if (target) {
      map.flyTo([target.lat, target.lng], DETAIL_ZOOM, { duration: 1.2 });
    } else {
      map.flyTo(MOLDOVA_CENTER, MOLDOVA_ZOOM, { duration: 1.0 });
    }
  }, [target, map]);
  return null;
}
FlyToController.propTypes = {
  target: PropTypes.shape({ lat: PropTypes.number, lng: PropTypes.number }),
};
FlyToController.defaultProps = { target: null };

/* ── Info panel shown to the right when a marker is clicked ──────────── */
function InfoPanel({ greenhouse, photo, description, onClose, onOpen }) {
  const [zones,        setZones]        = useState(null);
  const [loadingZones, setLoadingZones] = useState(false);

  useEffect(() => {
    if (!greenhouse?.greenhouse_id) return;
    setZones(null);
    setLoadingZones(true);
    getZoneRegistry({ greenhouseId: greenhouse.greenhouse_id })
      .then((r) =>
        setZones(
          (r?.assigned_zones ?? []).map((z) => ({ ...z, is_live: isZoneLive(z.last_seen_at) }))
        )
      )
      .catch(() => setZones([]))
      .finally(() => setLoadingZones(false));
  }, [greenhouse?.greenhouse_id]);

  return (
    <div className="w-64 xl:w-72 shrink-0 bg-surface rounded-2xl overflow-hidden flex flex-col">
      {/* Photo */}
      {photo && (
        <div className="shrink-0" style={{ height: 130 }}>
          <img src={photo} alt={greenhouse.name} className="w-full h-full object-cover" />
        </div>
      )}

      <div className="flex flex-col gap-4 p-5 flex-1 overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-xl text-ink leading-snug flex-1" style={serif}>
            {greenhouse.name}
          </h3>
          <button
            onClick={onClose}
            aria-label="Close"
            className="w-7 h-7 flex items-center justify-center rounded-full text-muted hover:text-ink hover:bg-surface2 transition-colors shrink-0 text-xl leading-none"
          >
            ×
          </button>
        </div>

        {/* ID tags */}
        <div className="flex flex-wrap gap-1.5">
          <span className="text-[11px] text-muted px-2.5 py-0.5 rounded-full bg-surface2" style={mono}>
            {greenhouse.greenhouse_id}
          </span>
          {greenhouse.gateway_id && (
            <span className="text-[11px] text-accent px-2.5 py-0.5 rounded-full bg-accent/10" style={mono}>
              {greenhouse.gateway_id}
            </span>
          )}
        </div>

        {/* Description */}
        {description && (
          <p className="text-sm text-muted leading-relaxed">{description}</p>
        )}

        {/* Zones list */}
        <div className="flex-1 min-h-0">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted mb-2">Zones</p>
          {loadingZones ? (
            <p className="text-sm text-muted">Loading…</p>
          ) : zones && zones.length > 0 ? (
            <div className="flex flex-col gap-1.5">
              {zones.map((z) => (
                <div key={z.zone_id} className="flex items-center gap-2.5 bg-surface2 rounded-xl px-3 py-2">
                  <span
                    className={`w-2 h-2 rounded-full shrink-0 ${z.is_live ? 'bg-accent' : 'bg-border'}`}
                  />
                  <div className="min-w-0">
                    <p className="text-sm text-ink font-medium leading-snug truncate">
                      {z.zone_name || 'Unnamed zone'}
                    </p>
                    <p className="text-[11px] text-muted truncate" style={mono}>
                      {z.device_id}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted">No zones assigned.</p>
          )}
        </div>

        {/* Open button */}
        <button
          onClick={() => onOpen(greenhouse.greenhouse_id)}
          className="rounded-2xl bg-ink text-surface h-10 text-sm font-semibold hover:opacity-90 transition-opacity"
        >
          Open Greenhouse →
        </button>
      </div>
    </div>
  );
}

InfoPanel.propTypes = {
  greenhouse:  PropTypes.object.isRequired,
  photo:       PropTypes.string,
  description: PropTypes.string,
  onClose:     PropTypes.func.isRequired,
  onOpen:      PropTypes.func.isRequired,
};
InfoPanel.defaultProps = { photo: null, description: null };

/* ── Main map ────────────────────────────────────────────────────────── */
export default function GreenhouseMap({ greenhouses, locations, photos, descriptions, onOpen }) {
  const [selectedId, setSelectedId] = useState(null);

  const withLocation = greenhouses.filter((g) => locations[g.greenhouse_id]);

  // Hide component entirely if no greenhouse has a location set
  if (withLocation.length === 0) return null;

  const selectedGh  = selectedId ? withLocation.find((g) => g.greenhouse_id === selectedId) ?? null : null;
  const selectedLoc = selectedId ? locations[selectedId] ?? null : null;

  const handleMarkerClick = (id) => {
    setSelectedId((prev) => (prev === id ? null : id));
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 className="text-xl text-ink" style={serif}>Your Greenhouses</h2>
        {selectedGh && (
          <span className="text-xs text-muted">Click the marker again to deselect</span>
        )}
      </div>

      <div className="flex flex-col lg:flex-row gap-4 items-stretch">
        {/* Map */}
        <div className="flex-1 rounded-2xl overflow-hidden flex flex-col" style={{ minHeight: 340 }}>
          <MapContainer
            center={MOLDOVA_CENTER}
            zoom={MOLDOVA_ZOOM}
            style={{ flex: 1, minHeight: 340, width: '100%' }}
            zoomControl
          >
            <TileLayer
              url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
            />
            <FlyToController target={selectedLoc} />
            {withLocation.map((gh) => (
              <Marker
                key={gh.greenhouse_id}
                position={[locations[gh.greenhouse_id].lat, locations[gh.greenhouse_id].lng]}
                icon={makeMarkerIcon(gh.greenhouse_id === selectedId, photos[gh.greenhouse_id] ?? null)}
                eventHandlers={{ click: () => handleMarkerClick(gh.greenhouse_id) }}
              />
            ))}
          </MapContainer>
        </div>

        {/* Info panel — appears when a marker is selected */}
        {selectedGh && (
          <InfoPanel
            greenhouse={selectedGh}
            photo={photos[selectedGh.greenhouse_id] ?? null}
            description={descriptions[selectedGh.greenhouse_id] ?? null}
            onClose={() => setSelectedId(null)}
            onOpen={onOpen}
          />
        )}
      </div>
    </div>
  );
}

GreenhouseMap.propTypes = {
  greenhouses:  PropTypes.arrayOf(PropTypes.object).isRequired,
  locations:    PropTypes.object.isRequired,
  photos:       PropTypes.object.isRequired,
  descriptions: PropTypes.object.isRequired,
  onOpen:       PropTypes.func.isRequired,
};
