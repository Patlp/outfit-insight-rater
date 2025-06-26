
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { AlertCircle, Mail, Lock, ExternalLink } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';

interface AuthModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const AuthModal: React.FC<AuthModalProps> = ({ open, onOpenChange }) => {
  const { signIn, signUp, signInWithPinterest } = useAuth();
  const [loading, setLoading] = useState(false);
  const [pinterestLoading, setPinterestLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [errors, setErrors] = useState<{[key: string]: string}>({});

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = (isSignUp: boolean = false) => {
    const newErrors: {[key: string]: string} = {};
    
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }
    
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    
    if (isSignUp && formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    
    setLoading(true);
    try {
      const { error } = await signIn(formData.email, formData.password);
      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          toast.error('Invalid email or password. Please check your credentials.');
        } else if (error.message.includes('Email not confirmed')) {
          toast.error('Please check your email and click the confirmation link.');
        } else {
          toast.error(error.message);
        }
      } else {
        toast.success('Welcome back!');
        onOpenChange(false);
      }
    } catch (error) {
      toast.error('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm(true)) return;
    
    setLoading(true);
    try {
      const { error } = await signUp(formData.email, formData.password);
      if (error) {
        if (error.message.includes('User already registered')) {
          toast.error('An account with this email already exists. Try signing in instead.');
        } else {
          toast.error(error.message);
        }
      } else {
        toast.success('Account created! Please check your email to confirm your account.');
        onOpenChange(false);
      }
    } catch (error) {
      toast.error('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handlePinterestLogin = async () => {
    setPinterestLoading(true);
    try {
      const { error } = await signInWithPinterest();
      if (error) {
        console.error('Pinterest OAuth error:', error);
        toast.error('Failed to connect with Pinterest. Please try again.');
      } else {
        // The redirect will happen automatically
        toast.info('Redirecting to Pinterest...');
      }
    } catch (error) {
      console.error('Pinterest login error:', error);
      toast.error('An unexpected error occurred. Please try again.');
    } finally {
      setPinterestLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Welcome to RateMyFit</DialogTitle>
          <DialogDescription>
            Sign in to save your outfits and connect with Pinterest
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Pinterest OAuth Button */}
          <Button
            onClick={handlePinterestLogin}
            disabled={pinterestLoading}
            className="w-full bg-red-600 hover:bg-red-700 text-white"
            size="lg"
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            {pinterestLoading ? 'Connecting...' : 'Continue with Pinterest'}
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <Separator className="w-full" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-gray-500">Or continue with email</span>
            </div>
          </div>

          {/* Email/Password Authentication */}
          <Tabs defaultValue="signin" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">Sign In</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>
            
            <TabsContent value="signin">
              <Card>
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg">Sign In</CardTitle>
                  <CardDescription>
                    Enter your email and password to access your account
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSignIn} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="signin-email">Email</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <Input
                          id="signin-email"
                          type="email"
                          placeholder="Enter your email"
                          value={formData.email}
                          onChange={(e) => handleInputChange('email', e.target.value)}
                          className={`pl-10 ${errors.email ? 'border-red-500' : ''}`}
                          disabled={loading}
                        />
                      </div>
                      {errors.email && (
                        <div className="flex items-center text-sm text-red-600">
                          <AlertCircle className="w-3 h-3 mr-1" />
                          {errors.email}
                        </div>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="signin-password">Password</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <Input
                          id="signin-password"
                          type="password"
                          placeholder="Enter your password"
                          value={formData.password}
                          onChange={(e) => handleInputChange('password', e.target.value)}
                          className={`pl-10 ${errors.password ? 'border-red-500' : ''}`}
                          disabled={loading}
                        />
                      </div>
                      {errors.password && (
                        <div className="flex items-center text-sm text-red-600">
                          <AlertCircle className="w-3 h-3 mr-1" />
                          {errors.password}
                        </div>
                      )}
                    </div>
                    
                    <Button type="submit" className="w-full" disabled={loading}>
                      {loading ? 'Signing In...' : 'Sign In'}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="signup">
              <Card>
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg">Create Account</CardTitle>
                  <CardDescription>
                    Create a new account to start rating your outfits
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSignUp} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="signup-email">Email</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <Input
                          id="signup-email"
                          type="email"
                          placeholder="Enter your email"
                          value={formData.email}
                          onChange={(e) => handleInputChange('email', e.target.value)}
                          className={`pl-10 ${errors.email ? 'border-red-500' : ''}`}
                          disabled={loading}
                        />
                      </div>
                      {errors.email && (
                        <div className="flex items-center text-sm text-red-600">
                          <AlertCircle className="w-3 h-3 mr-1" />
                          {errors.email}
                        </div>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="signup-password">Password</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <Input
                          id="signup-password"
                          type="password"
                          placeholder="Create a password"
                          value={formData.password}
                          onChange={(e) => handleInputChange('password', e.target.value)}
                          className={`pl-10 ${errors.password ? 'border-red-500' : ''}`}
                          disabled={loading}
                        />
                      </div>
                      {errors.password && (
                        <div className="flex items-center text-sm text-red-600">
                          <AlertCircle className="w-3 h-3 mr-1" />
                          {errors.password}
                        </div>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="confirm-password">Confirm Password</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <Input
                          id="confirm-password"
                          type="password"
                          placeholder="Confirm your password"
                          value={formData.confirmPassword}
                          onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                          className={`pl-10 ${errors.confirmPassword ? 'border-red-500' : ''}`}
                          disabled={loading}
                        />
                      </div>
                      {errors.confirmPassword && (
                        <div className="flex items-center text-sm text-red-600">
                          <AlertCircle className="w-3 h-3 mr-1" />
                          {errors.confirmPassword}
                        </div>
                      )}
                    </div>
                    
                    <Button type="submit" className="w-full" disabled={loading}>
                      {loading ? 'Creating Account...' : 'Create Account'}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AuthModal;
