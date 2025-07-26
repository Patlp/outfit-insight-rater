import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface SubscriptionInfo {
  subscribed: boolean;
  subscription_tier: string | null;
  subscription_end: string | null;
  isChecking: boolean;
  lastChecked: Date | null;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  subscription: SubscriptionInfo;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, fromPayment?: boolean) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  checkSubscription: (retryCount?: number) => Promise<boolean>;
  createCheckoutSession: (email: string) => Promise<void>;
  openCustomerPortal: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  
  const [subscription, setSubscription] = useState<SubscriptionInfo>({
    subscribed: false,
    subscription_tier: null,
    subscription_end: null,
    isChecking: false,
    lastChecked: null
  });

  const checkSubscription = useCallback(async (retryCount = 0): Promise<boolean> => {
    // Business logic: All logged-in users are premium subscribers
    if (!session) {
      setSubscription({
        subscribed: false,
        subscription_tier: null,
        subscription_end: null,
        isChecking: false,
        lastChecked: new Date()
      });
      return false;
    }

    // Prevent too frequent checks - only check if last check was more than 30 seconds ago
    const now = new Date();
    if (subscription.lastChecked && (now.getTime() - subscription.lastChecked.getTime()) < 30000) {
      return subscription.subscribed;
    }

    setSubscription(prev => ({ ...prev, isChecking: true }));

    // All logged-in users are premium
    setSubscription({
      subscribed: true,
      subscription_tier: 'Premium',
      subscription_end: null, // Premium for life while logged in
      isChecking: false,
      lastChecked: new Date()
    });

    return true;
  }, [session, subscription.lastChecked, subscription.subscribed]);

  const createCheckoutSession = useCallback(async (email: string) => {
    console.log('🚀 [DEBUG] createCheckoutSession called with email:', email);
    
    if (!email || !email.trim()) {
      console.error('❌ [DEBUG] Email validation failed:', email);
      throw new Error('Email is required for checkout');
    }

    try {
      console.log('📡 [DEBUG] Invoking create-checkout edge function...');
      
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: { email: email.trim() }
      });

      console.log('📡 [DEBUG] Edge function response:', { data, error });

      if (error) {
        console.error('❌ [DEBUG] Edge function returned error:', error);
        throw error;
      }

      if (!data?.url) {
        console.error('❌ [DEBUG] No checkout URL returned from edge function:', data);
        throw new Error('No checkout URL received');
      }

      console.log('✅ [DEBUG] Redirecting to checkout URL:', data.url);
      
      // Open Stripe checkout in the same tab (not new tab) for payment flow
      window.location.href = data.url;
    } catch (error) {
      console.error('❌ [DEBUG] Error in createCheckoutSession:', error);
      toast.error('Failed to start payment process. Please try again.');
      throw error;
    }
  }, []);

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription: authSubscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
        
        // All logged-in users are premium subscribers
        if (session?.user && event === 'SIGNED_IN') {
          console.log('User signed in - automatically premium');
          setSubscription({
            subscribed: true,
            subscription_tier: 'Premium',
            subscription_end: null,
            isChecking: false,
            lastChecked: new Date()
          });
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
      
      // Set premium status for existing session
      if (session?.user) {
        setSubscription({
          subscribed: true,
          subscription_tier: 'Premium',
          subscription_end: null,
          isChecking: false,
          lastChecked: new Date()
        });
      }
    });

    // Check for subscription status in URL params (for successful payments)
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('subscription') === 'success') {
      // Clear the URL parameter and redirect to payment success page
      window.history.replaceState({}, document.title, '/payment-success');
      // Use router navigation instead of direct window.location.href
      setTimeout(() => {
        window.location.href = '/payment-success';
      }, 100);
    }

    return () => authSubscription.unsubscribe();
  }, [checkSubscription]); // Add functions as dependencies

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  const signUp = async (email: string, password: string, fromPayment = false) => {
    const redirectUrl = `${window.location.origin}/`;
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          fromPayment: fromPayment // Track payment users but allow regular signup too
        }
      }
    });
    
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setSubscription({
      subscribed: false,
      subscription_tier: null,
      subscription_end: null,
      isChecking: false,
      lastChecked: null
    });
  };


  const openCustomerPortal = async () => {
    if (!session) {
      throw new Error('User must be logged in to manage subscription');
    }

    try {
      const { data, error } = await supabase.functions.invoke('customer-portal', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) {
        throw error;
      }

      // Open customer portal in a new tab
      window.open(data.url, '_blank');
    } catch (error) {
      console.error('Error opening customer portal:', error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        subscription,
        signIn,
        signUp,
        signOut,
        checkSubscription,
        createCheckoutSession,
        openCustomerPortal,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};