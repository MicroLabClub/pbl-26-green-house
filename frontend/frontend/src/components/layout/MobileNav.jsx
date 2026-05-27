import PropTypes from 'prop-types';
import AlertBadge from '../alerts/AlertBadge';

export default function MobileNav({ unackedCount, onOpenAlerts, activeView, onSetView }) {
  const tabCls = (view) =>
    `flex flex-col items-center gap-0.5 min-w-[44px] min-h-[44px] justify-center transition-colors ${
      activeView === view ? 'text-accent' : 'text-muted hover:text-ink'
    }`;

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-30 flex items-center justify-around bg-surface border-t border-border h-14 px-4">
      <button
        className={tabCls('sensors')}
        onClick={() => onSetView('sensors')}
        aria-label="Sensor readings"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
        <span className="text-[8px] tracking-widest uppercase" style={{ fontFamily: "'Source Code Pro', monospace" }}>Sensors</span>
      </button>

      <button
        className={tabCls('irrigation')}
        onClick={() => onSetView('irrigation')}
        aria-label="Irrigation controls"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 2C6 8 4 12 4 15a8 8 0 0016 0c0-3-2-7-8-13z" />
        </svg>
        <span className="text-[8px] tracking-widest uppercase" style={{ fontFamily: "'Source Code Pro', monospace" }}>Irrigation</span>
      </button>

      <button
        onClick={onOpenAlerts}
        className="relative flex flex-col items-center gap-0.5 text-muted hover:text-ink transition-colors min-w-[44px] min-h-[44px] justify-center"
        aria-label="Open alerts panel"
      >
        <span className="relative">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
          <AlertBadge count={unackedCount} />
        </span>
        <span className="text-[8px] tracking-widest uppercase" style={{ fontFamily: "'Source Code Pro', monospace" }}>Alerts</span>
      </button>
    </nav>
  );
}

MobileNav.propTypes = {
  unackedCount: PropTypes.number.isRequired,
  onOpenAlerts:         PropTypes.func.isRequired,
  activeView:           PropTypes.oneOf(['sensors', 'irrigation']).isRequired,
  onSetView:            PropTypes.func.isRequired,
};
