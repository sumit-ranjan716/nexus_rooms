import { useAuthStore, useUIStore } from '../store';

function Header(): JSX.Element {
  const { displayName } = useAuthStore();
  const { setSidebarOpen, sidebarOpen, theme, toggleTheme } = useUIStore();

  return (
    <header className="glass border-b border-border px-6 py-4 flex items-center justify-between transition-colors duration-300">
      <div className="flex items-center gap-4">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="text-muted-foreground hover:text-foreground transition-colors p-2 rounded-lg hover:bg-secondary/50 focus:outline-none"
          title="Toggle Sidebar"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <span className="font-semibold text-foreground tracking-tight hidden sm:inline-block">
          Nexus Room Dashboard
        </span>
      </div>

      <div className="flex items-center gap-6">
        {/* Real-time Theme Toggle Button */}
        <button
          onClick={toggleTheme}
          className="relative p-2.5 rounded-xl bg-secondary/80 hover:bg-secondary border border-border text-foreground hover:scale-105 active:scale-95 transition-all duration-200 shadow-sm"
          title={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} Mode`}
        >
          {theme === 'light' ? (
            // Moon icon for switching to dark
            <svg className="w-5 h-5 text-indigo-600 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
            </svg>
          ) : (
            // Sun icon for switching to light
            <svg className="w-5 h-5 text-yellow-500 transition-transform duration-300 rotate-45" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m12.728 0l-.707-.707M6.343 6.343l-.707-.707M14 12a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          )}
        </button>

        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold text-sm">
            {(displayName || 'U')[0].toUpperCase()}
          </div>
          <span className="text-sm font-medium text-foreground">
            {displayName || 'User'}
          </span>
        </div>
      </div>
    </header>
  );
}

export default Header;
