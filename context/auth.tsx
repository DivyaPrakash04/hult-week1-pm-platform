"use client";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { getSupabase } from "@/lib/supabase";

type AuthValue = { user: User | null; loading: boolean; signOut: () => Promise<void> };
const AuthContext = createContext<AuthValue>({ user: null, loading: true, signOut: async () => undefined });
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const supabase = getSupabase();
    if (!supabase) { setLoading(false); return; }
    supabase.auth.getSession().then(({ data }: { data: { session: Session | null } }) => { setUser(data.session?.user ?? null); setLoading(false); });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => { setUser(session?.user ?? null); setLoading(false); });
    return () => subscription.unsubscribe();
  }, []);
  const signOut = async () => { const supabase = getSupabase(); if (supabase) await supabase.auth.signOut(); setUser(null); };
  return <AuthContext.Provider value={{ user, loading, signOut }}>{children}</AuthContext.Provider>;
}
export const useAuth = () => useContext(AuthContext);
