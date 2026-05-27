import { useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import AppShell from './components/layout/AppShell';
import LoginPage from './components/auth/LoginPage';
import SignupPage from './components/auth/SignupPage';
import GreenhouseListPage from './components/greenhouse/GreenhouseListPage';
import ZoneManagementPage from './components/zones/ZoneManagementPage';
import { getMe, login, logout, signupTenantAdmin } from './services/authApi';

function navigate(pathname, { replace = false } = {}) {
  const target = pathname.startsWith('/') ? pathname : `/${pathname}`;
  if (replace) {
    window.history.replaceState({}, '', target);
  } else {
    window.history.pushState({}, '', target);
  }
  window.dispatchEvent(new PopStateEvent('popstate'));
}

function usePathname() {
  const [pathname, setPathname] = useState(() => window.location.pathname);

  useEffect(() => {
    const handlePopstate = () => setPathname(window.location.pathname);
    window.addEventListener('popstate', handlePopstate);
    return () => window.removeEventListener('popstate', handlePopstate);
  }, []);

  return pathname;
}

function LoadingScreen({ label }) {
  return (
    <div className="min-h-screen bg-bg px-4 py-8 sm:px-8">
      <div className="mx-auto w-full max-w-md rounded-lg border border-border bg-surface px-4 py-5 text-sm text-muted">
        {label}
      </div>
    </div>
  );
}

LoadingScreen.propTypes = {
  label: PropTypes.string.isRequired,
};

export default function App() {
  const pathname = usePathname();

  const [authLoading, setAuthLoading] = useState(true);
  const [authProfile, setAuthProfile] = useState(null);
  const [loginInfoMessage, setLoginInfoMessage] = useState('');

  useEffect(() => {
    let cancelled = false;

    const loadSession = async () => {
      setAuthLoading(true);
      try {
        const profile = await getMe();
        if (!cancelled) {
          setAuthProfile(profile);
        }
      } catch {
        if (!cancelled) {
          setAuthProfile(null);
        }
      } finally {
        if (!cancelled) {
          setAuthLoading(false);
        }
      }
    };

    void loadSession();

    return () => {
      cancelled = true;
    };
  }, []);

  // Redirect legacy /zones path
  useEffect(() => {
    if (pathname.startsWith('/zones')) {
      navigate('/g', { replace: true });
    }
  }, [pathname]);

  const greenhouseRouteMatch = useMemo(() => pathname.match(/^\/g\/([^/]+)$/), [pathname]);
  const greenhouseZonesMatch = useMemo(() => pathname.match(/^\/g\/([^/]+)\/zones$/), [pathname]);
  const greenhouseId = useMemo(() => {
    const match = greenhouseRouteMatch || greenhouseZonesMatch;
    return match ? decodeURIComponent(match[1]) : '';
  }, [greenhouseRouteMatch, greenhouseZonesMatch]);

  const handleLogin = async ({ username, password }) => {
    await login({ username, password });
    const profile = await getMe();
    setAuthProfile(profile);
    setLoginInfoMessage('');
    navigate('/g', { replace: true });
  };

  const handleSignup = async ({ username, password, tenantName, tenantId }) => {
    await signupTenantAdmin({ username, password, tenantName, tenantId });
    setLoginInfoMessage('Tenant created. You can now login with your new credentials.');
    navigate('/login', { replace: true });
  };

  const handleLogout = async () => {
    try {
      await logout();
    } finally {
      setAuthProfile(null);
      navigate('/login', { replace: true });
    }
  };

  if (pathname === '/login') {
    return (
      <LoginPage
        infoMessage={loginInfoMessage}
        onLogin={handleLogin}
        onGoSignup={() => navigate('/signup')}
      />
    );
  }

  if (pathname === '/signup') {
    return (
      <SignupPage
        onSignup={handleSignup}
        onGoLogin={() => navigate('/login')}
      />
    );
  }

  if (pathname === '/g') {
    if (authLoading) {
      return <LoadingScreen label="Loading session..." />;
    }
    if (!authProfile) {
      return (
        <LoginPage
          infoMessage="Please login to access tenant greenhouses."
          onLogin={handleLogin}
          onGoSignup={() => navigate('/signup')}
        />
      );
    }

    return (
      <GreenhouseListPage
        profile={authProfile}
        onLogout={handleLogout}
        onOpenGreenhouse={(id) => navigate(`/g/${encodeURIComponent(id)}`)}
      />
    );
  }

  // /g/:id/zones — zone management for a specific greenhouse
  if (greenhouseZonesMatch) {
    if (authLoading) {
      return <LoadingScreen label="Loading session..." />;
    }
    if (!authProfile) {
      return (
        <LoginPage
          infoMessage="Please login to open greenhouse controls."
          onLogin={handleLogin}
          onGoSignup={() => navigate('/signup')}
        />
      );
    }

    return <ZoneManagementPage greenhouseId={greenhouseId} />;
  }

  // /g/:id — sensor dashboard for a specific greenhouse
  if (greenhouseRouteMatch) {
    if (authLoading) {
      return <LoadingScreen label="Loading session..." />;
    }
    if (!authProfile) {
      return (
        <LoginPage
          infoMessage="Please login to view the sensor dashboard."
          onLogin={handleLogin}
          onGoSignup={() => navigate('/signup')}
        />
      );
    }

    return <AppShell greenhouseId={greenhouseId} />;
  }

  // Root and any unknown path → redirect to login (or greenhouse list if already authed)
  if (authLoading) {
    return <LoadingScreen label="Loading session..." />;
  }

  if (authProfile) {
    navigate('/g', { replace: true });
    return null;
  }

  navigate('/login', { replace: true });
  return null;
}
