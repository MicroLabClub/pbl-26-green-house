import { useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';

const mono = { fontFamily: "'Source Code Pro', monospace" };

const pinIcon = L.divIcon({
  className: '',
  html: `<div style="
    width:18px;height:18px;
    border-radius:50%;
    background:#47622A;
    border:3px solid #f5f3eb;
    box-shadow:0 2px 8px rgba(0,0,0,0.3);
  "></div>`,
  iconSize: [18, 18],
  iconAnchor: [9, 9],
});

function ClickHandler({ onPick }) {
  useMapEvents({ click: (e) => onPick(e.latlng.lat, e.latlng.lng) });
  return null;
}
ClickHandler.propTypes = { onPick: PropTypes.func.isRequired };

// Calls invalidateSize after mount so tiles render correctly inside animated containers
function MapResizer() {
  const map = useMapEvents({});
  useEffect(() => {
    const t = setTimeout(() => map.invalidateSize(), 350);
    return () => clearTimeout(t);
  }, [map]);
  return null;
}

// Flies to target only when it changes (search selection), not on every drag/click
function FlyTo({ target }) {
  const map     = useMap();
  const prevRef = useRef(null);
  useEffect(() => {
    if (!target) return;
    if (prevRef.current?.lat === target.lat && prevRef.current?.lng === target.lng) return;
    prevRef.current = target;
    map.flyTo([target.lat, target.lng], 14, { duration: 1.0 });
  }, [target, map]);
  return null;
}
FlyTo.propTypes = {
  target: PropTypes.shape({ lat: PropTypes.number, lng: PropTypes.number }),
};
FlyTo.defaultProps = { target: null };

export default function LocationPicker({ value, onChange }) {
  const [query,     setQuery]     = useState('');
  const [results,   setResults]   = useState([]);
  const [searching, setSearching] = useState(false);
  const [flyTarget, setFlyTarget] = useState(null);
  const debounceRef = useRef(null);

  const hasPick = value != null && value.lat != null;

  const handleQueryChange = (e) => {
    const q = e.target.value;
    setQuery(q);
    clearTimeout(debounceRef.current);

    if (!q.trim() || q.length < 3) {
      setResults([]);
      setSearching(false);
      return;
    }

    setSearching(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=5&countrycodes=md&viewbox=26.6,48.5,30.2,45.4`
        );
        setResults(await res.json());
      } catch {
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 500);
  };

  const handleSelectResult = (result) => {
    const lat = parseFloat(result.lat);
    const lng = parseFloat(result.lon);
    onChange({ lat, lng });
    setFlyTarget({ lat, lng });
    setResults([]);
    setQuery(result.display_name.split(',').slice(0, 2).join(','));
  };

  const handleMapPick = (lat, lng) => {
    onChange({ lat, lng });
    // no fly — user is already looking at that spot
  };

  const handleClear = () => {
    onChange(null);
    setQuery('');
    setResults([]);
    setFlyTarget(null);
  };

  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-xs font-semibold uppercase tracking-wider text-muted">
        Location{' '}
        <span className="normal-case tracking-normal font-normal text-muted/70">(optional)</span>
      </span>

      {/* Address search */}
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={handleQueryChange}
          placeholder="Search city or address in Moldova…"
          className="w-full h-10 rounded-xl border border-border bg-bg px-3 pr-8 text-sm text-ink outline-none focus:border-accent transition-colors"
        />
        {searching && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted animate-pulse">
            …
          </span>
        )}
      </div>

      {/* Inline results — rendered in flow so modal scroll handles overflow */}
      {results.length > 0 && (
        <div className="rounded-xl border border-border bg-surface overflow-hidden">
          {results.map((r) => (
            <button
              key={r.place_id}
              type="button"
              onClick={() => handleSelectResult(r)}
              className="w-full text-left px-3 py-2.5 text-sm text-ink hover:bg-surface2 transition-colors border-b border-border/30 last:border-0"
            >
              <span className="block truncate">{r.display_name}</span>
            </button>
          ))}
        </div>
      )}

      {/* Map */}
      <div className="rounded-xl overflow-hidden border border-border" style={{ height: 200 }}>
        <MapContainer
          center={[47.0, 28.9]}
          zoom={7}
          style={{ height: '100%', width: '100%' }}
          zoomControl={false}
          attributionControl={false}
        >
          <TileLayer url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" />
          <MapResizer />
          <FlyTo target={flyTarget} />
          <ClickHandler onPick={handleMapPick} />
          {hasPick && (
            <Marker
              position={[value.lat, value.lng]}
              icon={pinIcon}
              draggable
              eventHandlers={{
                dragend: (e) => {
                  const { lat, lng } = e.target.getLatLng();
                  onChange({ lat, lng });
                },
              }}
            />
          )}
        </MapContainer>
      </div>

      {/* Coordinates / hint */}
      {hasPick ? (
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted" style={mono}>
            {value.lat.toFixed(5)}, {value.lng.toFixed(5)}
          </span>
          <button
            type="button"
            onClick={handleClear}
            className="text-xs text-muted hover:text-crit transition-colors"
          >
            Clear
          </button>
        </div>
      ) : (
        <p className="text-xs text-muted">
          Search an address above, or click the map to pin the location.
        </p>
      )}
    </div>
  );
}

LocationPicker.propTypes = {
  value:    PropTypes.shape({ lat: PropTypes.number, lng: PropTypes.number }),
  onChange: PropTypes.func.isRequired,
};
LocationPicker.defaultProps = { value: null };
