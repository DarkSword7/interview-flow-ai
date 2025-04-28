import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";
import { useState } from "react";
import { Link } from "react-router-dom";

const Navbar = () => {
  const isMobile = useIsMobile();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <nav className="bg-background/80 backdrop-blur-md py-4 sticky top-0 z-50 border-b border-border">
      <div className="container mx-auto px-4 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-interview-blue to-interview-purple rounded-lg"></div>
          <span className="text-xl font-bold gradient-text">AI Interviewer</span>
        </Link>

        {!isMobile ? (
          <div className="flex gap-8">
            <div className="flex items-center gap-6">
              <Link to="/" className="text-foreground/80 hover:text-interview-blue transition-colors">
                Home
              </Link>
              <Link to="#features" className="text-foreground/80 hover:text-interview-blue transition-colors">
                Features
              </Link>
              <Link to="#pricing" className="text-foreground/80 hover:text-interview-blue transition-colors">
                Pricing
              </Link>
            </div>
            <div className="flex items-center gap-4">
              <Button variant="outline" asChild>
                <Link to="/login">Login</Link>
              </Button>
              <Button className="bg-interview-blue hover:bg-interview-indigo" asChild>
                <Link to="/signup">Sign Up</Link>
              </Button>
            </div>
          </div>
        ) : (
          <>
            <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="p-2 text-foreground">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                {isMenuOpen ? (
                  <path d="M18 6L6 18M6 6l12 12" />
                ) : (
                  <path d="M4 12h16M4 6h16M4 18h16" />
                )}
              </svg>
            </button>
            
            {isMenuOpen && (
              <div className="absolute top-full left-0 right-0 bg-background border-b border-border shadow-lg animate-fade-in-down p-4">
                <div className="flex flex-col gap-4">
                  <Link to="/" className="text-foreground/80 hover:text-interview-blue transition-colors">
                    Home
                  </Link>
                  <Link to="#features" className="text-foreground/80 hover:text-interview-blue transition-colors">
                    Features
                  </Link>
                  <Link to="#pricing" className="text-foreground/80 hover:text-interview-blue transition-colors">
                    Pricing
                  </Link>
                  <div className="flex flex-col gap-2 pt-2 border-t border-border">
                    <Button variant="outline" asChild className="w-full">
                      <Link to="/login">Login</Link>
                    </Button>
                    <Button className="bg-interview-blue hover:bg-interview-indigo w-full" asChild>
                      <Link to="/signup">Sign Up</Link>
                    </Button>
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
