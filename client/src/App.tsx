import { useEffect } from 'react';
import {
  Routes,
  Route,
  Navigate,
  useNavigate,
  useLocation,
} from 'react-router-dom';
import { useStore } from './store/useStore';
import { useWebSocket } from './hooks/useWebSocket';
import LoginPage from './pages/LoginPage';
import ParentPortal from './pages/ParentPortal';
import DriverPortal from './pages/DriverPortal';
import OperationsPortal from './pages/OperationsPortal';
import ParentVerification from './pages/ParentVerification';
import DeviceFrame from './components/DeviceFrame';
import type { UserRole } from './types';

const ROLE_PATHS: Record<UserRole, string> = {
  parent: '/parent',
  driver: '/driver',
  operations: '/ops',
};

function isUserRole(v: string | null): v is UserRole {
  return v === 'parent' || v === 'driver' || v === 'operations';
}

function AppRouter() {
  const role = useStore((s) => s.role);
  const name = useStore((s) => s.name);
  const setRole = useStore((s) => s.setRole);
  const setName = useStore((s) => s.setName);

  const navigate = useNavigate();
  const location = useLocation();

  // Single shared WebSocket for the whole app.
  const { sendMessage } = useWebSocket(role, name);

  // Restore role/name from sessionStorage on first mount.
  useEffect(() => {
    if (role) return;
    const savedRole = sessionStorage.getItem('ptt_role');
    const savedName = sessionStorage.getItem('ptt_name');
    if (isUserRole(savedRole)) {
      setRole(savedRole);
      if (savedName) setName(savedName);
    }
  }, [role, setRole, setName]);

  // Route the user to their portal once a role is set.
  useEffect(() => {
    if (!role) return;
    const target = ROLE_PATHS[role];
    if (location.pathname === '/' || location.pathname === '/login') {
      navigate(target, { replace: true });
    }
  }, [role, navigate, location.pathname]);

  const requireRole = (expected: UserRole) => {
    if (!role) return <Navigate to="/login" replace />;
    if (role !== expected) return <Navigate to={ROLE_PATHS[role]} replace />;
    return null;
  };

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/parent-verify"
        element={
          <>
            {requireRole('parent')}
            <DeviceFrame device="iphone">
              <ParentVerification onVerified={() => navigate('/parent')} />
            </DeviceFrame>
          </>
        }
      />
      <Route
        path="/parent"
        element={
          <>
            {requireRole('parent')}
            <DeviceFrame device="iphone">
              <ParentPortal sendMessage={sendMessage} />
            </DeviceFrame>
          </>
        }
      />
      <Route
        path="/driver"
        element={
          <>
            {requireRole('driver')}
            <DeviceFrame device="samsung-tablet">
              <DriverPortal sendMessage={sendMessage} />
            </DeviceFrame>
          </>
        }
      />
      <Route
        path="/ops"
        element={
          <>
            {requireRole('operations')}
            <DeviceFrame device="ipad">
              <OperationsPortal sendMessage={sendMessage} />
            </DeviceFrame>
          </>
        }
      />
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default function App() {
  return <AppRouter />;
}
