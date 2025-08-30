import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useToast } from "@/components/ui/use-toast";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { NotificationsProvider } from "@/contexts/NotificationsContext";
import { BrowserRouter, Routes, Route, Navigate, Outlet, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import MainNav from "./components/MainNav";
import { useRoleRedirect, useAuth } from "./hooks/useAuth";

// Pages
import Index from "./pages/Index";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import WorkerDashboard from "./pages/WorkerDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import Profile from "./pages/Profile";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

// Protected Route Component
const ProtectedRoute = ({ 
  children, 
  requiredRole 
}: { 
  children: React.ReactNode; 
  requiredRole?: 'user' | 'mechanic' | 'admin';
}) => {
  const { currentUser, loading, getRedirectPath, redirectToRoleDashboard } = useRoleRedirect();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && currentUser) {
      // If user is logged in but doesn't have the required role, redirect
      if (requiredRole && currentUser.role !== requiredRole) {
        toast({
          title: "Access Denied",
          description: `You don't have permission to access this page.`,
          variant: "destructive",
        });
        redirectToRoleDashboard(navigate);
      }
    }
  }, [currentUser, loading, requiredRole, navigate, toast, redirectToRoleDashboard]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  // If no user is logged in, redirect to login
  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  // Check if the user has the required role if one is specified
  if (requiredRole && currentUser.role !== requiredRole) {
    return null; // Will be redirected by the useEffect
  }

  return <>{children}</>;
};

// Layout component with navigation
const Layout = () => (
  <div className="min-h-screen flex flex-col">
    <MainNav />
    <main className="flex-1">
      <Outlet />
    </main>
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <NotificationsProvider>
          <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/signup/:role" element={<Signup />} />
          
          {/* Protected Routes */}
          <Route element={<Layout />}>
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute requiredRole="user">
                  <Dashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/worker" 
              element={
                <ProtectedRoute requiredRole="mechanic">
                  <WorkerDashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin" 
              element={
                <ProtectedRoute requiredRole="admin">
                  <AdminDashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/profile" 
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              } 
            />
            <Route path="*" element={<NotFound />} />
          </Route>
          </Routes>
        </NotificationsProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
