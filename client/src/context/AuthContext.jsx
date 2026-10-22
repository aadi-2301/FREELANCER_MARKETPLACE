import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('fs_token') || null);
  const [loading, setLoading] = useState(true);

  // Helper for authorized fetch
  const authFetch = async (url, options = {}) => {
    const headers = {
      ...(options.headers || {}),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    // Default to JSON if body is not FormData
    if (options.body && !(options.body instanceof FormData) && !headers['Content-Type']) {
      headers['Content-Type'] = 'application/json';
    }

    const res = await fetch(url, { ...options, headers });
    return res;
  };

  const loadCurrentUser = async () => {
    if (!token) {
      // Default to quick-login as Client Alex on initial visit
      await switchRole('client');
      setLoading(false);
      return;
    }

    try {
      const res = await authFetch('/api/auth/me');
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
      } else {
        await switchRole('client');
      }
    } catch (err) {
      console.error('Failed to load user profile:', err);
      await switchRole('client');
    } finally {
      setLoading(false);
    }
  };

  const switchRole = async (roleName) => {
    setLoading(true);
    try {
      const res = await fetch('/api/auth/quick-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: roleName })
      });
      if (res.ok) {
        const data = await res.json();
        setToken(data.token);
        setUser(data.user);
        localStorage.setItem('fs_token', data.token);
      }
    } catch (err) {
      console.error('Role switch failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const refreshUser = async () => {
    try {
      const res = await authFetch('/api/auth/me');
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
      }
    } catch (err) {
      console.error('Failed to refresh user:', err);
    }
  };

  useEffect(() => {
    loadCurrentUser();
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, loading, authFetch, switchRole, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
