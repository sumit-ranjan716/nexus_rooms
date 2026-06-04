import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { authService } from '../services/authService';
import nexusLogo from '../nexus_logo.jpeg';

function ResetPassword(): JSX.Element {
  const [params] = useSearchParams();
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const token = params.get('token');

  const handleSubmit = async (event: React.FormEvent): Promise<void> => {
    event.preventDefault();
    setMessage('');
    setError('');

    if (!token) {
      setError('Missing reset token.');
      return;
    }

    setLoading(true);
    try {
      const response = await authService.resetPassword(token, password);
      setMessage(response.message);
      setPassword('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Reset failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-slate-900 to-indigo-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-slate-900/75 border border-white/10 rounded-3xl shadow-2xl p-8 text-white text-center space-y-6 relative overflow-hidden backdrop-blur-md">
        
        {/* Glow Effect */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-primary/20 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none"></div>

        <div className="flex flex-col items-center space-y-3">
          <img 
            src={nexusLogo} 
            alt="Nexus Logo" 
            className="w-16 h-16 rounded-2xl object-cover shadow-lg shadow-primary/20"
          />
          <div className="space-y-1">
            <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-primary to-indigo-300 bg-clip-text text-transparent">
              Nexus Rooms
            </h1>
            <p className="text-xs text-slate-400 tracking-widest uppercase">Reset Password</p>
          </div>
        </div>

        {error && (
          <div className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-200 text-sm rounded-2xl">
            {error}
          </div>
        )}

        {message && (
          <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-200 text-sm rounded-2xl">
            {message}
          </div>
        )}

        <form className="space-y-4 text-left" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <label htmlFor="password-reset-input" className="text-xs font-semibold text-slate-300">
              New Password
            </label>
            <input
              id="password-reset-input"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Enter new password"
              className="w-full text-sm rounded-xl border border-white/10 px-3.5 py-2.5 bg-slate-950/40 text-white focus:outline-none focus:ring-1 focus:ring-primary transition"
              minLength={8}
              required
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full text-sm font-semibold rounded-xl bg-primary text-primary-foreground py-3 shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 disabled:opacity-50"
          >
            {loading ? (
              <div className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent animate-spin rounded-full"></div>
                <span>Resetting...</span>
              </div>
            ) : (
              'Reset Password'
            )}
          </button>
        </form>

        <div className="pt-2">
          <Link 
            className="text-sm font-semibold text-indigo-300 hover:text-indigo-200 hover:underline transition" 
            to="/login"
          >
            Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
}

export default ResetPassword;