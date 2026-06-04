import { useEffect, useState, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { authService } from '../services/authService';
import nexusLogo from '../nexus_logo.jpeg';

function VerifyEmail(): JSX.Element {
  const [params] = useSearchParams();
  const [message, setMessage] = useState('Verifying your email...');
  const [loading, setLoading] = useState(true);
  const token = params.get('token');
  const calledRef = useRef(false);

  useEffect(() => {
    const verify = async (): Promise<void> => {
      if (!token) {
        setMessage('Missing verification token.');
        setLoading(false);
        return;
      }

      if (calledRef.current) return;
      calledRef.current = true;

      try {
        const response = await authService.verifyEmail(token);
        setMessage(response.message);
      } catch (error) {
        setMessage(error instanceof Error ? error.message : 'Verification failed');
      } finally {
        setLoading(false);
      }
    };

    verify();
  }, [token]);

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
            <p className="text-xs text-slate-400 tracking-widest uppercase">Email Verification</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="mx-auto w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-primary text-2xl font-bold">
            {loading ? '✉️' : '✓'}
          </div>

          <p className="text-sm text-slate-300 px-2 leading-relaxed">
            {message}
          </p>
        </div>

        <div className="pt-2">
          <Link 
            className="w-full inline-block text-sm font-semibold rounded-xl bg-primary text-primary-foreground py-3 shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200" 
            to="/login"
          >
            Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
}

export default VerifyEmail;