import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';

import { authApi } from '@/api';
import { onSessionExpired, tokens } from '@/lib/api';
import { isHrRole, ROLES } from '@/lib/constants';
import { runViewTransition } from '@/lib/pageTransition';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [status, setStatus] = useState(tokens.access ? 'loading' : 'anonymous');
  /* Profile of the person who just signed in, while the welcome screen shows. */
  const [welcome, setWelcome] = useState(null);

  const loadProfile = useCallback(async () => {
    try {
      const profile = await authApi.me();
      setUser(profile);
      setStatus('authenticated');
      return profile;
    } catch (err) {
      tokens.clear();
      setUser(null);
      setStatus('anonymous');
      throw err;
    }
  }, []);

  useEffect(() => {
    if (tokens.access) loadProfile().catch(() => {});
  }, [loadProfile]);

  useEffect(() => {
    onSessionExpired(() => {
      setUser(null);
      setStatus('anonymous');
      setWelcome(null);
      queryClient.clear();
    });
  }, [queryClient]);

  const login = useCallback(async (username, password) => {
    const result = await authApi.login(username, password);
    tokens.set({ access: result.access_token, refresh: result.refresh_token });
    let profile;
    try {
      profile = await authApi.me();
    } catch (err) {
      tokens.clear();
      setUser(null);
      setStatus('anonymous');
      throw err;
    }
    // Both requests are done; only the state swap runs inside the transition,
    // so the sign-in page dissolves into the welcome screen instead of cutting.
    await runViewTransition(() => {
      setUser(profile);
      setStatus('authenticated');
      setWelcome(profile);
    });
    return profile;
  }, []);

  const dismissWelcome = useCallback(() => setWelcome(null), []);

  const logout = useCallback(async () => {
    const refresh = tokens.refresh;
    tokens.clear();
    // The swap back to the sign-in page runs as a view transition - the portal
    // recedes, the sign-in page rises in and the sidebar logo glides to its top
    // bar - mirroring the way signing in arrived.
    await runViewTransition(() => {
      setUser(null);
      setStatus('anonymous');
      setWelcome(null);
      queryClient.clear();
      window.scrollTo(0, 0);
    });
    if (refresh) authApi.logout(refresh).catch(() => {});
  }, [queryClient]);

  const value = useMemo(() => {
    const role = user?.role;
    return {
      user,
      status,
      role,
      isHr: isHrRole(role),
      isSuperadmin: role === ROLES.SUPERADMIN,
      isEmployee: role === ROLES.EMPLOYEE,
      isAdmin: role === ROLES.ADMIN,
      displayName:
        [user?.first_name, user?.last_name].filter(Boolean).join(' ') || user?.username || '',
      login,
      logout,
      refreshProfile: loadProfile,
      welcome,
      dismissWelcome,
    };
  }, [user, status, login, logout, loadProfile, welcome, dismissWelcome]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
