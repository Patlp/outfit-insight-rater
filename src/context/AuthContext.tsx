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

    // Prevent too frequent checks - only check if last check was more than 30 seconds ago
    const now = new Date();
    if (subscription.lastChecked && (now.getTime() - subscription.lastChecked.getTime()) < 30000) {
      return subscription.subscribed;
    }

    setSubscription(prev => ({ ...prev, isChecking: true }));

    try {
      const { data, error } = await supabase.functions.invoke('check-subscription', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) {
        console.error('Error checking subscription:', error);
        
        // Don't retry on errors - just fail silently for the homepage
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
  }, [session, subscription.lastChecked, subscription.subscribed]);

  const createCheckoutSession = useCallback(async () => {
    // Direct redirect to Stripe payment link
    window.open('https://buy.stripe.com/9B6cN5cVQ7KlgWd5mV3cc01', '_blank');
  }, []);

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
      // Use router navigation instead of direct window.location.href
      setTimeout(() => {
        window.location.href = '/payment-success';
      }, 100);
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

  const signUp = async (email: string, password: string, fromPayment = false) => {
    // Only allow signup if it's from a payment verification
    if (!fromPayment) {
      return { error: { message: 'Account creation requires premium subscription. Please complete payment first.' } };
    }

    const redirectUrl = `${window.location.origin}/`;
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl
      }
    });
    
    // If signup is from payment, the user already has premium access
    if (!error && fromPayment) {
      console.log('Account created from payment - automatically premium');
      setSubscription({
        subscribed: true,
        subscription_tier: 'Premium',
        subscription_end: null,
        isChecking: false,
        lastChecked: new Date()
      });
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