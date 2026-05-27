import { Rnd } from 'react-rnd';
import { motion } from 'motion/react';
import { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';

const serif = { fontFamily: "'Playfair Display', Georgia, serif" };
const mono  = { fontFamily: "'Source Code Pro', monospace" };
const IC    = 'w-10 h-10';

/* ── Crop icon SVGs ────────────────────────────────────────────────────── */
const TomatoIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={IC}>
    <path d="M12 10V7M12 7C11 4 8 5 8 7M12 7C13 4 16 5 16 7" />
    <circle cx="12" cy="15" r="7" />
  </svg>
);

const CucumberIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={IC}>
    <ellipse cx="12" cy="13" rx="5" ry="9" />
    <path d="M9 10Q12 11 15 10M9 13Q12 14 15 13M9 16Q12 17 15 16" />
    <path d="M12 4Q13 2 12 1" />
  </svg>
);

const PepperIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={IC}>
    <path d="M12 5V3M12 3C14.5 2 16 4 15 5" />
    <path d="M9 5Q7 8 7 13Q8 20 12 21Q16 20 17 13Q17 8 15 5Q13 4 12 5Q11 4 9 5Z" />
    <path d="M12 10V17" />
  </svg>
);

const LettuceIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={IC}>
    <path d="M12 19Q8 15 8 11Q8 7 12 6Q16 7 16 11Q16 15 12 19Z" />
    <path d="M12 19Q5 16 5 11Q5 6 9 5" />
    <path d="M12 19Q19 16 19 11Q19 6 15 5" />
  </svg>
);

const StrawberryIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={IC}>
    <path d="M12 20Q7 15 7 10A5 5 0 0 1 17 10Q17 15 12 20Z" />
    <path d="M9 6Q10 4 12 5Q14 4 15 6Q13 8 12 7Q11 8 9 6Z" />
    <circle cx="10" cy="12" r="0.7" fill="currentColor" />
    <circle cx="14" cy="12" r="0.7" fill="currentColor" />
    <circle cx="12" cy="15" r="0.7" fill="currentColor" />
  </svg>
);

const CarrotIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={IC}>
    <path d="M12 4Q9 10 9 16Q10 20 12 21Q14 20 15 16Q15 10 12 4Z" />
    <path d="M12 4L10 1M12 4L12 1M12 4L14 1" />
  </svg>
);

const HerbIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={IC}>
    <path d="M12 21V12" />
    <ellipse cx="12" cy="8" rx="4" ry="6" />
    <path d="M12 15Q7 13 6 8M12 14Q17 12 18 7" />
  </svg>
);

const PotatoIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={IC}>
    <path d="M8 8Q5 10 5 14Q6 19 12 20Q18 19 19 14Q19 10 16 8Q14 6 12 6Q10 6 8 8Z" />
    <circle cx="9"  cy="12" r="1"   />
    <circle cx="15" cy="15" r="0.8" />
  </svg>
);

const CornIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={IC}>
    <path d="M10 20Q9 14 9 10Q10 5 12 4Q14 5 15 10Q15 14 14 20Q13 22 12 22Q11 22 10 20Z" />
    <path d="M9 7Q6 6 5 9M15 7Q18 6 19 9" />
    <path d="M9 12Q6 12 5 15M15 12Q18 12 19 15" />
    <path d="M10 4Q10 1 12 1Q14 1 14 4" />
  </svg>
);

const OnionIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={IC}>
    <path d="M12 8Q7 9 7 14Q8 20 12 21Q16 20 17 14Q17 9 12 8Z" />
    <path d="M12 8V3" />
    <path d="M10 5Q10 3 12 3Q14 3 14 5" />
  </svg>
);

const BeanIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={IC}>
    <path d="M8 5Q6 8 7 13Q9 19 13 20Q17 19 17 14Q16 9 13 7Q10 5 8 5Z" />
    <path d="M8 5Q12 3 15 5" />
    <path d="M10 10Q12 9 14 11M10 15Q12 14 14 16" />
  </svg>
);

const ZucchiniIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={IC}>
    <path d="M6 7Q4 10 6 14Q9 20 14 20Q18 19 19 15Q19 11 16 8Q12 4 8 5Q6 5 6 7Z" />
    <path d="M6 7Q8 4 10 5" />
    <path d="M9 9Q12 8 14 10M10 14Q13 13 15 15" />
  </svg>
);

const EggplantIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={IC}>
    <path d="M12 7Q8 8 7 13Q7 19 12 21Q17 19 17 13Q16 8 12 7Z" />
    <path d="M12 7V3" />
    <path d="M10 5Q10 3 12 3Q14 3 14 5" />
  </svg>
);

const SpinachIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={IC}>
    <path d="M12 21V12" />
    <path d="M12 16Q7 14 6 9Q9 8 12 11" />
    <path d="M12 13Q17 11 18 6Q15 5 12 8" />
    <path d="M12 10Q7 8 6 3Q9 2 12 5" />
  </svg>
);

const GrapeIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={IC}>
    <path d="M12 6V3M12 3Q15 2 16 4" />
    <circle cx="10" cy="9"  r="2.5" />
    <circle cx="14" cy="9"  r="2.5" />
    <circle cx="8"  cy="14" r="2.5" />
    <circle cx="12" cy="14" r="2.5" />
    <circle cx="16" cy="14" r="2.5" />
    <circle cx="10" cy="19" r="2.5" />
    <circle cx="14" cy="19" r="2.5" />
  </svg>
);

const PlantIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={IC}>
    <path d="M12 21V10" />
    <path d="M12 16Q7 14 6 9Q9 8 12 11" />
    <path d="M12 12Q17 10 18 5Q15 4 12 7" />
  </svg>
);

const ICON_MAP = {
  tomato: TomatoIcon, cucumber: CucumberIcon, pepper: PepperIcon,
  lettuce: LettuceIcon, strawberry: StrawberryIcon, carrot: CarrotIcon,
  herb: HerbIcon, potato: PotatoIcon, corn: CornIcon, onion: OnionIcon,
  bean: BeanIcon, zucchini: ZucchiniIcon, eggplant: EggplantIcon,
  spinach: SpinachIcon, grape: GrapeIcon, plant: PlantIcon,
};

const CROP_RULES = [
  { match: ['tomato','tomatoes','rosii','roșii','tomate','pomidor'],             icon: 'tomato' },
  { match: ['cucumber','cucumbers','castravete','castraveti','castraveți'],       icon: 'cucumber' },
  { match: ['pepper','peppers','ardei','capsicum','bell pepper'],                 icon: 'pepper' },
  { match: ['lettuce','salata','salată'],                                         icon: 'lettuce' },
  { match: ['strawberry','strawberries','capsuna','căpșună','capsuni','căpșuni'], icon: 'strawberry' },
  { match: ['carrot','carrots','morcov','morcovi'],                               icon: 'carrot' },
  { match: ['basil','busuioc'],                                                   icon: 'herb' },
  { match: ['potato','potatoes','cartof','cartofi'],                              icon: 'potato' },
  { match: ['corn','porumb','maize','mais'],                                      icon: 'corn' },
  { match: ['onion','onions','ceapa','ceapă'],                                    icon: 'onion' },
  { match: ['bean','beans','fasole'],                                             icon: 'bean' },
  { match: ['zucchini','courgette','dovlecel'],                                   icon: 'zucchini' },
  { match: ['eggplant','aubergine','vanata','vânătă'],                            icon: 'eggplant' },
  { match: ['spinach','spanac'],                                                  icon: 'spinach' },
  { match: ['grape','grapes','strugure','struguri'],                              icon: 'grape' },
];

function detectCrop(name) {
  if (!name) return 'plant';
  const lower = name.toLowerCase();
  for (const { match, icon } of CROP_RULES) {
    if (match.some(k => lower.includes(k))) return icon;
  }
  return 'plant';
}

const LIVE_MS = 45_000;
function isLive(lastSeenAt) {
  return !!lastSeenAt && Date.now() - new Date(lastSeenAt).getTime() < LIVE_MS;
}

function gridCols(n) {
  if (n <= 1) return 1;
  if (n <= 4) return 2;
  if (n <= 9) return 3;
  return 4;
}

function defaultPosFor(index, cell = 180, gap = 20, perRow = 3) {
  const col = index % perRow;
  const row = Math.floor(index / perRow);
  return { x: col * (cell + gap), y: row * (cell + gap), w: cell, h: cell };
}

function loadLayouts(zones, key) {
  let saved = {};
  try {
    const raw = JSON.parse(localStorage.getItem(key) || '{}');
    if (raw && !Array.isArray(raw) && typeof raw === 'object') saved = raw;
  } catch {}
  const result = {};
  zones.forEach((z, i) => {
    result[z.zone_id] = saved[z.zone_id] ?? defaultPosFor(i);
  });
  return result;
}

