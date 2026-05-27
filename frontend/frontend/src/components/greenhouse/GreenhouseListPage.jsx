import { AnimatePresence, motion } from 'motion/react';
import PropTypes from 'prop-types';
import { useCallback, useEffect, useState } from 'react';
import {
  createGreenhouse,
  deleteGreenhouse,
  getGreenhouseGatewayConfig,
  listGreenhouses,
  updateGreenhouse,
  uploadGreenhousePhoto,
} from '../../services/greenhouseApi';
import { API_BASE_URL } from '../../config/runtimeConfig';
import GreenhouseMap from './GreenhouseMap';
import LocationPicker from './LocationPicker';


const serif = { fontFamily: "'Playfair Display', Georgia, serif" };
const mono  = { fontFamily: "'Source Code Pro', monospace" };

function buildEnvText(config) {
  if (!config?.env || typeof config.env !== 'object') return '';
  return Object.entries(config.env).map(([k, v]) => `${k}=${v}`).join('\n');
}

/* ── Icons ──────────────────────────────────────────────────────────────── */
function PencilIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
      <polyline points="3 6 5 6 21 6"/>
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
      <path d="M10 11v6"/><path d="M14 11v6"/>
      <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
    </svg>
  );
}

function PlayIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
      <polygon points="5 3 19 12 5 21 5 3"/>
    </svg>
  );
}

function GearIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
      <circle cx="12" cy="12" r="3"/>
      <path d="M19.07 4.93l-1.41 1.41M5.34 18.66l-1.41 1.41M12 2v2M12 20v2M4.93 4.93l1.41 1.41M18.66 18.66l1.41 1.41M2 12h2M20 12h2"/>
    </svg>
  );
}

/* ── Add Greenhouse bottom-sheet modal ──────────────────────────────────── */
function AddGreenhouseModal({ isOpen, onClose, onSubmit, pending }) {
  const [name,         setName]         = useState('');
  const [greenhouseId, setGreenhouseId] = useState('');
  const [gatewayId,    setGatewayId]    = useState('');
  const [location,    setLocation]    = useState(null);
  const [photoFile,   setPhotoFile]   = useState(null);
  const [previewUrl,  setPreviewUrl]  = useState(null);
  const [description, setDescription] = useState('');

  const handlePhotoChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setPreviewUrl(ev.target.result);
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    await onSubmit({
      name:         name.trim(),
      greenhouseId: greenhouseId.trim() || undefined,
      gatewayId:    gatewayId.trim()    || undefined,
      location,
      photoFile,
      description:  description.trim() || undefined,
    });
    setName('');
    setGreenhouseId('');
    setGatewayId('');
    setLocation(null);
    setPhotoFile(null);
    setPreviewUrl(null);
    setDescription('');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            key="backdrop"
            className="fixed inset-0 z-40 bg-black/30"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            key="sheet"
            className="fixed bottom-0 left-0 right-0 z-50 bg-surface rounded-t-3xl px-6 pt-4 pb-10 sm:max-w-md sm:mx-auto overflow-y-auto max-h-[92vh]"
            style={{ boxShadow: '0 -8px 40px rgba(55,68,38,0.15)' }}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 260 }}
          >
            {/* drag handle */}
            <div className="w-10 h-1 bg-border rounded-full mx-auto mb-5" />

            <h2 className="text-2xl text-ink mb-0.5" style={serif}>New Greenhouse</h2>
            <p className="text-sm text-muted mb-6">Add a greenhouse to your organisation</p>

            <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted">Name *</span>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. North Wing"
                  required
                  autoFocus
                  className="h-12 rounded-xl border border-border bg-bg px-4 text-sm text-ink outline-none focus:border-accent transition-colors"
                />
              </label>

              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted">
                  Description{' '}
                  <span className="normal-case tracking-normal font-normal text-muted/70">(optional)</span>
                </span>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. Tomatoes and peppers, south-facing, automated irrigation"
                  rows={3}
                  className="rounded-xl border border-border bg-bg px-4 py-3 text-sm text-ink outline-none focus:border-accent transition-colors resize-none"
                />
              </label>

              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted">
                  Greenhouse ID{' '}
                  <span className="normal-case tracking-normal font-normal text-muted/70">(optional)</span>
                </span>
                <input
                  type="text"
                  value={greenhouseId}
                  onChange={(e) => setGreenhouseId(e.target.value)}
                  placeholder="e.g. north-wing"
                  className="h-12 rounded-xl border border-border bg-bg px-4 text-sm text-ink outline-none focus:border-accent transition-colors"
                  style={mono}
                />
              </label>

              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted">
                  Gateway ID{' '}
                  <span className="normal-case tracking-normal font-normal text-muted/70">(optional)</span>
                </span>
                <input
                  type="text"
                  value={gatewayId}
                  onChange={(e) => setGatewayId(e.target.value)}
                  placeholder="e.g. gw-001"
                  className="h-12 rounded-xl border border-border bg-bg px-4 text-sm text-ink outline-none focus:border-accent transition-colors"
                  style={mono}
                />
              </label>

              {/* Photo upload */}
              <div className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted">
                  Photo{' '}
                  <span className="normal-case tracking-normal font-normal text-muted/70">(optional)</span>
                </span>
                {previewUrl ? (
                  <div className="relative rounded-xl overflow-hidden border border-border" style={{ height: 140 }}>
                    <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => { setPhotoFile(null); setPreviewUrl(null); }}
                      className="absolute top-2 right-2 w-7 h-7 rounded-full bg-ink/70 text-surface text-base flex items-center justify-center hover:bg-ink transition-colors leading-none"
                    >
                      ×
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center gap-1 h-24 rounded-xl border border-border border-dashed bg-bg text-muted text-sm cursor-pointer hover:border-accent hover:text-ink transition-colors">
                    <span className="text-xl leading-none">↑</span>
                    <span>Click to upload photo</span>
                    <input type="file" accept="image/*" className="sr-only" onChange={handlePhotoChange} />
                  </label>
                )}
              </div>

              {/* Location picker */}
              <LocationPicker value={location} onChange={setLocation} />

              <button
                type="submit"
                disabled={pending || !name.trim()}
                className="mt-1 h-12 rounded-2xl bg-ink text-surface text-sm font-semibold hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {pending ? 'Creating…' : 'Add Greenhouse'}
              </button>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

