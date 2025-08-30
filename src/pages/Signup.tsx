import { useState, useEffect } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Shield, User, Mail, Lock, Phone, Car, ChevronLeft } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { auth, db } from "../firebase";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";

type RoleType = 'user' | 'mechanic';

const Signup = () => {
  const { role } = useParams<{ role?: RoleType }>();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    vehicleType: "",
    vehicleMake: "",
    vehicleModel: "",
    role: (role as RoleType) || 'user'
  });

  // Update role when URL changes
  useEffect(() => {
    if (role && (role === 'user' || role === 'mechanic')) {
      setFormData(prev => ({
        ...prev,
        role
      }));
    }
  }, [role]);
  
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      toast({
        title: "Error",
        description: "Passwords don't match!",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      // 1. Create user in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        formData.email,
        formData.password
      );

      const user = userCredential.user;

      // 2. Store extra user info in Firestore
      await setDoc(doc(db, "users", user.uid), {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        role: formData.role,
        createdAt: new Date(),
        ...(formData.role === 'user' && {
          vehicle: {
            type: formData.vehicleType,
            make: formData.vehicleMake,
            model: formData.vehicleModel
          }
        })
      });

      toast({
        title: "Success!",
        description: "Account created successfully!",
        variant: "default"
      });

      // Redirect based on role
      const redirectPath = formData.role === 'mechanic' ? '/worker' : '/dashboard';
      navigate(redirectPath);

    } catch (error: any) {
      console.error("Signup error:", error);
      const errorMessage = error.code === 'auth/email-already-in-use'
        ? 'An account with this email already exists.'
        : 'Failed to create account. Please try again.';
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-hero flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="border-0 shadow-xl">
          <CardHeader className="space-y-1">
            <div className="flex items-center justify-between">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => navigate('/')}
                className="text-muted-foreground"
              >
                <ChevronLeft className="h-5 w-5" />
              </Button>
              <div className="flex-1 text-center">
                <CardTitle className="text-2xl">
                  {formData.role === 'mechanic' ? 'Become a Mechanic' : 'Create an Account'}
                </CardTitle>
              </div>
              <div className="w-10"></div> {/* Spacer for alignment */}
            </div>
            <CardDescription className="text-center">
              {formData.role === 'mechanic' 
                ? 'Join our network of trusted mechanics' 
                : 'Create your account to get help on the road'}
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="John Doe"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="+1 (555) 123-4567"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                    required
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="name@example.com"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="role">Account Type</Label>
                  <Select
                    value={formData.role}
                    onValueChange={(value: string) => 
                      setFormData({ ...formData, role: value as RoleType })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select account type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="user">User (Need Help)</SelectItem>
                      <SelectItem value="mechanic">Mechanic (Provide Help)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={(e) =>
                      setFormData({ ...formData, password: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="••••••••"
                    value={formData.confirmPassword}
                    onChange={(e) =>
                      setFormData({ ...formData, confirmPassword: e.target.value })
                    }
                    required
                  />
                </div>
              </div>
              
              {formData.role === 'user' && (
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="grid gap-2">
                    <Label htmlFor="vehicleMake">Vehicle Make</Label>
                    <Input
                      id="vehicleMake"
                      type="text"
                      placeholder="Toyota"
                      value={formData.vehicleMake}
                      onChange={(e) =>
                        setFormData({ ...formData, vehicleMake: e.target.value })
                      }
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="vehicleModel">Model</Label>
                    <Input
                      id="vehicleModel"
                      type="text"
                      placeholder="Camry"
                      value={formData.vehicleModel}
                      onChange={(e) =>
                        setFormData({ ...formData, vehicleModel: e.target.value })
                      }
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="vehicleType">Type</Label>
                    <Input
                      id="vehicleType"
                      type="text"
                      placeholder="Sedan"
                      value={formData.vehicleType}
                      onChange={(e) =>
                        setFormData({ ...formData, vehicleType: e.target.value })
                      }
                    />
                  </div>
                </div>
              )}

              <Button type="submit" className="w-full mt-2" disabled={isLoading}>
                {isLoading 
                  ? "Creating account..." 
                  : formData.role === 'mechanic' 
                    ? 'Join as Mechanic' 
                    : 'Create Account'}
              </Button>
              
              <p className="text-xs text-muted-foreground text-center mt-4">
                By creating an account, you agree to our{" "}
                <a href="#" className="text-primary hover:underline">
                  Terms of Service
                </a>{" "}
                and{" "}
                <a href="#" className="text-primary hover:underline">
                  Privacy Policy
                </a>.
              </p>
              
              <div className="relative mt-4">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">
                    Already have an account?
                  </span>
                </div>
              </div>
              
              <Button 
                variant="outline" 
                className="w-full mt-4"
                onClick={() => navigate('/login')}
                type="button"
              >
                Sign In
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Signup;