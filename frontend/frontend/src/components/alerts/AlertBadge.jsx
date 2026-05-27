import PropTypes from 'prop-types';

export default function AlertBadge({ count }) {
  if (count === 0) return null;
  return (
    <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 flex items-center justify-center bg-crit text-white text-[9px] font-semibold tracking-tight leading-none rounded-full"
      style={{ fontFamily: "'Source Code Pro', monospace" }}>
      {count > 9 ? '9+' : count}
    </span>
  );
}

AlertBadge.propTypes = { count: PropTypes.number.isRequired };
