import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { User } from '@supabase/supabase-js';
import { useQueryClient } from '@tanstack/react-query';
import { useNavigate, useRouter } from '@tanstack/react-router';
import { supabase } from '@/integrations/supabase/client';

/** True only when a backend is configured (e.g. running inside Lovable). Personal installs have none. */
export const hasBackend = Boolean(import.meta.env['VITE_SUPABASE_URL']);

const AuthContext = createContext<{ user: User | null; loading: boolean; signOut: () => Promise<void> }>({ user: null, loading: false, signOut: async () => {} });

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(hasBackend);
  const queryClient = useQueryClient();
  const router = useRouter();
  const navigate = useNavigate();
  useEffect(() => {
    if (!hasBackend) return; // No backend configured: stay signed out, never touch the client.
    let alive = true;
    let revision = 0;
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!['SIGNED_IN', 'SIGNED_OUT', 'USER_UPDATED'].includes(event)) return;
      revision++;
      setUser(session?.user ?? null);
      setLoading(false);
      void router.invalidate();
      if (event !== 'SIGNED_OUT') void queryClient.invalidateQueries();
    });
    const initialRevision = revision;
    void supabase.auth.getUser().then(({ data }) => {
      if (alive && initialRevision === revision) { setUser(data.user); setLoading(false); }
    }).catch(() => { if (alive) setLoading(false); });
    return () => { alive = false; subscription.unsubscribe(); };
  }, [queryClient, router]);
  const signOut = async () => {
    if (!hasBackend) { await navigate({ to: '/auth', replace: true }); return; }
    await queryClient.cancelQueries();
    queryClient.clear();
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    await navigate({ to: '/auth', replace: true });
  };
  return <AuthContext.Provider value={{ user, loading, signOut }}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
