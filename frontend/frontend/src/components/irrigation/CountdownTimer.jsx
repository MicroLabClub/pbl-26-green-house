import PropTypes from 'prop-types';

export default function CountdownTimer({ seconds }) {
  return (
    <span
      className="tabular-nums text-warn text-[10px] tracking-widest"
      style={{ fontFamily: "'Source Code Pro', monospace" }}
    >
      {String(seconds).padStart(2, '0')}s
    </span>
  );
}

CountdownTimer.propTypes = {
  seconds: PropTypes.number.isRequired,
};
