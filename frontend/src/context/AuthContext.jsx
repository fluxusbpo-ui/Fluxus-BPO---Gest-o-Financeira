import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../supabaseClient.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }){
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(()=>{
    let mounted = true;
    async function init(){
      const { data } = await supabase.auth.getSession();
      if (!mounted) return;
      setSession(data.session || null);
      setUser(data.session ? data.session.user : null);
      setLoading(false);
    }
    init();
    const { subscription } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session || null);
      setUser(session ? session.user : null);
    });
    return ()=>{ mounted = false; subscription?.unsubscribe(); };
  },[]);

  async function signUp({ email, password, options }){
    const { data, error } = await supabase.auth.signUp({ email, password }, options || {});
    if (error) throw error;
    return data;
  }

  async function signIn({ email, password }){
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  }

  async function signOut(){
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
  }

  return (
    <AuthContext.Provider value={{ user, session, loading, signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(){
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
