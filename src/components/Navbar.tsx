import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Code, BarChart3, Users, Fingerprint, User, Menu } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const Navbar = () => {
  const location = useLocation();
  const { user, signOut } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (user) {
      const fetchProfile = async () => {
        const { data } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();
        setProfile(data);
      };
      fetchProfile();
    }
  }, [user]);

  const navItems = [
    { name: "Home", href: "/", icon: Code },
    { name: "Type", href: "/type", icon: Code },
    { name: "Progressboard", href: "/progressboard", icon: BarChart3 },
    { name: "Profile", href: "/profile", icon: User },
  ];

  const renderNavItems = () => (
    <>
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = location.pathname === item.href;
        
        return (
          <Link key={item.name} to={item.href} onClick={() => setIsOpen(false)}>
            <Button
              variant={isActive ? "default" : "ghost"}
              size="sm"
              className={`w-full md:w-auto flex items-center space-x-2 transition-all duration-300 
                relative overflow-hidden group
                ${isActive 
                  ? 'bg-gradient-to-r from-primary to-secondary-glow text-primary-foreground shadow-lg shadow-primary/30' 
                  : 'hover:bg-gradient-to-r hover:from-primary/10 hover:to-secondary-glow/10 hover:shadow-md hover:shadow-primary/20 hover:scale-105'
                }
                before:absolute before:inset-0 before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent 
                before:translate-x-[-100%] before:transition-transform before:duration-700 
                hover:before:translate-x-[100%]`
              }
            >
              <Icon className={`w-4 h-4 transition-transform duration-300 ${
                !isActive ? 'group-hover:rotate-12 group-hover:scale-110' : ''
              }`} />
              <span className={isActive ? 'font-semibold' : ''}>{item.name}</span>
              {item.name === "Progressboard" && (
                <div className="absolute -top-1 -right-1 w-2 h-2 bg-secondary-glow rounded-full animate-pulse" />
              )}
            </Button>
          </Link>
        );
      })}
    </>
  );

  return (
    <nav className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-md border-b border-border">
      <div className="container mx-auto px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center space-x-2">
          <div className="text-xl sm:text-2xl font-bold">
            <span className="text-foreground">Trigger</span>
            <span className="text-primary">Type</span>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center space-x-1">
          {renderNavItems()}
        </div>

        {/* Desktop User Section */}
        <div className="hidden md:flex items-center space-x-3">
          {user ? (
            <div className="flex items-center space-x-3">
              <Link to="/profile" className="flex items-center space-x-2">
                <Avatar className="w-8 h-8 ring-2 ring-primary/20 hover:ring-primary/40 transition-all">
                  <AvatarImage src={profile?.avatar_url} alt={profile?.display_name || user.email} />
                  <AvatarFallback className="bg-primary/10 text-primary text-xs">
                    {(profile?.display_name || user.email)?.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm text-muted-foreground truncate max-w-[120px]">
                  {profile?.display_name || profile?.username || user.email?.split('@')[0]}
                </span>
              </Link>
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
            <div className="flex items-center space-x-2">
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
            </div>
          )}
        </div>

        {/* Mobile Menu */}
        <div className="md:hidden flex items-center space-x-2">
          {user && (
            <Link to="/profile">
              <Avatar className="w-8 h-8 ring-2 ring-primary/20">
                <AvatarImage src={profile?.avatar_url} alt={profile?.display_name || user.email} />
                <AvatarFallback className="bg-primary/10 text-primary text-xs">
                  {(profile?.display_name || user.email)?.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </Link>
          )}
          
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="sm" className="p-2">
                <Menu className="w-5 h-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-64 pt-12">
              <div className="flex flex-col space-y-4">
                {renderNavItems()}
                
                {user ? (
                  <div className="pt-4 border-t border-border">
                    <div className="flex items-center space-x-3 mb-4 p-2">
                      <Avatar className="w-10 h-10">
                        <AvatarImage src={profile?.avatar_url} alt={profile?.display_name || user.email} />
                        <AvatarFallback className="bg-primary/10 text-primary">
                          {(profile?.display_name || user.email)?.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {profile?.display_name || profile?.username || 'User'}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {user.email}
                        </p>
                      </div>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => {
                        signOut();
                        setIsOpen(false);
                      }}
                      className="w-full"
                    >
                      Sign Out
                    </Button>
                  </div>
                ) : (
                  <div className="pt-4 border-t border-border space-y-2">
                    <Link to="/login" onClick={() => setIsOpen(false)}>
                      <Button variant="outline" size="sm" className="w-full">
                        Login
                      </Button>
                    </Link>
                    <Link to="/signup" onClick={() => setIsOpen(false)}>
                      <Button variant="glow" size="sm" className="w-full">
                        Sign Up
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;