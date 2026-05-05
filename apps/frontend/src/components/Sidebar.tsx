import { Link, useLocation } from 'react-router-dom';
import { authService } from '../services/authService';
import { useAuthStore } from '../store';

function Sidebar(): JSX.Element {
  const location = useLocation();
  const { clearAuth } = useAuthStore();

  const isActive = (path: string): boolean => location.pathname === path;

  const handleLogout = (): void => {
    authService.logout().finally(() => {
      clearAuth();
      window.location.href = '/login';
    });
  };

  return (
    <aside className="w-64 bg-gray-900 text-white flex flex-col">
      {/* Logo */}
      <div className="px-6 py-6 border-b border-gray-700">
        <h1 className="text-2xl font-bold">Nexus Rooms</h1>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-2">
        <Link
          to="/"
          className={`block px-4 py-2 rounded-lg transition ${
            isActive('/') ? 'bg-blue-600' : 'hover:bg-gray-800'
          }`}
        >
          Dashboard
        </Link>
      </nav>

      {/* Logout */}
      <div className="px-4 py-6 border-t border-gray-700">
        <button
          onClick={handleLogout}
          className="w-full px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 transition"
        >
          Logout
        </button>
      </div>
    </aside>
  );
}

export default Sidebar;
