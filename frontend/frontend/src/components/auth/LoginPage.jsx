import PropTypes from 'prop-types';
import { useState } from 'react';

const serif = { fontFamily: "'Playfair Display', Georgia, serif" };

function LeafIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-7 h-7 text-surface" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
      <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10z"/>
      <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/>
    </svg>
  );
}

export default function LoginPage({ onLogin, onGoSignup, infoMessage }) {
  const [username, setUsername]     = useState('');
  const [password, setPassword]     = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError]           = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim() || !password) { setError('Username and password are required.'); return; }
    setSubmitting(true);
    setError('');
    try {
      await onLogin({ username: username.trim(), password });
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : String(nextError));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center px-5 py-10">
      <div className="w-full max-w-sm flex flex-col items-center">

        {/* Logo mark */}
        <div className="w-16 h-16 rounded-2xl bg-ink flex items-center justify-center mb-7 shadow-md">
          <LeafIcon />
        </div>

        <h1 className="text-3xl text-ink text-center mb-1" style={serif}>Welcome back</h1>
        <p className="text-sm text-muted text-center mb-8">Sign in to your greenhouse dashboard</p>

        {/* Card */}
        <div className="w-full bg-surface rounded-2xl p-6 flex flex-col gap-4" style={{ boxShadow: '0 4px 24px rgba(55,68,38,0.09)' }}>

          {infoMessage && (
            <p className="rounded-xl border border-accent/30 bg-accent/10 px-4 py-2.5 text-sm text-ink">
              {infoMessage}
            </p>
          )}

          {error && (
            <p className="rounded-xl border border-crit/30 bg-crit/10 px-4 py-2.5 text-sm text-crit">
              {error}
            </p>
          )}

          <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted">Username</span>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                required
                className="h-12 rounded-xl border border-border bg-bg px-4 text-sm text-ink outline-none focus:border-accent transition-colors"
              />
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted">Password</span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
                className="h-12 rounded-xl border border-border bg-bg px-4 text-sm text-ink outline-none focus:border-accent transition-colors"
              />
            </label>

            <button
              type="submit"
              disabled={submitting}
              className="h-12 rounded-2xl bg-ink text-surface text-sm font-semibold hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {submitting ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          <div className="border-t border-border pt-4 flex justify-center">
            <button
              type="button"
              onClick={onGoSignup}
              className="text-sm text-accent hover:text-soil font-medium transition-colors"
            >
              Create an account →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

LoginPage.propTypes = {
  onLogin:     PropTypes.func.isRequired,
  onGoSignup:  PropTypes.func.isRequired,
  infoMessage: PropTypes.string,
};

LoginPage.defaultProps = { infoMessage: '' };
