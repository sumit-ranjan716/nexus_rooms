import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiClient } from '@nexus/api-client';
import type { InviteDetails } from '@nexus/types';
import nexusLogo from '../nexus_logo.jpeg';

function JoinRoom(): JSX.Element {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState('');
  const [invite, setInvite] = useState<InviteDetails | null>(null);
  const [password, setPassword] = useState('');

  useEffect(() => {
    async function fetchInvite() {
      if (!token) {
        setError('No invite token provided');
        setLoading(false);
        return;
      }

      try {
        const data = await apiClient.getInviteDetails(token);
        setInvite(data);
      } catch (err: any) {
        setError(err.message || 'This invite link is invalid or has expired.');
      } finally {
        setLoading(false);
      }
    }

    fetchInvite();
  }, [token]);

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !invite) return;

    setJoining(true);
    setError('');

    try {
      // Joins using the api client and redirects to the room ID in dashboard
      await apiClient.joinRoomViaInvite(invite.roomId, token, invite.hasPassword ? password : undefined);
      navigate(`/?roomId=${invite.roomId}`);
    } catch (err: any) {
      setError(err.message || 'Failed to join the room. Please check the password.');
    } finally {
      setJoining(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-slate-900 to-indigo-900 flex items-center justify-center p-4 text-white">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent animate-spin rounded-full mx-auto"></div>
          <p className="text-sm text-slate-400">Verifying invitation code...</p>
        </div>
      </div>
    );
  }

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
            <p className="text-xs text-slate-400 tracking-widest uppercase">Workspace Invitation</p>
          </div>
        </div>

        {error && (
          <div className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-200 text-sm rounded-2xl">
            {error}
          </div>
        )}

        {invite ? (
          <form onSubmit={handleJoin} className="space-y-6">
            <div className="space-y-4">
              <div className="mx-auto w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-primary text-2xl font-bold">
                🚪
              </div>

              <div className="space-y-1">
                <p className="text-xs text-slate-400 uppercase">You have been invited to join</p>
                <h2 className="text-2xl font-bold text-slate-100">{invite.roomName}</h2>
                {invite.roomDescription && (
                  <p className="text-sm text-slate-400 line-clamp-2 px-4">{invite.roomDescription}</p>
                )}
              </div>

              <div className="flex justify-center">
                <span className="text-[10px] px-2.5 py-1 rounded-full bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 font-semibold tracking-wider uppercase">
                  Role: {invite.role}
                </span>
              </div>
            </div>

            {invite.hasPassword && (
              <div className="space-y-2 text-left">
                <label htmlFor="password" className="text-xs font-semibold text-slate-300">
                  Password Required
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter room password"
                  required
                  className="w-full text-sm rounded-xl border border-white/10 px-3.5 py-2.5 bg-slate-950/40 text-white focus:outline-none focus:ring-1 focus:ring-primary transition"
                />
              </div>
            )}

            <button
              type="submit"
              disabled={joining}
              className="w-full text-sm font-semibold rounded-xl bg-primary text-primary-foreground py-3 shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 disabled:opacity-50 disabled:hover:scale-100"
            >
              {joining ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent animate-spin rounded-full"></div>
                  <span>Joining Workspace...</span>
                </div>
              ) : (
                'Accept Invite & Join Room'
              )}
            </button>
          </form>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-slate-400">
              Please double check the invitation link or request a new one from the room owner.
            </p>
            <button
              onClick={() => navigate('/')}
              className="w-full text-sm font-semibold rounded-xl bg-secondary text-foreground py-2.5 hover:bg-secondary-foreground/10 transition"
            >
              Back to Dashboard
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default JoinRoom;
