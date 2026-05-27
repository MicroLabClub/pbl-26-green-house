import PropTypes from 'prop-types';
import { useDataFreshness } from '../../hooks/useDataFreshness';

export default function FreshnessIndicator({ timestamp }) {
  const { label, isStale } = useDataFreshness(timestamp);

  return (
    <span
      className={`flex items-center gap-1.5 text-[9px] tracking-[0.15em] uppercase ${isStale ? 'text-warn' : 'text-muted'}`}
      style={{ fontFamily: "'Source Code Pro', monospace" }}
    >
      {isStale ? (
        <>
          <svg xmlns="http://www.w3.org/2000/svg" className="w-2.5 h-2.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
          </svg>
          stale ·
        </>
      ) : (
        <span className="w-1.5 h-1.5 rounded-full bg-accent/50 shrink-0" />
      )}
      {label}
    </span>
  );
}

FreshnessIndicator.propTypes = { timestamp: PropTypes.string.isRequired };