AddGreenhouseModal.propTypes = {
  isOpen:   PropTypes.bool.isRequired,
  onClose:  PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  pending:  PropTypes.bool.isRequired,
};

/* ── Single greenhouse card ─────────────────────────────────────────────── */
function GreenhouseCard({ greenhouse, photo, description, onOpen, onDelete, onRename, pending, showConfig, onToggleConfig, config, onCopyConfig }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft]     = useState('');

  const startEdit = () => { setDraft(greenhouse.name); setEditing(true); };

  const handleRenameSubmit = async (e) => {
    e.preventDefault();
    const trimmed = draft.trim();
    if (!trimmed || trimmed === greenhouse.name) { setEditing(false); return; }
    await onRename(trimmed);
    setEditing(false);
  };

  return (
    <article className="bg-surface2 rounded-2xl overflow-hidden flex">
      {photo && (
        <div className="w-40 shrink-0 self-stretch overflow-hidden">
          <img src={photo} alt={greenhouse.name} className="w-full h-full object-cover" />
        </div>
      )}
      <div className="p-5 flex-1 min-w-0">
      {/* Name + icon actions */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          {editing ? (
            <form onSubmit={handleRenameSubmit} className="flex items-center gap-2">
              <input
                autoFocus
                type="text"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                className="flex-1 h-9 rounded-lg border border-border bg-surface px-3 text-base text-ink outline-none focus:border-accent transition-colors"
                style={serif}
              />
              <button type="submit" className="h-9 px-3 rounded-lg bg-ink text-surface text-sm font-medium whitespace-nowrap hover:opacity-85 transition-opacity">
                Save
              </button>
              <button type="button" onClick={() => setEditing(false)} className="h-9 px-2 rounded-lg border border-border text-sm text-muted hover:bg-surface transition-colors">
                ✕
              </button>
            </form>
          ) : (
            <h3 className="text-xl text-ink leading-snug" style={serif}>{greenhouse.name}</h3>
          )}
        </div>

        {!editing && (
          <div className="flex items-center gap-0.5 shrink-0 -mt-0.5">
            <button
              onClick={startEdit}
              title="Rename"
              className="w-8 h-8 flex items-center justify-center rounded-full text-muted hover:text-ink hover:bg-surface/70 transition-colors"
            >
              <PencilIcon />
            </button>
            <button
              onClick={() => onDelete(greenhouse)}
              disabled={pending}
              title="Delete"
              className="w-8 h-8 flex items-center justify-center rounded-full text-muted hover:text-crit hover:bg-crit/10 transition-colors disabled:opacity-40"
            >
              <TrashIcon />
            </button>
          </div>
        )}
      </div>

      {/* Tags */}
      <div className="flex flex-wrap items-center gap-2 mt-2.5">
        {greenhouse.gateway_id && (
          <span className="bg-accent/20 text-accent text-[11px] px-2.5 py-0.5 rounded-full" style={mono}>
            {greenhouse.gateway_id}
          </span>
        )}
        <span className="text-[11px] text-muted" style={mono}>{greenhouse.greenhouse_id}</span>
      </div>

      {/* Description */}
      {description && (
        <p className="text-sm text-muted mt-2 leading-relaxed">{description}</p>
      )}

      {/* Gateway config expand */}
      {showConfig && (
        <div className="mt-4 rounded-xl border border-border/60 bg-surface px-4 py-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted">Gateway Config</span>
            <button onClick={onCopyConfig} className="text-xs text-accent hover:text-soil transition-colors font-medium">Copy</button>
          </div>
          <pre className="whitespace-pre-wrap break-all text-[11px] text-accent" style={mono}>
            {buildEnvText(config) || 'Loading…'}
          </pre>
        </div>
      )}

      {/* Footer */}
      <div className="mt-4 pt-3 border-t border-border/40 flex items-center justify-between">
        <button
          onClick={() => onToggleConfig(greenhouse.greenhouse_id)}
          className="flex items-center gap-1.5 text-sm text-muted hover:text-ink transition-colors"
        >
          <GearIcon />
          {showConfig ? 'Hide config' : 'Gateway config'}
        </button>

        <button
          onClick={() => onOpen(greenhouse.greenhouse_id)}
          className="flex items-center gap-1.5 text-sm text-accent hover:text-soil font-semibold transition-colors"
        >
          <PlayIcon />
          Open
        </button>
      </div>
      </div>
    </article>
  );
}

