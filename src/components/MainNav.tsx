import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "./ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { auth } from "../firebase";
import { signOut } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { useToast } from "./ui/use-toast";

const MainNav = () => {
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setUser(user);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      navigate("/login");
      toast({
        title: "Signed out successfully",
        description: "You have been signed out.",
      });
    } catch (error) {
      console.error("Error signing out:", error);
      toast({
        title: "Error",
        description: "Failed to sign out. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Don't show nav on login/signup pages
  if (["/login", "/signup"].includes(location.pathname) || isLoading) {
    return null;
  }

  return (
    <header className="border-b">
      <div className="container flex h-16 items-center justify-between px-4">
        <div className="flex items-center space-x-6">
          <Link to="/" className="flex items-center space-x-2">
            <span className="text-xl font-bold">RoadGuard</span>
          </Link>
          <nav className="hidden space-x-6 text-sm font-medium md:flex">
            {user && (
              <>
                <Link
                  to={user.role === 'admin' ? '/admin' : user.role === 'mechanic' ? '/worker' : '/dashboard'}
                  className="transition-colors hover:text-primary"
                >
                  Dashboard
                </Link>
                {user.role === 'mechanic' && (
                  <Link to="/work-history" className="transition-colors hover:text-primary">
                    Work History
                  </Link>
                )}
                {user.role === 'admin' && (
                  <Link to="/admin/mechanics" className="transition-colors hover:text-primary">
                    Mechanics
                  </Link>
                )}
              </>
            )}
          </nav>
        </div>
        
        {user ? (
          <div className="flex items-center space-x-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user.photoURL || ""} alt={user.displayName || "User"} />
                    <AvatarFallback>
                      {user.displayName
                        ? user.displayName
                            .split(" ")
                            .map((n: string) => n[0])
                            .join("")
                        : user.email?.[0].toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {user.displayName || user.email}
                    </p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/profile">Profile</Link>
                </DropdownMenuItem>
                <DropdownMenuItem>Settings</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut}>
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ) : (
          <div className="flex items-center space-x-4">
            <Button variant="ghost" asChild>
              <Link to="/login">Sign in</Link>
            </Button>
            <Button asChild>
              <Link to="/signup">Sign up</Link>
            </Button>
          </div>
        )}
      </div>
    </header>
  );
};

export default MainNav;
