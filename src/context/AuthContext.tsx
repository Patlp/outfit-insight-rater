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
  signUp: (email: string, password: string, requirePayment?: boolean) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  checkSubscription: (retryCount?: number) => Promise<boolean>;
  createCheckoutSession: () => Promise<void>;
  openCustomerPortal: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [justSignedUp, setJustSignedUp] = useState(false);
  const [subscription, setSubscription] = useState<SubscriptionInfo>({
    subscribed: false,
    subscription_tier: null,
    subscription_end: null,
    isChecking: false,
    lastChecked: null
  });

  const checkSubscription = useCallback(async (retryCount = 0): Promise<boolean> => {
    if (!session) return false;

    setSubscription(prev => ({ ...prev, isChecking: true }));

    try {
      const { data, error } = await supabase.functions.invoke('check-subscription', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) {
        console.error('Error checking subscription:', error);
        
        // Retry logic for network errors
        if (retryCount < 3 && error.message?.includes('network')) {
          console.log(`Retrying subscription check (${retryCount + 1}/3)...`);
          await new Promise(resolve => setTimeout(resolve, 2000));
          return checkSubscription(retryCount + 1);
        }
        
        setSubscription(prev => ({ 
          ...prev, 
          isChecking: false,
          lastChecked: new Date()
        }));
        return false;
      }

      const isSubscribed = data.subscribed || false;
      setSubscription({
        subscribed: isSubscribed,
        subscription_tier: data.subscription_tier || null,
        subscription_end: data.subscription_end || null,
        isChecking: false,
        lastChecked: new Date()
      });

      return isSubscribed;
    } catch (error) {
      console.error('Error checking subscription:', error);
      setSubscription(prev => ({ 
        ...prev, 
        isChecking: false,
        lastChecked: new Date()
      }));
      return false;
    }
  }, [session]);

  const createCheckoutSession = useCallback(async () => {
    if (!session) {
      throw new Error('User must be logged in to subscribe');
    }

    try {
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) {
        throw error;
      }

      // Open Stripe checkout in a new tab
      window.open(data.url, '_blank');
    } catch (error) {
      console.error('Error creating checkout session:', error);
      throw error;
    }
  }, [session]);

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription: authSubscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
        
        // Check subscription when user logs in
        if (session?.user && event === 'SIGNED_IN') {
          setTimeout(() => {
            checkSubscription();
          }, 0);
          
          // For new users who just signed up, redirect to payment
          if (justSignedUp) {
            setTimeout(async () => {
              try {
                const hasSubscription = await checkSubscription();
                if (!hasSubscription) {
                  console.log('New user detected, redirecting to payment...');
                  await createCheckoutSession();
                }
                setJustSignedUp(false); // Reset the flag
              } catch (checkoutError) {
                console.error('Failed to create checkout session after signup:', checkoutError);
                setJustSignedUp(false); // Reset the flag even on error
              }
            }, 3000); // Wait longer to ensure session and subscription check are complete
          }
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
      
      // Check subscription for existing session
      if (session?.user) {
        setTimeout(() => {
          checkSubscription();
        }, 0);
      }
    });

    // Check for subscription status in URL params (for successful payments)
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('subscription') === 'success') {
      // Clear the URL parameter and redirect to payment success page
      window.history.replaceState({}, document.title, '/payment-success');
      window.location.href = '/payment-success';
    }

    return () => authSubscription.unsubscribe();
  }, [justSignedUp, checkSubscription, createCheckoutSession]); // Add functions as dependencies

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  const signUp = async (email: string, password: string, requirePayment = true) => {
    const redirectUrl = `${window.location.origin}/`;
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl
      }
    });
    
    // If signup is successful and payment is required, set flag for payment redirect
    if (!error && requirePayment) {
      setJustSignedUp(true);
      console.log('Signup successful, will redirect to payment once session is established');
    }
    
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