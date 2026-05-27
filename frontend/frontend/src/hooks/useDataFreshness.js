import { useState, useEffect } from 'react';

const STALE_THRESHOLD_MS = 60_000;

function formatElapsed(ms) {
  const s = Math.floor(ms / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  return `${Math.floor(m / 60)}h ago`;
}

export function useDataFreshness(timestamp) {
  const [state, setState] = useState({ label: 'just now', isStale: false });

  useEffect(() => {
    function tick() {
      const elapsed = Date.now() - new Date(timestamp).getTime();
      setState({
        label: formatElapsed(Math.max(elapsed, 0)),
        isStale: elapsed > STALE_THRESHOLD_MS,
      });
    }
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [timestamp]);

  return state;
}
