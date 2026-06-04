import { useEffect } from 'react';
import { authService } from '../services/authService';
import { useAuthStore, useUIStore } from '../store';

function AuthBootstrap(): JSX.Element | null {
  const setAuth = useAuthStore((state) => state.setAuth);
  const setHydrated = useAuthStore((state) => state.setHydrated);
  const theme = useUIStore((state) => state.theme);

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  useEffect(() => {
    const bootstrap = async (): Promise<void> => {
      const session = await authService.restoreSession();

      if (session) {
        setAuth(true, session.user.id, session.user.email, session.user.displayName, session.accessToken);
      } else {
        setHydrated(true);
      }
    };

    bootstrap();
  }, [setAuth, setHydrated]);

  return null;
}

export default AuthBootstrap;