function saveLayouts(key, layouts) {
  try { localStorage.setItem(key, JSON.stringify(layouts)); } catch {}
}

/* ── Compass SVG ────────────────────────────────────────────────────────── */
const Compass = () => (
  <div className="flex flex-col items-center gap-0.5 text-muted" style={mono}>
    <svg className="w-5 h-5 text-accent" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2l2 7h-4l2-7z" />
      <path d="M12 22l-2-7h4l-2 7z" opacity="0.3" />
      <path d="M2 12l7-2v4L2 12z" opacity="0.3" />
      <path d="M22 12l-7 2v-4l7 2z" opacity="0.3" />
      <circle cx="12" cy="12" r="2" />
    </svg>
    <span className="text-[9px] tracking-[0.15em] font-semibold">N</span>
  </div>
);

/* ── Entrance label ─────────────────────────────────────────────────────── */
const Entrance = ({ maxW }) => (
  <div className={`flex items-center justify-center gap-2 mt-2.5 text-muted w-full ${maxW}`}>
    <div className="h-px w-8 bg-accent/30" />
    <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 9l-7 7-7-7" />
    </svg>
    <span className="text-[9px] tracking-widest uppercase" style={mono}>Entrance</span>
    <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 9l-7 7-7-7" />
    </svg>
    <div className="h-px w-8 bg-accent/30" />
  </div>
);

/* ── Zone tile shared content ───────────────────────────────────────────── */
function ZoneTileContent({ zone }) {
  const Icon = ICON_MAP[detectCrop(zone.zone_name)] ?? PlantIcon;
  const live = isLive(zone.last_seen_at);
  return (
    <>
      <span
        className={`absolute top-2 right-2 w-2 h-2 rounded-full ${live ? 'bg-accent' : 'bg-border'}`}
        title={live ? 'Live' : 'Offline'}
      />
      <div className="w-14 h-14 rounded-xl bg-accent/10 flex items-center justify-center text-accent shrink-0">
        <Icon />
      </div>
      <p className="text-xs font-semibold text-ink leading-snug px-1 line-clamp-2 w-full">
        {zone.zone_name || zone.zone_id}
      </p>
      {zone.device_id && (
        <p className="text-[9px] text-muted truncate w-full leading-none" style={mono}>
          {zone.device_id}
        </p>
      )}
    </>
  );
}

ZoneTileContent.propTypes = {
  zone: PropTypes.shape({
    zone_id:      PropTypes.string.isRequired,
    zone_name:    PropTypes.string,
    device_id:    PropTypes.string,
    last_seen_at: PropTypes.string,
  }).isRequired,
};

