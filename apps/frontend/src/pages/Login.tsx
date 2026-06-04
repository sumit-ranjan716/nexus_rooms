import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store';
import { authService } from '../services/authService';
import nexusLogo from '../nexus_logo.jpeg';

function Login(): JSX.Element {
  const [mode, setMode] = useState<'login' | 'signup' | 'forgot'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const setAuth = useAuthStore((state) => state.setAuth);

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      if (mode === 'login') {
        const session = await authService.login(email, password);
        setAuth(true, session.user.id, session.user.email, session.user.displayName, session.accessToken);
        
        const from = (location.state as any)?.from?.pathname || '/';
        navigate(from, { replace: true });
      } else if (mode === 'signup') {
        const response = await authService.signup(email, password, displayName);
        setSuccess(response.message);
        setMode('login');
      } else {
        const response = await authService.forgotPassword(email);
        setSuccess(response.message);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-slate-900 to-indigo-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-slate-900/75 border border-white/10 rounded-3xl shadow-2xl p-8 text-white relative overflow-hidden backdrop-blur-md space-y-6">
        
        {/* Glow Effect */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-primary/20 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none"></div>

        <div className="flex flex-col items-center space-y-3 text-center">
          <img 
            src={nexusLogo} 
            alt="Nexus Logo" 
            className="w-16 h-16 rounded-2xl object-cover shadow-lg shadow-primary/20"
          />
          <div className="space-y-1">
            <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-primary to-indigo-300 bg-clip-text text-transparent">
              Nexus Rooms
            </h1>
            <p className="text-xs text-slate-400 tracking-widest uppercase">Secure Resource Portal</p>
          </div>
        </div>

        {/* Tab Selector */}
        <div className="grid grid-cols-3 rounded-xl bg-slate-950/40 p-1 border border-white/5">
          {(['login', 'signup', 'forgot'] as const).map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => {
                setMode(item);
                setError('');
                setSuccess('');
              }}
              className={`rounded-lg py-2 text-xs font-semibold capitalize transition ${
                mode === item ? 'bg-primary text-primary-foreground shadow' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {item === 'login' ? 'Log In' : item === 'signup' ? 'Sign Up' : 'Forgot'}
            </button>
          ))}
        </div>

        {error && (
          <div className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-200 text-sm rounded-2xl">
            {error}
          </div>
        )}
        
        {success && (
          <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-200 text-sm rounded-2xl">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'signup' && (
            <div className="space-y-2">
              <label htmlFor="displayName" className="text-xs font-semibold text-slate-300">
                Display Name
              </label>
              <input
                id="displayName"
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                required
                className="w-full text-sm rounded-xl border border-white/10 px-3.5 py-2.5 bg-slate-950/40 text-white focus:outline-none focus:ring-1 focus:ring-primary transition"
                placeholder="Alice Johnson"
              />
            </div>
          )}

          <div className="space-y-2">
            <label htmlFor="email" className="text-xs font-semibold text-slate-300">
              Email Address
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full text-sm rounded-xl border border-white/10 px-3.5 py-2.5 bg-slate-950/40 text-white focus:outline-none focus:ring-1 focus:ring-primary transition"
              placeholder="you@example.com"
            />
          </div>

          {mode !== 'forgot' && (
            <div className="space-y-2">
              <label htmlFor="password" className="text-xs font-semibold text-slate-300">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full text-sm rounded-xl border border-white/10 px-3.5 py-2.5 bg-slate-950/40 text-white focus:outline-none focus:ring-1 focus:ring-primary transition"
                placeholder="••••••••"
              />
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full text-sm font-semibold rounded-xl bg-primary text-primary-foreground py-3 shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition duration-200 disabled:opacity-50"
          >
            {loading ? (
              <div className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent animate-spin rounded-full"></div>
                <span>Working...</span>
              </div>
            ) : mode === 'login' ? (
              'Log In'
            ) : mode === 'signup' ? (
              'Create Account'
            ) : (
              'Send Reset Link'
            )}
          </button>
        </form>

        <p className="text-center text-xs text-slate-400">
          {mode === 'login' ? 'Need an account?' : 'Already have an account?'}{' '}
          <button
            type="button"
            className="text-indigo-300 font-semibold hover:underline"
            onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
          >
            {mode === 'login' ? 'Sign up' : 'Log in'}
          </button>
        </p>
      </div>
    </div>
  );
}

export default Login;
