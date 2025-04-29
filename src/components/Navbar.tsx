import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";

const Navbar = () => {
  const isMobile = useIsMobile();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();

      if (error) {
        throw error;
      }

      toast({
        title: "Logged out successfully",
        description: "You have been logged out of your account",
      });

      navigate("/");
    } catch (error) {
      console.error("Error logging out:", error);
      toast({
        title: "Logout failed",
        description: "There was an error logging you out",
        variant: "destructive",
      });
    }
  };

  // Get user's initials for avatar fallback
  const getUserInitials = () => {
    if (!user?.user_metadata?.name) {
      return "U";
    }

    const nameParts = user.user_metadata.name.split(" ");
    if (nameParts.length >= 2) {
      return `${nameParts[0][0]}${nameParts[1][0]}`.toUpperCase();
    }

    return nameParts[0][0].toUpperCase();
  };

  return (
    <nav className="bg-white/80 backdrop-blur-md py-4 sticky top-0 z-50 shadow-sm">
      <div className="container mx-auto px-4 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-interview-blue to-interview-purple rounded-lg"></div>
          <span className="text-xl font-bold gradient-text">
            Interview Flow
          </span>
        </Link>

        {!isMobile ? (
          <div className="flex gap-8">
            <div className="flex items-center gap-6">
              <Link
                to="/"
                className="text-gray-700 hover:text-interview-blue transition-colors"
              >
                Home
              </Link>
              <Link
                to="#features"
                className="text-gray-700 hover:text-interview-blue transition-colors"
              >
                Features
              </Link>
              <Link
                to="#pricing"
                className="text-gray-700 hover:text-interview-blue transition-colors"
              >
                Pricing
              </Link>
            </div>
            <div className="flex items-center gap-4">
              {isAuthenticated ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Avatar className="h-10 w-10 cursor-pointer hover:ring-2 hover:ring-interview-blue transition-all">
                      <AvatarImage src={user?.user_metadata?.avatar_url} />
                      <AvatarFallback className="bg-interview-blue text-white">
                        {getUserInitials()}
                      </AvatarFallback>
                    </Avatar>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>My Account</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link to="/profile" className="w-full cursor-pointer">
                        Profile
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/interviews" className="w-full cursor-pointer">
                        My Interviews
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={handleLogout}
                      className="text-red-500 cursor-pointer"
                    >
                      Log out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <>
                  <Button variant="outline" asChild>
                    <Link to="/login">Login</Link>
                  </Button>
                  <Button
                    className="bg-interview-blue hover:bg-interview-indigo"
                    asChild
                  >
                    <Link to="/signup">Sign Up</Link>
                  </Button>
                </>
              )}
            </div>
          </div>
        ) : (
          <>
            <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="p-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                {isMenuOpen ? (
                  <path d="M18 6L6 18M6 6l12 12" />
                ) : (
                  <path d="M4 12h16M4 6h16M4 18h16" />
                )}
              </svg>
            </button>

            {isMenuOpen && (
              <div className="absolute top-full left-0 right-0 bg-white shadow-lg animate-fade-in-down p-4">
                <div className="flex flex-col gap-4">
                  <Link
                    to="/"
                    className="text-gray-700 hover:text-interview-blue transition-colors"
                  >
                    Home
                  </Link>
                  <Link
                    to="#features"
                    className="text-gray-700 hover:text-interview-blue transition-colors"
                  >
                    Features
                  </Link>
                  <Link
                    to="#pricing"
                    className="text-gray-700 hover:text-interview-blue transition-colors"
                  >
                    Pricing
                  </Link>
                  <div className="flex flex-col gap-2 pt-2 border-t">
                    {isAuthenticated ? (
                      <>
                        <Link
                          to="/profile"
                          className="text-gray-700 hover:text-interview-blue transition-colors"
                        >
                          Profile
                        </Link>
                        <Link
                          to="/interviews"
                          className="text-gray-700 hover:text-interview-blue transition-colors"
                        >
                          My Interviews
                        </Link>
                        <Button
                          onClick={handleLogout}
                          variant="destructive"
                          className="w-full mt-2"
                        >
                          Log out
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button variant="outline" asChild className="w-full">
                          <Link to="/login">Login</Link>
                        </Button>
                        <Button
                          className="bg-interview-blue hover:bg-interview-indigo w-full"
                          asChild
                        >
                          <Link to="/signup">Sign Up</Link>
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
