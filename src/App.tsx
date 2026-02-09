import React from "react";
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
import { ROUTE_ENDPOINTS } from "./config/router-service/utils/endpoints";

function PrivateLayout() {
  const location = useLocation();
  const navigate = useNavigate();

  const activeRoute =
    sidebarRoutes.find((route: any) => route.path === location.pathname) ||
    sidebarRoutes[0];

  const handleNavigate = (key: string) => {
    const target = sidebarRoutes.find((route: any) => route.key === key);
    if (target) {
      navigate(target.path);
    }
  };

  return (
    <AppShell
      activeKey={activeRoute?.key}
      onNavigate={handleNavigate}
      title={activeRoute?.title || "Dashboard"}
    >
      <Routes>
        {sidebarRoutes.map(({ path, component: Component, key }) => (
          <Route key={key} path={path} element={<Component />} />
        ))}
        <Route
          path="*"
          element={<Navigate to={ROUTE_ENDPOINTS.dashboard} replace />}
        />
      </Routes>
    </AppShell>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {publicRoutes.map(({ path, component: Component, key }) => (
          <Route key={key} path={path} element={<Component />} />
        ))}
        <Route path="/*" element={<PrivateLayout />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
