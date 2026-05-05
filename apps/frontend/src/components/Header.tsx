import { useAuthStore, useUIStore } from '../store';

function Header(): JSX.Element {
  const { displayName } = useAuthStore();
  const { setSidebarOpen, sidebarOpen } = useUIStore();

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="text-gray-600 hover:text-gray-900"
      >
        ☰
      </button>
      <div className="flex items-center gap-4">
        <span className="text-gray-700">Welcome, {displayName || 'User'}</span>
      </div>
    </header>
  );
}

export default Header;
