import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store';

function ProtectedRoute(): JSX.Element {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isHydrated = useAuthStore((state) => state.isHydrated);
  const location = useLocation();

  if (!isHydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-600">
        Loading session...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <Outlet />;
}

export default ProtectedRoute;