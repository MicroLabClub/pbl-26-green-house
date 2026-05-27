import PropTypes from 'prop-types';
import AlertPanel from '../alerts/AlertPanel';

export default function DesktopSidebar({ alerts, onAcknowledge, onDismiss }) {
  return (
    <aside className="hidden lg:flex flex-col w-72 xl:w-80 shrink-0 border-r border-border bg-surface h-full overflow-hidden">
      <AlertPanel alerts={alerts} onAcknowledge={onAcknowledge} onDismiss={onDismiss} />
    </aside>
  );
}

DesktopSidebar.propTypes = {
  alerts:        PropTypes.array.isRequired,
  onAcknowledge: PropTypes.func.isRequired,
  onDismiss:     PropTypes.func.isRequired,
};
