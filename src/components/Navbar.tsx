import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Code, BarChart3, User, Menu, Keyboard, Shield, Users } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Logo } from "@/components/ui/Logo";
import { ModeTabs } from "@/components/ui/ModeTabs";
import { PillButton } from "@/components/ui/PillButton";
import { ThemeToggle } from "@/components/ThemeToggle";
import { toast } from "sonner";

export const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
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
    { id: "/", label: <span className="flex items-center gap-2"><Code className="w-4 h-4" />Home</span> },
    { id: "/type", label: <span className="flex items-center gap-2"><Keyboard className="w-4 h-4" />Type</span> },
    { id: "/multiplayer", label: <span className="flex items-center gap-2"><Shield className="w-4 h-4" />Multiplayer</span> },
    { id: "/friends", label: <span className="flex items-center gap-2"><Users className="w-4 h-4" />Friends</span> },
    { id: "/progressboard", label: <span className="flex items-center gap-2"><BarChart3 className="w-4 h-4" />Progress</span> },
    { id: "/profile", label: <span className="flex items-center gap-2"><User className="w-4 h-4" />Profile</span> },
  ];

  const handleNav = (tabId: string) => {
    const restricted = ['/progressboard', '/profile', '/friends', '/multiplayer'];
    if (restricted.includes(tabId) && !user) {
      toast.error("Please Login", {
        description: "You need to be logged in to access " + tabId.replace('/', ''),
        action: {
          label: "Login",
          onClick: () => navigate("/login")
        }
      });
      return;
    }
    navigate(tabId);
    setIsOpen(false);
  };

  return (
    <nav className="fixed top-0 w-full z-50 bg-background/60 backdrop-blur-md border-b border-border/50 transition-all duration-300">
      <div className="mx-auto max-w-screen-2xl px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center space-x-3 group">
          <Logo className="w-8 h-8 group-hover:scale-110 transition-transform duration-300" />
          <div className="text-xl sm:text-2xl font-bold tracking-tight">
            <span className="text-foreground">Trig</span>
            <span className="text-muted-foreground">Type</span>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center">
          <ModeTabs
            tabs={navItems}
            activeTab={location.pathname}
            onChange={handleNav}
            layoutId="navbar-tabs"
            className="bg-transparent border-none"
            tabClassName="py-1"
          />
        </div>

        {/* Desktop User Section */}
        <div className="hidden md:flex items-center space-x-3">
          <ThemeToggle />
          {user ? (
            <div className="flex items-center space-x-3">
              <Link to="/profile" className="flex items-center space-x-2 group">
                <Avatar className="w-8 h-8 border border-border/50 group-hover:border-primary/30 transition-colors">
                  <AvatarImage src={profile?.avatar_url} alt={profile?.display_name || user.email} />
                  <AvatarFallback className="bg-muted text-foreground text-xs">
                    {(profile?.display_name || user.email)?.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors truncate max-w-[120px]">
                  {profile?.display_name || profile?.username || user.email?.split('@')[0]}
                </span>
              </Link>
              <PillButton variant="ghost" size="sm" onClick={signOut}>
                Sign Out
              </PillButton>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <Link to="/login">
                <PillButton variant="ghost" size="sm">Login</PillButton>
              </Link>
              <Link to="/signup">
                <PillButton variant="outline" size="sm">Sign Up</PillButton>
              </Link>
            </div>
          )}
        </div>

        {/* Mobile Menu */}
        <div className="md:hidden flex items-center space-x-2">
          <ThemeToggle />
          {user && (
            <Link to="/profile">
              <Avatar className="w-8 h-8 border border-border/50">
                <AvatarImage src={profile?.avatar_url} />
                <AvatarFallback className="bg-muted text-foreground text-xs">
                  {(profile?.display_name || user.email)?.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </Link>
          )}

          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <PillButton variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
                <Menu className="w-5 h-5" />
              </PillButton>
            </SheetTrigger>
            <SheetContent side="right" className="w-64 pt-12 bg-background border-l border-border/50">
              <div className="flex flex-col space-y-2">
                {navItems.map((item) => (
                  <PillButton
                    key={item.id}
                    variant={location.pathname === item.id ? 'outline' : 'ghost'}
                    className="justify-start w-full"
                    onClick={() => handleNav(item.id)}
                  >
                    {item.label}
                  </PillButton>
                ))}
                {user ? (
                  <div className="pt-4 border-t border-border/50 mt-4">
                    <PillButton variant="outline" size="sm" className="w-full" onClick={() => { signOut(); setIsOpen(false); }}>
                      Sign Out
                    </PillButton>
                  </div>
                ) : (
                  <div className="pt-4 border-t border-border/50 mt-4 space-y-2">
                    <Link to="/login" onClick={() => setIsOpen(false)}>
                      <PillButton variant="ghost" size="sm" className="w-full">Login</PillButton>
                    </Link>
                    <Link to="/signup" onClick={() => setIsOpen(false)}>
                      <PillButton variant="outline" size="sm" className="w-full">Sign Up</PillButton>
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