import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import Navbar from "@/components/Navbar";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  User, 
  Mail, 
  Calendar,
  Edit3,
  Save,
  X,
  Trophy,
  Target,
  Zap,
  Camera,
  Shield,
  ChevronRight,
  Keyboard,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";

interface UserProfile {
  id: string;
  user_id: string;
  display_name: string | null;
  username: string | null;
  avatar_url: string | null;
  created_at: string;
}

interface UserStats {
  totalTests: number;
  avgWpm: number;
  bestWpm: number;
}

const Profile = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [stats, setStats] = useState<UserStats>({ totalTests: 0, avgWpm: 0, bestWpm: 0 });
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    display_name: '',
    username: ''
  });
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (user) {
      fetchProfile();
      fetchUserStats();
    }
  }, [user]);

  const fetchProfile = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      if (error) { console.error('Error fetching profile:', error); return; }
      if (data) {
        setProfile(data);
        setEditForm({ display_name: data.display_name || '', username: data.username || '' });
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserStats = async () => {
    if (!user) return;
    try {
      const { data: tests, error } = await supabase
        .from('typing_tests')
        .select('wpm')
        .eq('user_id', user.id);
      if (error) { console.error('Error fetching user stats:', error); return; }
      if (tests && tests.length > 0) {
        const totalTests = tests.length;
        const avgWpm = Math.round(tests.reduce((sum, test) => sum + test.wpm, 0) / totalTests);
        const bestWpm = Math.max(...tests.map(test => test.wpm));
        setStats({ totalTests, avgWpm, bestWpm });
      }
    } catch (error) {
      console.error('Error fetching user stats:', error);
    }
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    try {
      const { data: existingProfile } = await supabase
        .from('profiles').select('id').eq('user_id', user.id).maybeSingle();
      let result;
      if (existingProfile) {
        result = await supabase.from('profiles').update({
          display_name: editForm.display_name, username: editForm.username
        }).eq('user_id', user.id);
      } else {
        result = await supabase.from('profiles').insert({
          user_id: user.id, display_name: editForm.display_name, username: editForm.username
        });
      }
      if (result.error) {
        toast({ title: "Error", description: "Failed to update profile.", variant: "destructive" });
        return;
      }
      toast({ title: "Profile updated", description: "Your changes have been saved." });
      setEditing(false);
      fetchProfile();
    } catch (error) {
      toast({ title: "Error", description: "Failed to update profile.", variant: "destructive" });
    }
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;
    if (!file.type.startsWith('image/')) {
      toast({ title: "Error", description: "Please select an image file.", variant: "destructive" });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "Error", description: "Image must be less than 5MB.", variant: "destructive" });
      return;
    }
    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/avatar.${fileExt}`;
      if (profile?.avatar_url) {
        const existingPath = profile.avatar_url.split('/').pop();
        if (existingPath) {
          await supabase.storage.from('avatars').remove([`${user.id}/${existingPath}`]);
        }
      }
      const { error: uploadError } = await supabase.storage.from('avatars').upload(fileName, file, { upsert: true });
      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(fileName);
      const { data: existingProfile } = await supabase.from('profiles').select('id').eq('user_id', user.id).maybeSingle();
      let updateResult;
      if (existingProfile) {
        updateResult = await supabase.from('profiles').update({ avatar_url: publicUrl }).eq('user_id', user.id);
      } else {
        updateResult = await supabase.from('profiles').insert({
          user_id: user.id, avatar_url: publicUrl, display_name: profile?.display_name, username: profile?.username
        });
      }
      if (updateResult.error) throw updateResult.error;
      toast({ title: "Updated", description: "Profile picture changed successfully." });
      fetchProfile();
    } catch (error) {
      toast({ title: "Error", description: "Failed to upload picture.", variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const getInitials = (name: string | null) => {
    if (!name) return user?.email?.charAt(0).toUpperCase() || 'U';
    return name.split(' ').map(n => n.charAt(0)).join('').toUpperCase();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric', month: 'long', day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 sm:px-6 pt-24 pb-12">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
          </div>
        </div>
      </div>
    );
  }

  const statItems = [
    { icon: Target, label: "Tests Completed", value: stats.totalTests, color: "text-primary", bg: "bg-primary/10" },
    { icon: Zap, label: "Average WPM", value: stats.avgWpm, color: "text-secondary-glow", bg: "bg-secondary-glow/10" },
    { icon: Trophy, label: "Best WPM", value: stats.bestWpm, color: "text-primary", bg: "bg-primary/10" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="fixed inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: "var(--pattern-grid)" }} />
      <Navbar />
      
      <div className="container mx-auto px-4 sm:px-6 pt-24 pb-12 max-w-4xl">
        {/* Profile Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="relative overflow-hidden border-border/30 bg-card/60 backdrop-blur-sm mb-6">
            {/* Banner */}
            <div className="h-32 bg-gradient-to-r from-primary/20 via-secondary-glow/10 to-primary/20 relative">
              <div className="absolute inset-0 bg-gradient-to-t from-card/80 to-transparent" />
            </div>
            
            <div className="px-6 pb-6 -mt-12 relative">
              <div className="flex flex-col sm:flex-row sm:items-end gap-4">
                {/* Avatar */}
                <div className="relative group">
                  <Avatar className="w-24 h-24 ring-4 ring-card shadow-xl">
                    <AvatarImage src={profile?.avatar_url || ''} />
                    <AvatarFallback className="text-2xl bg-primary/10 text-primary font-bold">
                      {getInitials(profile?.display_name)}
                    </AvatarFallback>
                  </Avatar>
                  <label
                    htmlFor="avatar-upload"
                    className="absolute inset-0 flex items-center justify-center bg-background/60 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                  >
                    {uploading ? (
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-primary border-t-transparent" />
                    ) : (
                      <Camera className="w-5 h-5 text-foreground" />
                    )}
                  </label>
                  <input
                    id="avatar-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarUpload}
                    className="hidden"
                    disabled={uploading}
                  />
                </div>

                {/* Name & Meta */}
                <div className="flex-1 min-w-0">
                  <h1 className="text-2xl font-bold truncate">
                    {profile?.display_name || 'Set your name'}
                  </h1>
                  <p className="text-muted-foreground text-sm">
                    @{profile?.username || 'username'} · Joined {profile?.created_at ? formatDate(profile.created_at) : ''}
                  </p>
                </div>

                {/* Edit Button */}
                <Button
                  variant={editing ? "outline" : "default"}
                  size="sm"
                  onClick={() => {
                    if (editing) {
                      setEditForm({
                        display_name: profile?.display_name || '',
                        username: profile?.username || ''
                      });
                    }
                    setEditing(!editing);
                  }}
                  className="self-start sm:self-auto"
                >
                  {editing ? <><X className="w-4 h-4 mr-1.5" />Cancel</> : <><Edit3 className="w-4 h-4 mr-1.5" />Edit Profile</>}
                </Button>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Stats Row */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="grid grid-cols-3 gap-4 mb-6"
        >
          {statItems.map((stat) => {
            const Icon = stat.icon;
            return (
              <Card key={stat.label} className="bg-card/60 backdrop-blur-sm border-border/30">
                <CardContent className="p-4 text-center">
                  <div className={`inline-flex p-2 rounded-xl ${stat.bg} mb-2`}>
                    <Icon className={`w-4 h-4 ${stat.color}`} />
                  </div>
                  <p className="text-2xl font-bold tabular-nums">{stat.value}</p>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                </CardContent>
              </Card>
            );
          })}
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profile Details */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="lg:col-span-2"
          >
            <Card className="bg-card/60 backdrop-blur-sm border-border/30">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg">Personal Information</CardTitle>
                <CardDescription>Your account details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                {editing ? (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="display_name" className="text-xs uppercase tracking-wider text-muted-foreground">Display Name</Label>
                      <Input
                        id="display_name"
                        value={editForm.display_name}
                        onChange={(e) => setEditForm(prev => ({ ...prev, display_name: e.target.value }))}
                        placeholder="Enter your display name"
                        className="bg-surface border-border/50"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="username" className="text-xs uppercase tracking-wider text-muted-foreground">Username</Label>
                      <Input
                        id="username"
                        value={editForm.username}
                        onChange={(e) => setEditForm(prev => ({ ...prev, username: e.target.value }))}
                        placeholder="Choose a username"
                        className="bg-surface border-border/50"
                      />
                    </div>
                    <Button onClick={handleSaveProfile} className="w-full">
                      <Save className="w-4 h-4 mr-2" />
                      Save Changes
                    </Button>
                  </>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between py-2">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-primary/10">
                          <User className="w-4 h-4 text-primary" />
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Display Name</p>
                          <p className="text-sm font-medium">{profile?.display_name || 'Not set'}</p>
                        </div>
                      </div>
                    </div>
                    <Separator className="bg-border/30" />
                    <div className="flex items-center justify-between py-2">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-primary/10">
                          <Keyboard className="w-4 h-4 text-primary" />
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Username</p>
                          <p className="text-sm font-medium">@{profile?.username || 'not set'}</p>
                        </div>
                      </div>
                    </div>
                    <Separator className="bg-border/30" />
                    <div className="flex items-center justify-between py-2">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-secondary-glow/10">
                          <Mail className="w-4 h-4 text-secondary-glow" />
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Email</p>
                          <p className="text-sm font-medium">{user?.email}</p>
                        </div>
                      </div>
                    </div>
                    <Separator className="bg-border/30" />
                    <div className="flex items-center justify-between py-2">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-primary/10">
                          <Calendar className="w-4 h-4 text-primary" />
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Member Since</p>
                          <p className="text-sm font-medium">{profile?.created_at ? formatDate(profile.created_at) : 'Unknown'}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Quick Actions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="space-y-6"
          >
            <Card className="bg-card/60 backdrop-blur-sm border-border/30">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Link to="/type">
                  <Button variant="ghost" className="w-full justify-between h-11 px-3 hover:bg-primary/5">
                    <span className="flex items-center gap-2.5">
                      <Keyboard className="w-4 h-4 text-primary" />
                      <span className="text-sm">Start Typing</span>
                    </span>
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  </Button>
                </Link>
                <Link to="/progressboard">
                  <Button variant="ghost" className="w-full justify-between h-11 px-3 hover:bg-primary/5">
                    <span className="flex items-center gap-2.5">
                      <Target className="w-4 h-4 text-secondary-glow" />
                      <span className="text-sm">View Progress</span>
                    </span>
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  </Button>
                </Link>
                <Link to="/all-tests">
                  <Button variant="ghost" className="w-full justify-between h-11 px-3 hover:bg-primary/5">
                    <span className="flex items-center gap-2.5">
                      <Trophy className="w-4 h-4 text-primary" />
                      <span className="text-sm">All Tests</span>
                    </span>
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="bg-card/60 backdrop-blur-sm border-border/30">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  Account
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button 
                  variant="ghost"
                  className="w-full justify-between h-11 px-3 hover:bg-primary/5"
                  onClick={() => toast({ title: "Coming Soon", description: "Email change will be available soon." })}
                >
                  <span className="flex items-center gap-2.5">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">Change Email</span>
                  </span>
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </Button>
                <Button 
                  variant="ghost"
                  className="w-full justify-between h-11 px-3 hover:bg-primary/5"
                  onClick={() => toast({ title: "Coming Soon", description: "Password change will be available soon." })}
                >
                  <span className="flex items-center gap-2.5">
                    <Shield className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">Change Password</span>
                  </span>
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
