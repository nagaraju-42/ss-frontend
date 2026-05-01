import { useState } from 'react';
import { Lock, ShoppingBag, User } from 'lucide-react';
import { api } from '../api';

export default function LoginView({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const res = await api.post('/api/auth/login', { username, password });
      sessionStorage.setItem('pastry_user', JSON.stringify(res.data));
      onLogin(res.data);
    } catch {
      setError('Invalid username or password.');
      setLoading(false);
    }
  };

  return (
    <main
      className="min-h-screen flex flex-col items-center justify-center p-5 relative overflow-hidden"
      style={{background:'linear-gradient(135deg,#0a0f1a 0%,#111827 60%,#0a0f1a 100%)'}}
    >
      {/* Glow blobs */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 blur-3xl pointer-events-none opacity-15" style={{background:'radial-gradient(circle,#f59e0b,transparent 70%)'}} />
      <div className="absolute bottom-0 right-0 w-64 h-64 blur-3xl pointer-events-none opacity-10" style={{background:'radial-gradient(circle,#3b82f6,transparent 70%)'}} />

      <div className="w-full max-w-sm relative z-10 animate-fadeInUp">
        {/* Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl mb-4"
            style={{background:'linear-gradient(135deg,#f59e0b,#d97706)',boxShadow:'0 8px 32px rgba(245,158,11,0.4)'}}>
            <ShoppingBag size={36} color="#0a0f1a" strokeWidth={2.5} />
          </div>
          <h1 className="text-3xl font-black" style={{color:'#f9fafb'}}>Staff Portal</h1>
          <p className="text-sm font-medium mt-1" style={{color:'#6b7280'}}>Owner, Picker & Kitchen access</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="glass-card p-6 space-y-4">
          <div>
            <label className="block text-xs font-black uppercase tracking-wider mb-2" style={{color:'#9ca3af'}}>Username</label>
            <div className="relative flex items-center">
              <User size={16} className="absolute left-4" style={{color:'#f59e0b'}} />
              <input
                value={username}
                onChange={e => setUsername(e.target.value)}
                className="field !pl-10"
                required
                id="login-username"
                autoComplete="username"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-black uppercase tracking-wider mb-2" style={{color:'#9ca3af'}}>Password</label>
            <div className="relative flex items-center">
              <Lock size={16} className="absolute left-4" style={{color:'#f59e0b'}} />
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="field !pl-10"
                required
                id="login-password"
                autoComplete="current-password"
              />
            </div>
          </div>

          {error && (
            <p className="text-sm font-bold text-center animate-fadeIn" style={{color:'#f87171'}}>
              ⚠️ {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary w-full mt-2"
            id="login-submit-btn"
          >
            {loading ? <span className="spinner" /> : <Lock size={16} />}
            {loading ? 'Authenticating...' : 'Login'}
          </button>
        </form>

        <p className="text-center mt-4 text-xs" style={{color:'#374151'}}>
          Softy Bakeries v2.0 · Staff access only
        </p>
      </div>
    </main>
  );
}
