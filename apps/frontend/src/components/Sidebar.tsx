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
    <aside className="w-64 bg-card text-card-foreground border-r border-border flex flex-col transition-colors duration-300">
      {/* Logo */}
      <div className="px-6 py-6 border-b border-border flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-primary to-indigo-400 flex items-center justify-center text-primary-foreground font-bold shadow-md shadow-primary/20">
          N
        </div>
        <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-primary to-indigo-500 bg-clip-text text-transparent">
          Nexus Rooms
        </h1>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-1.5">
        <Link
          to="/"
          className={`flex items-center gap-3 px-4 py-2.5 rounded-xl font-medium transition-all duration-200 ${
            isActive('/')
              ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/15'
              : 'text-muted-foreground hover:text-foreground hover:bg-secondary/70'
          }`}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2v-4zM14 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2v-4z" />
          </svg>
          Dashboard
        </Link>
      </nav>

      {/* Logout */}
      <div className="px-4 py-6 border-t border-border">
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-destructive/10 text-destructive hover:bg-destructive hover:text-destructive-foreground transition-all duration-200 font-medium"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          Logout
        </button>
      </div>
    </aside>
  );
}

export default Sidebar;
