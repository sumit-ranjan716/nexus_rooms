import { Outlet } from 'react-router-dom';
import { useUIStore } from '../store';
import Sidebar from './Sidebar';
import Header from './Header';

function Layout(): JSX.Element {
  const { sidebarOpen, setSidebarOpen } = useUIStore();

  return (
    <div className="flex h-screen bg-background text-foreground transition-colors duration-300 overflow-hidden relative">
      {/* Sidebar */}
      <Sidebar />

      {/* Mobile Backdrop Overlay */}
      {sidebarOpen && (
        <button
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-35 bg-black/60 backdrop-blur-xs md:hidden transition-opacity cursor-default w-full h-full border-none outline-none"
          aria-label="Close Sidebar"
        />
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <Header />

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto bg-background/50 transition-colors duration-300">
          <div className="p-4 sm:p-6 max-w-7xl mx-auto w-full">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}

export default Layout;