GreenhouseCard.propTypes = {
  greenhouse:     PropTypes.object.isRequired,
  photo:          PropTypes.string,
  description:    PropTypes.string,
  onOpen:         PropTypes.func.isRequired,
  onDelete:       PropTypes.func.isRequired,
  onRename:       PropTypes.func.isRequired,
  pending:        PropTypes.bool.isRequired,
  showConfig:     PropTypes.bool.isRequired,
  onToggleConfig: PropTypes.func.isRequired,
  config:         PropTypes.object,
  onCopyConfig:   PropTypes.func.isRequired,
};
GreenhouseCard.defaultProps = { config: null, photo: null, description: null };

/* ── Page ───────────────────────────────────────────────────────────────── */
export default function GreenhouseListPage({ profile, onLogout, onOpenGreenhouse }) {
  const [items,               setItems]               = useState([]);
  const [loading,             setLoading]             = useState(true);
  const [pending,             setPending]             = useState(false);
  const [error,               setError]               = useState('');
  const [message,             setMessage]             = useState('');
  const [modalOpen,           setModalOpen]           = useState(false);
  const [expandedConfigFor,   setExpandedConfigFor]   = useState('');
  const [configByGreenhouse,  setConfigByGreenhouse]  = useState({});

  // All three maps derived from the API response — no localStorage hooks needed
  const locations = Object.fromEntries(
    items
      .filter((g) => g.latitude != null && g.longitude != null)
      .map((g) => [g.greenhouse_id, { lat: g.latitude, lng: g.longitude }])
  );
  const photos = Object.fromEntries(
    items
      .filter((g) => g.photo_url)
      .map((g) => [g.greenhouse_id, `${API_BASE_URL}${g.photo_url}`])
  );
  const descriptions = Object.fromEntries(
    items
      .filter((g) => g.description)
      .map((g) => [g.greenhouse_id, g.description])
  );

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const next = await listGreenhouses();
      setItems(Array.isArray(next) ? next : []);
      setError('');
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void refresh(); }, [refresh]);

  useEffect(() => {
    if (!message) return;
    const t = setTimeout(() => setMessage(''), 4000);
    return () => clearTimeout(t);
  }, [message]);

  const runAction = useCallback(async (fn) => {
    setPending(true);
    setError('');
    setMessage('');
    try {
      await fn();
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      throw e;
    } finally {
      setPending(false);
    }
  }, [refresh]);

  const handleCreate = async ({ name, greenhouseId, gatewayId, location, photoFile, description }) => {
    await runAction(async () => {
      const created = await createGreenhouse({
        name,
        greenhouseId,
        gatewayId,
        latitude:    location?.lat  ?? undefined,
        longitude:   location?.lng  ?? undefined,
        description: description    || undefined,
      });
      const id = created?.greenhouse_id || greenhouseId;
      if (id && photoFile) {
        await uploadGreenhousePhoto({ greenhouseId: id, file: photoFile });
      }
      setModalOpen(false);
      setMessage(`Greenhouse "${created?.name || name}" created.`);
    });
  };

  const handleRename = async (greenhouse, newName) => {
    await runAction(async () => {
      await updateGreenhouse({ greenhouseId: greenhouse.greenhouse_id, name: newName });
      setMessage(`Renamed to "${newName}".`);
    });
  };

  const handleDelete = async (greenhouse) => {
    const confirmed = window.confirm(
      `Delete "${greenhouse.name}"? This permanently removes its zone, telemetry and alert records.`
    );
    if (!confirmed) return;
    await runAction(async () => {
      await deleteGreenhouse({ greenhouseId: greenhouse.greenhouse_id });
      if (expandedConfigFor === greenhouse.greenhouse_id) setExpandedConfigFor('');
      setMessage(`Deleted "${greenhouse.name}".`);
    });
  };

  const handleToggleConfig = async (greenhouseId) => {
    if (expandedConfigFor === greenhouseId) { setExpandedConfigFor(''); return; }
    setExpandedConfigFor(greenhouseId);
    if (configByGreenhouse[greenhouseId]) return;
    try {
      const config = await getGreenhouseGatewayConfig({ greenhouseId });
      setConfigByGreenhouse((c) => ({ ...c, [greenhouseId]: config }));
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  };

  const copyConfig = async (greenhouseId) => {
    const text = buildEnvText(configByGreenhouse[greenhouseId]);
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setMessage('Gateway config copied to clipboard.');
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  };

  const hasAnyLocation = items.some((g) => g.latitude != null && g.longitude != null);

  return (
    <div className="min-h-screen bg-bg">

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <header className="px-5 pt-10 pb-2 max-w-5xl mx-auto">
        <div className="flex items-center justify-between">
          <h1 className="text-4xl text-ink leading-tight" style={serif}>Greenhouses</h1>
          <button
            onClick={onLogout}
            disabled={pending}
            className="rounded-full bg-surface2 border border-border px-4 py-2 text-sm text-muted hover:bg-crit/10 hover:text-crit transition-colors disabled:opacity-40"
          >
            Logout
          </button>
        </div>
        {profile && (
          <p className="text-sm text-muted mt-1" style={mono}>
            {profile.tenant_id} · {profile.role}
          </p>
        )}
      </header>

      {/* ── Map section ─────────────────────────────────────────────────── */}
      {hasAnyLocation && (
        <section className="max-w-5xl mx-auto px-5 pt-6" style={{ isolation: 'isolate' }}>
          <GreenhouseMap
            greenhouses={items}
            locations={locations}
            photos={photos}
            descriptions={descriptions}
            onOpen={onOpenGreenhouse}
          />
        </section>
      )}

      {/* ── Card list ───────────────────────────────────────────────────── */}
      <main className="max-w-5xl mx-auto px-5 pt-6 pb-32 flex flex-col gap-4">

        {/* Feedback banners */}
        {error && (
          <p className="rounded-xl border border-crit/30 bg-crit/10 px-4 py-2.5 text-sm text-crit">
            {error}
          </p>
        )}
        {!error && message && (
          <p className="rounded-xl border border-accent/30 bg-accent/10 px-4 py-2.5 text-sm text-ink">
            {message}
          </p>
        )}

        {loading && (
          <p className="text-sm text-muted py-8 text-center">Loading…</p>
        )}

        {!loading && items.length === 0 && (
          <div className="text-center py-16">
            <p className="text-2xl text-ink mb-2" style={serif}>No greenhouses yet</p>
            <p className="text-sm text-muted">Tap + to add your first greenhouse.</p>
          </div>
        )}

        {!loading && items.length > 0 && (
          <div className="flex flex-col gap-4">
            {[...items].reverse().map((gh) => (
              <GreenhouseCard
                key={gh.greenhouse_id}
                greenhouse={gh}
                photo={photos[gh.greenhouse_id] ?? null}
                description={descriptions[gh.greenhouse_id] ?? null}
                onOpen={onOpenGreenhouse}
                onDelete={handleDelete}
                onRename={(name) => handleRename(gh, name)}
                pending={pending}
                showConfig={expandedConfigFor === gh.greenhouse_id}
                onToggleConfig={handleToggleConfig}
                config={configByGreenhouse[gh.greenhouse_id]}
                onCopyConfig={() => copyConfig(gh.greenhouse_id)}
              />
            ))}
          </div>
        )}
      </main>

      {/* ── FAB ─────────────────────────────────────────────────────────── */}
      <button
        onClick={() => setModalOpen(true)}
        aria-label="Add greenhouse"
        className="fixed bottom-8 right-6 w-14 h-14 rounded-full bg-ink text-surface text-2xl font-light shadow-lg hover:opacity-90 active:scale-95 transition-all z-30 flex items-center justify-center"
      >
        +
      </button>

      {/* ── Add modal ───────────────────────────────────────────────────── */}
      <AddGreenhouseModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleCreate}
        pending={pending}
      />
    </div>
  );
}

GreenhouseListPage.propTypes = {
  profile: PropTypes.shape({
    tenant_id: PropTypes.string,
    role:      PropTypes.string,
  }),
  onLogout:         PropTypes.func.isRequired,
  onOpenGreenhouse: PropTypes.func.isRequired,
};
GreenhouseListPage.defaultProps = { profile: null };
