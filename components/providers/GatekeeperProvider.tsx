'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

const AuthContext = createContext<{ logout: () => void }>({ logout: () => {} });

export function useAuth() {
  return useContext(AuthContext);
}

export function GatekeeperProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      // Verify token is still valid
      fetch('/api/auth', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      })
        .then(res => res.json())
        .then(data => setIsAuthenticated(data.valid))
        .catch(() => setIsAuthenticated(false));
    } else {
      setIsAuthenticated(false);
    }
  }, []);

  const handleLogin = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      if (res.ok) {
        const { token } = await res.json();
        localStorage.setItem('auth_token', token);
        setIsAuthenticated(true);
      } else {
        setError('Falsches Passwort');
      }
    } catch {
      setError('Verbindungsfehler');
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('auth_token');
    setIsAuthenticated(false);
  };

  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 p-4">
        <div className="w-full max-w-sm space-y-6">
          <div className="text-center">
            <p className="text-5xl mb-3">🍽️</p>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Rezept- und Einkaufsplaner
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              Bitte Passwort eingeben
            </p>
          </div>
          <div className="space-y-3">
            <input
              type="password"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError(''); }}
              onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
              placeholder="Passwort"
              className="w-full px-4 py-3 rounded-2xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 text-center text-lg"
              autoFocus
            />
            {error && <p className="text-red-500 text-sm text-center">{error}</p>}
            <button
              onClick={handleLogin}
              disabled={loading || !password}
              className="w-full py-3 rounded-2xl bg-emerald-600 text-white font-semibold hover:bg-emerald-700 transition-colors disabled:opacity-50"
            >
              {loading ? 'Laden...' : 'Einloggen'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ logout }}>
      {children}
    </AuthContext.Provider>
  );
}
