import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Shield, Mail, Lock, ChevronLeft } from "lucide-react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/firebase";
import { useToast } from "@/components/ui/use-toast";
import { useRoleRedirect } from "@/hooks/useAuth";

const Login = () => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { toast } = useToast();
  const { currentUser, redirectToRoleDashboard } = useRoleRedirect();

  // Redirect if already logged in
  useEffect(() => {
    if (currentUser) {
      redirectToRoleDashboard(navigate);
    }
  }, [currentUser, navigate, redirectToRoleDashboard]);

  if (currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const { email, password } = formData;
      await signInWithEmailAndPassword(auth, email, password);
      // The auth state change listener in useAuth will handle the redirect
      toast({
        title: "Success!",
        description: "You have been logged in successfully.",
        variant: "default",
      });
    } catch (error: any) {
      console.error("Login error:", error);
      const errorMessage = error.code === 'auth/user-not-found' 
        ? 'No user found with this email.'
        : error.code === 'auth/wrong-password'
        ? 'Incorrect password.'
        : 'Failed to sign in. Please try again.';
      
      setError(errorMessage);
      toast({
        title: "Login failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-hero flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => navigate('/')}
          className="mb-4 -ml-2"
        >
          <ChevronLeft className="h-4 w-4 mr-1 text-white" /> Back to home
        </Button>
        
        <Card className="border-0 shadow-xl">
          <CardHeader className="space-y-1">
            <div className="flex justify-center">
              <div className="bg-primary rounded-full p-3">
                <Shield className="h-6 w-6 text-primary-foreground" />
              </div>
            </div>
            <div className="text-center space-y-2">
              <CardTitle className="text-2xl">Welcome back</CardTitle>
              <CardDescription>
                Enter your email and password to sign in to your account
              </CardDescription>
            </div>
          </CardHeader>
          
          <CardContent>
            {error && (
              <div className="bg-destructive/10 text-destructive p-3 rounded-md text-sm mb-4">
                {error}
              </div>
            )}
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <Input
                    id="email"
                    type="email"
                    placeholder="name@example.com"
                    className="pl-10"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    required
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  <Link
                    to="/forgot-password"
                    className="text-sm font-medium text-primary hover:underline"
                  >
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    className="pl-10"
                    value={formData.password}
                    onChange={(e) =>
                      setFormData({ ...formData, password: e.target.value })
                    }
                    required
                    disabled={isLoading}
                  />
                </div>
              </div>

              <Button type="submit" className="w-full mt-2" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Signing in...
                  </>
                ) : "Sign in"}
              </Button>
            </form>

            <div className="mt-6 text-center text-sm">
              <span className="text-muted-foreground">Don't have an account? </span>
              <Link 
                to="/signup" 
                className="text-primary hover:text-primary-light font-medium transition-colors"
              >
                Sign up here
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Login;