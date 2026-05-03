import { Suspense, useEffect } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useLocation,
  useNavigate,
} from "react-router-dom";
import { AppShell } from "./components/layout/AppShell";
import { sidebarRoutes, publicRoutes } from "./config/router-service";
import { tokenCookieUtils } from './utils/cookies';
import { signout } from './pages/auth/stores/actions';
import { toast, ToastContainer } from './utils/react-toastify-shim.js';
import { ROUTE_ENDPOINTS } from "./config/router-service/utils/endpoints";
import { useSocket } from "./utils/useSocket";
import { useAlertSound } from "./utils/useAlertSound";

// ─── Global real-time alert listener (runs once inside the app) ───────────

function GlobalAlerts() {
  const { playWarning, playCritical } = useAlertSound();

  useSocket({
    new_incident: (incident: any) => {
      const isCritical = incident?.severity === 'high';
      const msg = `${isCritical ? 'CRITICAL' : 'Warning'}: ${incident?.studentName || 'Unknown'} — ${incident?.cheatingType || 'Incident detected'}`;

      if (isCritical) {
        playCritical();
        toast.error(`🚨 ${msg}`, { autoClose: 8000 });
      } else {
        playWarning();
        toast.warning(`⚠️ ${msg}`, { autoClose: 5000 });
      }

      // Browser OS notification (works when tab is not focused)
      try {
        const stored = localStorage.getItem('settings_browserNotifications');
        const enabled = stored === null ? false : stored === 'true';
        if (enabled && 'Notification' in window && Notification.permission === 'granted') {
          new Notification(`EduVision — ${isCritical ? '🚨 CRITICAL' : '⚠️ Warning'}`, {
            body: `${incident?.studentName || 'Student'} · ${incident?.cheatingType || 'Incident detected'}`,
            icon: '/favicon.ico',
            tag: incident?.id || 'incident',
          });
        }
      } catch (_) {}
    },
  });

  return null;
}

// ─── Private layout ───────────────────────────────────────────────────────

function PrivateLayout() {
  const location = useLocation();
  const navigate = useNavigate();

  if (!tokenCookieUtils.isTokenValid()) {
    return <Navigate to="/admin-signin" replace state={{ from: location }} />;
  }

  const activeRoute =
    sidebarRoutes.find((route: any) => route.path === location.pathname) ||
    sidebarRoutes[0];

  const handleNavigate = (key: string) => {
    if (key === 'logout') {
      try { tokenCookieUtils.removeAccessToken(); } catch (e) {}
      try { signout(); } catch (e) {}
      try { toast.success('Logged out successfully'); } catch (e) {}
      navigate('/admin-signin', { replace: true });
      return;
    }
    const target = sidebarRoutes.find((route: any) => route.key === key);
    if (target) navigate(target.path);
  };

  return (
    <AppShell
      activeKey={activeRoute?.key}
      onNavigate={handleNavigate}
      title={activeRoute?.title || "Dashboard"}
    >
      <GlobalAlerts />
      <Suspense fallback={<div className="flex items-center justify-center h-full py-20 text-slate-400 text-sm">Loading…</div>}>
        <Routes>
          {sidebarRoutes.map(({ path, component: Component, key }) => (
            <Route key={key} path={path} element={<Component />} />
          ))}
          <Route path="*" element={<Navigate to={ROUTE_ENDPOINTS.dashboard} replace />} />
        </Routes>
      </Suspense>
    </AppShell>
  );
}

// ─── Root ─────────────────────────────────────────────────────────────────

function App() {
  return (
    <>
      <BrowserRouter>
        <Suspense fallback={<div className="flex items-center justify-center min-h-screen text-slate-400 text-sm">Loading…</div>}>
          <Routes>
            {publicRoutes.map(({ path, component: Component, key }) => (
              <Route key={key} path={path} element={<Component />} />
            ))}
            <Route path="/*" element={<PrivateLayout />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
      <ToastContainer position="top-right" autoClose={3000} />
    </>
  );
}

export default App;
