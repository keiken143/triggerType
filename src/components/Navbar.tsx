import { Button } from "@/components/ui/button";
import { Code, BarChart3, Users, Fingerprint, User } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

export const Navbar = () => {
  const location = useLocation();
  const { user, signOut } = useAuth();

  const navItems = [
    { name: "Home", href: "/", icon: Code },
    { name: "Type", href: "/type", icon: Code },
    { name: "Progressboard", href: "/progressboard", icon: BarChart3 },
    { name: "Profile", href: "/profile", icon: User },
  ];

  return (
    <nav className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-md border-b border-border">
      <div className="container mx-auto px-6 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center space-x-2">
          <div className="text-2xl font-bold">
            <span className="text-foreground">Trig</span>
            <span className="text-primary">Type</span>
          </div>
        </Link>

        <div className="hidden md:flex items-center space-x-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.href;
            const isProgressboard = item.name === "Progressboard";
            
            return (
              <Link key={item.name} to={item.href}>
                <Button
                  variant={isActive ? "default" : "ghost"}
                  size="sm"
                  className={`flex items-center space-x-2 transition-all duration-300 ${
                    isProgressboard 
                      ? `relative overflow-hidden group
                         ${isActive 
                           ? 'bg-gradient-to-r from-primary to-secondary-glow text-primary-foreground shadow-lg shadow-primary/30' 
                           : 'hover:bg-gradient-to-r hover:from-primary/10 hover:to-secondary-glow/10 hover:shadow-md hover:shadow-primary/20 hover:scale-105'
                         }
                         before:absolute before:inset-0 before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent 
                         before:translate-x-[-100%] before:transition-transform before:duration-700 
                         hover:before:translate-x-[100%]`
                      : ''
                  }`}
                >
                  <Icon className={`w-4 h-4 transition-transform duration-300 ${
                    isProgressboard && !isActive ? 'group-hover:rotate-12 group-hover:scale-110' : ''
                  }`} />
                  <span className={isProgressboard && isActive ? 'font-semibold' : ''}>{item.name}</span>
                  {isProgressboard && (
                    <div className="absolute -top-1 -right-1 w-2 h-2 bg-secondary-glow rounded-full animate-pulse" />
                  )}
                </Button>
              </Link>
            );
          })}
        </div>

        <div className="flex items-center space-x-3">
          {user ? (
            <div className="flex items-center space-x-4">
              <span className="text-sm text-muted-foreground">
                Welcome, {user.email}
              </span>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={signOut}
                className="text-muted-foreground hover:text-primary"
              >
                Sign Out
              </Button>
            </div>
          ) : (
            <>
              <Link to="/login">
                <Button variant="outline" size="sm">
                  Login
                </Button>
              </Link>
              <Link to="/signup">
                <Button variant="glow" size="sm">
                  Sign Up
                </Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;