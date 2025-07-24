import { useState, useEffect, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Loader2, CheckCircle, XCircle, RefreshCw, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { useErrorRecovery } from "@/hooks/useErrorRecovery";

type VerificationStage = 
  | "verifying" 
  | "payment-confirmed" 
  | "setting-up" 
  | "ready" 
  | "failed" 
  | "pending";

interface VerificationState {
  stage: VerificationStage;
  attempts: number;
  nextRetryIn: number;
  progress: number;
  message: string;
  customerEmail?: string;
  errorType?: "not-found" | "pending" | "network" | "unknown";
}

const STORAGE_KEY = "payment-verification-state";
const MAX_RETRIES = 6;
const INITIAL_RETRY_DELAY = 2000; // 2 seconds
const MAX_RETRY_DELAY = 30000; // 30 seconds
const GRACE_PERIOD = 45000; // 45 seconds total grace period

const SignupFromPayment = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { signUp } = useAuth();
  const { retryWithBackoff } = useErrorRecovery();
  
  const [sessionId] = useState(searchParams.get("session_id"));
  const [verificationState, setVerificationState] = useState<VerificationState>(() => {
    // Try to restore state from session storage
    if (typeof window !== 'undefined') {
      const stored = sessionStorage.getItem(STORAGE_KEY);
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          // Reset certain values on page load
          return {
            ...parsed,
            nextRetryIn: 0,
            progress: 0
          };
        } catch {
          // Fall back to default state if parsing fails
        }
      }
    }
    
    return {
      stage: "verifying" as VerificationStage,
      attempts: 0,
      nextRetryIn: 0,
      progress: 0,
      message: "Verifying your payment...",
      errorType: undefined
    };
  });
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isCreatingAccount, setIsCreatingAccount] = useState(false);
  const [error, setError] = useState("");

  // Persist state to session storage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(verificationState));
    }
  }, [verificationState]);

  const updateVerificationState = useCallback((updates: Partial<VerificationState>) => {
    setVerificationState(prev => ({ ...prev, ...updates }));
  }, []);

  const calculateRetryDelay = (attemptNumber: number): number => {
    const delay = Math.min(INITIAL_RETRY_DELAY * Math.pow(1.5, attemptNumber), MAX_RETRY_DELAY);
    return Math.floor(delay);
  };

  const verifyPayment = useCallback(async (attemptNumber: number = 0): Promise<boolean> => {
    try {
      updateVerificationState({
        attempts: attemptNumber + 1,
        message: attemptNumber === 0 
          ? "Verifying your payment..." 
          : `Verification attempt ${attemptNumber + 1}...`
      });

      const { data, error } = await supabase.functions.invoke('verify-payment', {
        body: { sessionId }
      });

      if (error) throw error;

      if (data.valid) {
        updateVerificationState({
          stage: "payment-confirmed",
          message: "Payment confirmed! Setting up your account...",
          progress: 70,
          customerEmail: data.email
        });
        
        setEmail(data.email || "");
        
        // Simulate account setup progress
        setTimeout(() => {
          updateVerificationState({
            stage: "ready",
            message: "Account ready! Please create your password.",
            progress: 100
          });
        }, 1500);
        
        return true;
      } else {
        // Payment not found or not ready yet
        if (attemptNumber < MAX_RETRIES) {
          const delay = calculateRetryDelay(attemptNumber);
          updateVerificationState({
            stage: "pending",
            nextRetryIn: delay / 1000,
            message: `Payment processing... Retrying in ${Math.ceil(delay / 1000)} seconds`,
            errorType: "pending"
          });
          
          // Start countdown
          const countdownInterval = setInterval(() => {
            setVerificationState(prev => {
              const newCountdown = prev.nextRetryIn - 1;
              if (newCountdown <= 0) {
                clearInterval(countdownInterval);
                return prev;
              }
              return {
                ...prev,
                nextRetryIn: newCountdown,
                message: `Payment processing... Retrying in ${newCountdown} seconds`
              };
            });
          }, 1000);
          
          setTimeout(() => {
            clearInterval(countdownInterval);
            verifyPayment(attemptNumber + 1);
          }, delay);
          
          return false;
        } else {
          throw new Error("Payment verification failed after maximum retries");
        }
      }
    } catch (error: any) {
      console.error(`Payment verification attempt ${attemptNumber + 1} failed:`, error);
      
      if (attemptNumber < MAX_RETRIES) {
        const delay = calculateRetryDelay(attemptNumber);
        updateVerificationState({
          stage: "pending",
          nextRetryIn: delay / 1000,
          message: `Verification failed. Retrying in ${Math.ceil(delay / 1000)} seconds...`,
          errorType: "network"
        });
        
        // Start countdown
        const countdownInterval = setInterval(() => {
          setVerificationState(prev => {
            const newCountdown = prev.nextRetryIn - 1;
            if (newCountdown <= 0) {
              clearInterval(countdownInterval);
              return prev;
            }
            return {
              ...prev,
              nextRetryIn: newCountdown,
              message: `Verification failed. Retrying in ${newCountdown} seconds...`
            };
          });
        }, 1000);
        
        setTimeout(() => {
          clearInterval(countdownInterval);
          verifyPayment(attemptNumber + 1);
        }, delay);
        
        return false;
      } else {
        updateVerificationState({
          stage: "failed",
          message: "Unable to verify payment. Please try refreshing or contact support.",
          errorType: error.message?.includes("not found") ? "not-found" : "unknown"
        });
        return false;
      }
    }
  }, [sessionId, updateVerificationState]);

  const handleManualRefresh = useCallback(() => {
    updateVerificationState({
      stage: "verifying",
      attempts: 0,
      nextRetryIn: 0,
      progress: 10,
      message: "Refreshing verification status...",
      errorType: undefined
    });
    verifyPayment(0);
  }, [verifyPayment, updateVerificationState]);

  useEffect(() => {
    if (!sessionId) {
      updateVerificationState({
        stage: "failed",
        message: "No payment session found. Please make sure you came from a valid payment link.",
        errorType: "not-found"
      });
      return;
    }

    // Only start verification if we're in the initial state
    if (verificationState.stage === "verifying" && verificationState.attempts === 0) {
      // Small delay to show the UI has loaded
      const timer = setTimeout(() => {
        verifyPayment(0);
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [sessionId, verifyPayment, verificationState.stage, verificationState.attempts]);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setIsCreatingAccount(true);

    try {
      const { error } = await signUp(email, password, true); // fromPayment = true
      if (error) throw error;

      // Account created successfully - clear session storage and redirect to dashboard
      sessionStorage.removeItem(STORAGE_KEY);
      navigate("/dashboard");
    } catch (error: any) {
      setError(error.message || "Failed to create account");
    } finally {
      setIsCreatingAccount(false);
    }
  };

  const getStatusIcon = () => {
    switch (verificationState.stage) {
      case "verifying":
      case "pending":
        return <Loader2 className="h-8 w-8 animate-spin text-primary" />;
      case "payment-confirmed":
      case "setting-up":
        return <CheckCircle className="h-8 w-8 text-primary animate-pulse" />;
      case "ready":
        return <CheckCircle className="h-8 w-8 text-green-500" />;
      case "failed":
        return <XCircle className="h-8 w-8 text-destructive" />;
      default:
        return <Clock className="h-8 w-8 text-muted-foreground" />;
    }
  };

  const getStatusTitle = () => {
    switch (verificationState.stage) {
      case "verifying":
        return "Verifying Payment";
      case "payment-confirmed":
        return "Payment Confirmed! ✅";
      case "setting-up":
        return "Setting Up Account";
      case "ready":
        return "Account Ready! 🎉";
      case "pending":
        return "Processing Payment";
      case "failed":
        return verificationState.errorType === "not-found" 
          ? "Payment Session Not Found" 
          : "Payment Verification Issue";
      default:
        return "Payment Status";
    }
  };

  const getStatusDescription = () => {
    switch (verificationState.stage) {
      case "verifying":
        return "Please wait while we verify your payment...";
      case "payment-confirmed":
        return "Your payment has been confirmed! Setting up your premium account...";
      case "setting-up":
        return "Almost done! Configuring your account features...";
      case "ready":
        return "Your premium account is ready! Please create your password to complete setup.";
      case "pending":
        return "Your payment may still be processing. We'll keep checking automatically.";
      case "failed":
        return verificationState.errorType === "not-found"
          ? "We couldn't find your payment session. Please try making a payment again."
          : "We're having trouble verifying your payment. This usually resolves itself quickly.";
      default:
        return "Checking payment status...";
    }
  };

  // Show account creation form only when ready
  if (verificationState.stage === "ready") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 to-secondary/5">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4">
              {getStatusIcon()}
            </div>
            <CardTitle>{getStatusTitle()}</CardTitle>
            <CardDescription>
              {getStatusDescription()}
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleSignup} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  required
                  minLength={6}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm password"
                  required
                  minLength={6}
                />
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Button
                type="submit"
                className="w-full"
                disabled={isCreatingAccount}
              >
                {isCreatingAccount ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating Account...
                  </>
                ) : (
                  "Create Premium Account"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show verification status and progress
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 to-secondary/5">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4">
            {getStatusIcon()}
          </div>
          <CardTitle>{getStatusTitle()}</CardTitle>
          <CardDescription>
            {getStatusDescription()}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Progress bar for visual feedback */}
          {(verificationState.stage === "verifying" || 
            verificationState.stage === "payment-confirmed" || 
            verificationState.stage === "setting-up") && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Progress</span>
                <span>{Math.max(10, verificationState.progress)}%</span>
              </div>
              <Progress 
                value={Math.max(10, verificationState.progress)} 
                className="h-2"
              />
            </div>
          )}

          {/* Status message */}
          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-2">
              {verificationState.message}
            </p>
            
            {/* Attempt counter */}
            {verificationState.attempts > 0 && (
              <p className="text-xs text-muted-foreground">
                Attempt {verificationState.attempts} of {MAX_RETRIES + 1}
              </p>
            )}
          </div>

          {/* Countdown timer for retries */}
          {verificationState.nextRetryIn > 0 && verificationState.stage === "pending" && (
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>Next attempt in {verificationState.nextRetryIn}s</span>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex gap-2">
            {verificationState.stage === "failed" && (
              <>
                <Button 
                  onClick={handleManualRefresh}
                  variant="outline"
                  className="flex-1"
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Refresh Status
                </Button>
                <Button 
                  onClick={() => navigate("/")}
                  variant="default"
                  className="flex-1"
                >
                  Return Home
                </Button>
              </>
            )}
            
            {verificationState.stage === "pending" && verificationState.attempts < MAX_RETRIES && (
              <Button 
                onClick={handleManualRefresh}
                variant="outline"
                className="w-full"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Check Now
              </Button>
            )}
          </div>

          {/* Support info for failed states */}
          {verificationState.stage === "failed" && (
            <div className="pt-2 border-t">
              <p className="text-xs text-muted-foreground text-center">
                Still having issues? Contact support with your payment session ID.
              </p>
              {sessionId && (
                <p className="text-xs text-muted-foreground text-center mt-1 break-all">
                  Session: {sessionId.slice(-10)}...
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SignupFromPayment;