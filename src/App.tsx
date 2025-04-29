import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  Outlet,
} from "react-router-dom";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import CreateInterview from "./pages/CreateInterview";
import Interview from "./pages/Interview"; // Import the new Interview page
import Feedback from "./pages/Feedback"; // Import the Feedback page
import NotFound from "./pages/NotFound";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import Profile from "./pages/Profile";
import MyInterviews from "./pages/MyInterviews";

const queryClient = new QueryClient();

// Protected route component
const ProtectedRoute = () => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    // You could render a loading spinner here
    return <div>Loading...</div>;
  }

  return isAuthenticated ? <Outlet /> : <Navigate to="/login" />;
};

// Public routes - redirect to home if already authenticated
const PublicRoute = () => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return !isAuthenticated ? <Outlet /> : <Navigate to="/" />;
};

const AppRoutes = () => (
  <Routes>
    <Route path="/" element={<Index />} />

    {/* Public routes (accessible only when NOT logged in) */}
    <Route element={<PublicRoute />}>
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
    </Route>

    {/* Protected routes (require authentication) */}
    <Route element={<ProtectedRoute />}>
      <Route path="/profile" element={<Profile />} />
      <Route path="/interviews" element={<MyInterviews />} />
      <Route path="/create-interview" element={<CreateInterview />} />
      <Route path="/interview/:topicId" element={<Interview />} />
      <Route path="/interview/:topicId/:difficulty" element={<Interview />} />
      <Route path="/feedback" element={<Feedback />} />
      {/* Add other protected routes here */}
    </Route>

    <Route path="*" element={<NotFound />} />
  </Routes>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
          <Toaster />
          <Sonner />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
