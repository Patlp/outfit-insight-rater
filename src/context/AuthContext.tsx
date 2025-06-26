
import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { initiatePinterestAuth } from '@/services/pinterest/auth';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signInWithPinterest: () => Promise<{ error: any }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  console.log('🔧 AuthProvider initialized');

  useEffect(() => {
    console.log('🔧 AuthProvider useEffect running');
    
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('🔐 Auth state changed:', event, session?.user?.email || session?.user?.user_metadata?.user_name || 'no user');
        console.log('🔐 Session details:', session ? 'session exists' : 'no session');
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('🔍 Checking existing session:', session?.user?.email || session?.user?.user_metadata?.user_name || 'no session found');
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => {
      console.log('🔧 AuthProvider cleanup');
      subscription.unsubscribe();
    };
  }, []);

  const signUp = async (email: string, password: string) => {
    console.log('📧 Sign up attempt for:', email);
    const redirectUrl = `${window.location.origin}/`;
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl
      }
    });
    console.log('📧 Sign up result:', error ? 'error' : 'success');
    return { error };
  };

  const signIn = async (email: string, password: string) => {
    console.log('🔑 Sign in attempt for:', email);
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    console.log('🔑 Sign in result:', error ? 'error' : 'success');
    return { error };
  };

  const signInWithPinterest = async () => {
    console.log('📌 Pinterest OAuth initiated');
    try {
      await initiatePinterestAuth();
      console.log('📌 Pinterest OAuth call completed');
      return { error: null };
    } catch (error) {
      console.error('📌 Pinterest auth error:', error);
      return { error };
    }
  };

  const signOut = async () => {
    console.log('🚪 Sign out initiated in AuthContext');
    await supabase.auth.signOut();
    console.log('🚪 Sign out completed');
  };

  const value = {
    user,
    session,
    loading,
    signUp,
    signIn,
    signInWithPinterest,
    signOut,
  };

  console.log('🔧 AuthProvider rendering with user:', user ? 'authenticated' : 'not authenticated', 'loading:', loading);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