/* ── Main component ─────────────────────────────────────────────────────── */
export default function ZoneLayers({ zones, onSelectZone, greenhouseId }) {
  const MODE_KEY    = `gms-zone-layout-mode-${greenhouseId}`;
  const STORAGE_KEY = `gms-zone-layout-${greenhouseId}`;

  const [layoutMode, setLayoutMode] = useState(() => {
    try {
      const v = localStorage.getItem(MODE_KEY);
      return v === 'default' || v === 'custom' ? v : null;
    } catch { return null; }
  });

  const [layouts, setLayouts] = useState(() => loadLayouts(zones, STORAGE_KEY));
  const draggingRef = useRef(false);

  useEffect(() => { setLayouts(loadLayouts(zones, STORAGE_KEY)); }, [zones, STORAGE_KEY]);

  if (zones.length === 0) return null;

  const chooseMode = (mode) => {
    try { localStorage.setItem(MODE_KEY, mode); } catch {}
    setLayoutMode(mode);
  };

  const updateLayout = (id, patch) => {
    setLayouts(prev => {
      const next = { ...prev, [id]: { ...prev[id], ...patch } };
      saveLayouts(STORAGE_KEY, next);
      return next;
    });
  };

  const resetLayout = () => {
    try { localStorage.removeItem(STORAGE_KEY); } catch {}
    setLayouts(loadLayouts(zones, STORAGE_KEY));
  };

  /* ── Layout picker (first visit) ──────────────────────────────────────── */
  if (layoutMode === null) {
    return (
      <div className="flex flex-col items-center px-5 sm:px-7 pt-6 pb-8">
        <div className="flex flex-col items-center gap-6 w-full max-w-2xl py-10">
          <div className="text-center">
            <h2 className="text-2xl text-ink leading-none" style={serif}>Greenhouse Layout</h2>
            <p className="text-sm text-muted mt-2">How would you like to arrange your zones?</p>
            <p className="text-xs text-muted mt-0.5">You can change this anytime from the layout controls.</p>
          </div>

          <div className="flex gap-4 w-full max-w-lg">
            {/* Default grid option */}
            <button
              onClick={() => chooseMode('default')}
              className="flex-1 flex flex-col items-center gap-3 p-6 rounded-xl border-2 border-accent/30 bg-accent/[0.07] hover:border-accent hover:bg-accent/[0.14] transition-colors text-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              <div className="grid grid-cols-2 gap-1.5 w-14 h-14">
                {[0, 1, 2, 3].map(n => (
                  <div key={n} className="rounded-md bg-accent/40" />
                ))}
              </div>
              <span className="text-sm font-semibold text-ink">Default Grid</span>
              <span className="text-xs text-muted leading-snug">Auto-arranged, clean and simple</span>
            </button>

            {/* Custom layout option */}
            <button
              onClick={() => chooseMode('custom')}
              className="flex-1 flex flex-col items-center gap-3 p-6 rounded-xl border-2 border-accent/30 bg-accent/[0.07] hover:border-accent hover:bg-accent/[0.14] transition-colors text-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              <svg className="w-14 h-14 text-accent" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="5" y="5" width="14" height="14" rx="1.5" strokeDasharray="3 2" />
                <rect x="2.5" y="2.5" width="3.5" height="3.5" rx="0.75" fill="currentColor" stroke="none" />
                <rect x="18" y="2.5" width="3.5" height="3.5" rx="0.75" fill="currentColor" stroke="none" />
                <rect x="2.5" y="18" width="3.5" height="3.5" rx="0.75" fill="currentColor" stroke="none" />
                <rect x="18" y="18" width="3.5" height="3.5" rx="0.75" fill="currentColor" stroke="none" />
              </svg>
              <span className="text-sm font-semibold text-ink">Custom Layout</span>
              <span className="text-xs text-muted leading-snug">Drag &amp; resize to match your greenhouse</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ── Shared header ────────────────────────────────────────────────────── */
  const header = (
    <div className="flex items-end justify-between mb-4 w-full max-w-2xl">
      <div>
        <h2 className="text-2xl text-ink leading-none" style={serif}>Greenhouse Layout</h2>
        <p className="text-sm text-muted mt-1">
          {layoutMode === 'default'
            ? 'Click a zone to view its sensor readings.'
            : 'Drag to reposition · drag bottom-right corner to resize · click to view readings.'}
        </p>
      </div>
      <div className="flex items-center gap-2 shrink-0 ml-4">
        <button
          onClick={() => chooseMode(layoutMode === 'default' ? 'custom' : 'default')}
          className="text-xs text-muted hover:text-ink border border-border rounded-full px-3 py-1 transition-colors whitespace-nowrap"
        >
          {layoutMode === 'default' ? 'Custom layout' : 'Default grid'}
        </button>
        {layoutMode === 'custom' && (
          <button
            onClick={resetLayout}
            className="text-xs text-muted hover:text-ink transition-colors whitespace-nowrap"
          >
            Reset positions
          </button>
        )}
        <Compass />
      </div>
    </div>
  );

  /* ── Default grid mode ────────────────────────────────────────────────── */
  if (layoutMode === 'default') {
    const cols = gridCols(zones.length);
    return (
      <div className="flex flex-col items-center px-5 sm:px-7 pt-6 pb-8">
        {header}
        <div className="relative rounded-xl border-2 border-accent/40 w-full max-w-2xl">

          {/* Grid background */}
          <div
            className="absolute inset-0 rounded-xl overflow-hidden pointer-events-none"
            style={{
              backgroundImage:
                'linear-gradient(rgba(120,120,120,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(120,120,120,0.08) 1px, transparent 1px)',
              backgroundSize: '36px 36px',
            }}
          />

          {/* Corner marks */}
          <svg className="absolute top-0 left-0 w-6 h-6 text-accent" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="square">
            <path d="M6 2H2v4" />
          </svg>
          <svg className="absolute top-0 right-0 w-6 h-6 text-accent" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="square">
            <path d="M18 2h4v4" />
          </svg>
          <svg className="absolute bottom-0 left-0 w-6 h-6 text-accent" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="square">
            <path d="M6 22H2v-4" />
          </svg>
          <svg className="absolute bottom-0 right-0 w-6 h-6 text-accent" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="square">
            <path d="M18 22h4v-4" />
          </svg>

          <div
            className="relative grid gap-2 p-4"
            style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
          >
            {zones.map((zone, i) => (
              <motion.button
                key={zone.zone_id}
                type="button"
                onClick={() => onSelectZone(zone.zone_id)}
                className="relative flex flex-col items-center justify-center gap-2 p-3 rounded-xl border-2 border-dashed border-accent/40 bg-accent/[0.14] hover:bg-accent/[0.22] hover:border-accent/70 cursor-pointer text-center aspect-square focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent transition-colors"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                transition={{ duration: 0.15, ease: 'easeOut' }}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1, transition: { delay: i * 0.06, duration: 0.2 } }}
              >
                <ZoneTileContent zone={zone} />
              </motion.button>
            ))}
          </div>
        </div>
        <Entrance maxW="max-w-2xl" />
      </div>
    );
  }

  /* ── Custom (Rnd canvas) mode ─────────────────────────────────────────── */
  return (
    <div className="flex flex-col items-center px-5 sm:px-7 pt-6 pb-8">
      {header}

      <div className="relative w-full max-w-2xl aspect-square rounded-xl border-2 border-accent/40">

        {/* Grid background */}
        <div
          className="absolute inset-0 rounded-xl overflow-hidden pointer-events-none"
          style={{
            backgroundImage:
              'linear-gradient(rgba(120,120,120,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(120,120,120,0.08) 1px, transparent 1px)',
            backgroundSize: '36px 36px',
          }}
        />

        {/* Corner marks */}
        <svg className="absolute top-0 left-0 w-6 h-6 text-accent" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="square">
          <path d="M6 2H2v4" />
        </svg>
        <svg className="absolute top-0 right-0 w-6 h-6 text-accent" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="square">
          <path d="M18 2h4v4" />
        </svg>
        <svg className="absolute bottom-0 left-0 w-6 h-6 text-accent" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="square">
          <path d="M6 22H2v-4" />
        </svg>
        <svg className="absolute bottom-0 right-0 w-6 h-6 text-accent" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="square">
          <path d="M18 22h4v-4" />
        </svg>

        {/* Zone tiles */}
        {zones.map((zone, i) => {
          const layout = layouts[zone.zone_id] ?? defaultPosFor(i);
          return (
            <Rnd
              key={zone.zone_id}
              position={{ x: layout.x, y: layout.y }}
              size={{ width: layout.w, height: layout.h }}
              minWidth={140}
              minHeight={140}
              bounds="parent"
              dragGrid={[20, 20]}
              resizeGrid={[20, 20]}
              enableResizing={{
                bottomRight: true, bottom: true, right: true,
                top: false, left: false, topRight: false,
                bottomLeft: false, topLeft: false,
              }}
              onDragStart={() => { draggingRef.current = false; }}
              onDrag={() => { draggingRef.current = true; }}
              onDragStop={(_, d) => {
                if (draggingRef.current) updateLayout(zone.zone_id, { x: d.x, y: d.y });
                setTimeout(() => { draggingRef.current = false; }, 0);
              }}
              onResizeStop={(_, __, ref, ___, pos) => {
                updateLayout(zone.zone_id, {
                  w: parseInt(ref.style.width, 10),
                  h: parseInt(ref.style.height, 10),
                  x: pos.x, y: pos.y,
                });
              }}
              className="rounded-lg border-2 border-dashed border-accent/40 bg-accent/[0.14] hover:bg-accent/[0.22] hover:border-accent/70 transition-colors"
              style={{ cursor: 'grab' }}
            >
              <button
                type="button"
                onClick={() => { if (!draggingRef.current) onSelectZone(zone.zone_id); }}
                className="relative flex flex-col items-center justify-center gap-2 p-3 w-full h-full rounded-lg text-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent select-none"
                style={{ cursor: 'inherit' }}
              >
                <ZoneTileContent zone={zone} />
              </button>
            </Rnd>
          );
        })}
      </div>

      <Entrance maxW="max-w-2xl" />
    </div>
  );
}

ZoneLayers.propTypes = {
  zones: PropTypes.arrayOf(PropTypes.shape({
    zone_id:      PropTypes.string.isRequired,
    zone_name:    PropTypes.string,
    device_id:    PropTypes.string,
    last_seen_at: PropTypes.string,
  })).isRequired,
  onSelectZone:  PropTypes.func.isRequired,
  greenhouseId:  PropTypes.string,
};

ZoneLayers.defaultProps = { greenhouseId: '' };
