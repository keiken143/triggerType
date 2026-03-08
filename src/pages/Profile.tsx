import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect, useCallback } from "react";
import { User, Mail, Calendar, Edit3, Save, X, Trophy, Target, Zap, Camera, Key, Fingerprint, Users, ArrowRight, Shield, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { PageContainer, SectionHeader } from "@/components/layout/PageContainer";
import { MinimalCard } from "@/components/ui/MinimalCard";
import { PillButton } from "@/components/ui/PillButton";
import { StatInline } from "@/components/ui/StatInline";
import { motion } from "framer-motion";
import { useNavigate, Link } from "react-router-dom";

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
  const [coachPlan, setCoachPlan] = useState<string | null>(null);
  const [loadingCoach, setLoadingCoach] = useState(false);
  const [dnaExists, setDnaExists] = useState(false);
  const navigate = useNavigate();

  const fetchProfile = useCallback(async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase.from('profiles').select('*').eq('user_id', user.id).maybeSingle();
      if (error) throw error;
      if (data) {
        setProfile(data);
        setEditForm({ display_name: data.display_name || '', username: data.username || '' });
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const fetchUserStats = useCallback(async () => {
    if (!user) return;
    try {
      const { data: tests, error } = await supabase.from('typing_tests').select('wpm').eq('user_id', user.id);
      if (error) throw error;
      if (tests) {
        const totalTests = tests.length;
        const avgWpm = totalTests > 0 ? Math.round(tests.reduce((sum, test) => sum + test.wpm, 0) / totalTests) : 0;
        const bestWpm = totalTests > 0 ? Math.max(...tests.map(test => test.wpm)) : 0;
        setStats({ totalTests, avgWpm, bestWpm });
      }
    } catch (error) {
      console.error('Error fetching user stats:', error);
    }
  }, [user]);

  const fetchDailyCurriculum = useCallback(async (showFeedback = false) => {
    if (!user) return;
    setLoadingCoach(true);
    try {
      const { data: dnaRows, error: dnaError } = await supabase
        .from('user_dna')
        .select('difficulty_map')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1);

      if (dnaError) {
        console.error('Error fetching DNA data:', JSON.stringify(dnaError, null, 2));
        if (showFeedback) {
          toast({ title: "Sync Failed", description: `Could not read neural profile data: ${dnaError.message}`, variant: "destructive" });
        }
        setCoachPlan(null);
        setDnaExists(false);
        return;
      }

      const dnaData = dnaRows && dnaRows.length > 0 ? dnaRows[0] : null;
      console.log('DNA query result:', dnaData ? 'found' : 'empty', 'rows:', dnaRows?.length);

      if (!dnaData || !dnaData.difficulty_map) {
        setCoachPlan(null);
        setDnaExists(false);
        if (showFeedback) {
          toast({
            title: "No Neural Data",
            description: "Complete a typing test and click 'Save Log' to generate your typing DNA.",
            variant: "destructive",
          });
        }
        return;
      }

      setDnaExists(true);

      const { data, error } = await supabase.functions.invoke('generate-curriculum', {
        body: { dna: dnaData.difficulty_map }
      });

      if (error) throw error;
      if (data && data.plan) {
        setCoachPlan(data.plan);
        if (showFeedback) {
          toast({ title: "Neural Profile Synced", description: "Your typing DNA has been analyzed." });
        }
      }
    } catch (e) {
      console.error('Failed to generate daily curriculum', e);
      if (showFeedback) {
        toast({ title: "Analysis Failed", description: "Could not generate curriculum. Try again.", variant: "destructive" });
      }
    } finally {
      setLoadingCoach(false);
    }
  }, [user, toast]);

  useEffect(() => {
    if (user) {
      fetchProfile();
      fetchUserStats();
      fetchDailyCurriculum();

      // REALTIME: Sync all identity metrics
      const channel = supabase
        .channel('identity_sync')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'typing_tests', filter: `user_id=eq.${user.id}` }, () => fetchUserStats())
        .on('postgres_changes', { event: '*', schema: 'public', table: 'user_dna', filter: `user_id=eq.${user.id}` }, () => fetchDailyCurriculum())
        .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles', filter: `user_id=eq.${user.id}` }, () => fetchProfile())
        .subscribe();

      return () => { supabase.removeChannel(channel); };
    }
  }, [user, fetchProfile, fetchUserStats, fetchDailyCurriculum]);

  const handleSaveProfile = async () => {
    if (!user) return;
    try {
      const { error } = await supabase.from('profiles').update({ display_name: editForm.display_name, username: editForm.username }).eq('user_id', user.id);
      if (error) throw error;
      toast({ title: "Success", description: "Identity updated." });
      setEditing(false);
      fetchProfile();
    } catch (error) {
      toast({ title: "Error", description: "Identity update failed.", variant: "destructive" });
    }
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;
    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/avatar.${fileExt}`;
      const { error: uploadError } = await supabase.storage.from('avatars').upload(fileName, file, { upsert: true });
      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(fileName);
      await supabase.from('profiles').update({ avatar_url: publicUrl }).eq('user_id', user.id);
      toast({ title: "Success", description: "Portrait updated." });
      fetchProfile();
    } catch (error) {
      toast({ title: "Error", description: "Upload failed.", variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const getInitials = (name: string | null) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n.charAt(0)).join('').toUpperCase();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  if (loading) return null;

  return (
    <PageContainer className="py-24">
      <SectionHeader title="Operator Identity" subtitle="Combat performance metrics and tactical network clearance" className="mb-12" />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-4">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <MinimalCard className="overflow-hidden bg-[#0a0a0a]">
              <div className="h-32 bg-primary/5 border-b border-white/5 flex items-center justify-center relative">
                <Fingerprint className="w-16 h-16 text-primary/10 absolute opacity-50" />
              </div>
              <div className="px-8 pb-8 -mt-12 text-center relative z-10">
                <div className="relative inline-block group cursor-pointer mb-6">
                  <Avatar className="w-32 h-32 border-4 border-[#0a0a0a] ring-1 ring-white/10 group-hover:ring-primary/50 transition-all">
                    <AvatarImage src={profile?.avatar_url || ''} className="object-cover" />
                    <AvatarFallback className="bg-neutral-800 text-3xl font-black">{getInitials(profile?.display_name)}</AvatarFallback>
                  </Avatar>
                  <label htmlFor="avatar-upload" className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                    {uploading ? <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" /> : <Camera className="w-6 h-6 text-white" />}
                  </label>
                  <input id="avatar-upload" type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
                </div>

                {editing ? (
                  <div className="space-y-4 text-left animate-in fade-in slide-in-from-top-4">
                    <Input value={editForm.display_name} onChange={e => setEditForm(p => ({ ...p, display_name: e.target.value }))} placeholder="Display Name" className="bg-white/5 border-white/10" />
                    <Input value={editForm.username} onChange={e => setEditForm(p => ({ ...p, username: e.target.value }))} placeholder="Tactical ID" className="bg-white/5 border-white/10" />
                    <div className="flex gap-2">
                      <PillButton className="flex-1" size="sm" onClick={handleSaveProfile}><Save className="w-3.5 h-3.5 mr-2" />Save</PillButton>
                      <PillButton className="flex-1" size="sm" variant="ghost" onClick={() => setEditing(false)}><X className="w-3.5 h-3.5 mr-2" />Exit</PillButton>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center justify-center gap-2 mb-1">
                      <h2 className="text-2xl font-black text-white uppercase tracking-tight">{profile?.display_name || 'Agent Unknown'}</h2>
                      <Edit3 className="w-3.5 h-3.5 text-neutral-600 cursor-pointer hover:text-primary transition-colors" onClick={() => setEditing(true)} />
                    </div>
                    <p className="text-xs font-mono text-neutral-500 uppercase tracking-widest">@{profile?.username || 'no_id'}</p>
                  </>
                )}

                <div className="mt-8 pt-8 border-t border-white/5 space-y-4 text-left">
                  <div className="flex items-center justify-between">
                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-500 font-mono">Classification</h3>
                    <span className="text-[10px] font-bold text-primary px-2.5 py-1 bg-primary/10 rounded border border-primary/20 uppercase tracking-widest font-mono">Operator L4</span>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 text-neutral-400 group/item">
                      <Mail className="w-3.5 h-3.5 group-hover/item:text-primary transition-colors" /> <span className="text-xs font-mono truncate">{user?.email}</span>
                    </div>
                    <div className="flex items-center gap-3 text-neutral-400">
                      <Calendar className="w-3.5 h-3.5" /> <span className="text-xs font-mono uppercase">JOINED {profile?.created_at ? formatDate(profile.created_at).toUpperCase() : 'UNKNOWN'}</span>
                    </div>
                  </div>
                </div>
              </div>
            </MinimalCard>
          </motion.div>
        </div>

        <div className="lg:col-span-8 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <MinimalCard className="p-8 border-primary/20 relative overflow-hidden bg-gradient-to-br from-primary/[0.02] to-transparent flex flex-col justify-between min-h-[220px] group/dna">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-primary flex items-center gap-2">
                  <Zap className="w-4 h-4" /> The Architect
                </h3>
                <div className="text-right">
                  <p className="text-[9px] font-black text-neutral-500 uppercase tracking-widest mb-1">Calibration</p>
                  <div className="flex items-center gap-2">
                    {loadingCoach && <RefreshCw className="w-3 h-3 text-primary animate-spin" />}
                    <p className="text-xs font-black text-primary font-mono">{Math.min(stats.totalTests, 5)}/5</p>
                  </div>
                </div>
              </div>
              <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-6 min-h-[100px] flex items-center relative">
                {coachPlan ? (
                  <p className="text-sm font-mono text-neutral-300 leading-relaxed italic">"{coachPlan}"</p>
                ) : stats.totalTests < 5 ? (
                  <div className="space-y-3 w-full">
                    <p className="text-xs font-mono text-neutral-500 uppercase tracking-widest">DNA Mapping in progress...</p>
                    <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                      <motion.div initial={{ width: 0 }} animate={{ width: `${(stats.totalTests / 5) * 100}%` }} className="h-full bg-primary" />
                    </div>
                    <p className="text-[10px] text-neutral-600 font-mono italic">Complete {5 - stats.totalTests} more missions to unlock live coaching.</p>
                  </div>
                ) : (
                  <div className="w-full text-center space-y-4">
                    <p className="text-xs font-mono text-neutral-500 italic uppercase tracking-widest">Awaiting datastream...</p>
                    <PillButton size="sm" variant="ghost" className="h-8 text-[9px] opacity-0 group-hover/dna:opacity-100 transition-opacity" onClick={() => fetchDailyCurriculum(true)}>
                      SYNC NEURAL PROFILE
                    </PillButton>
                  </div>
                )}
              </div>
            </MinimalCard>

            <div className="grid grid-rows-2 gap-4">
              <MinimalCard className="p-6 flex flex-col justify-center">
                <h3 className="text-[9px] font-black uppercase tracking-[0.2em] text-neutral-500 mb-3 flex items-center gap-2">
                  <Trophy className="w-3 h-3" /> Peak Velocity
                </h3>
                <StatInline value={stats.bestWpm} subValue="WPM" label="" />
              </MinimalCard>
              <MinimalCard className="p-6 flex flex-col justify-center">
                <h3 className="text-[9px] font-black uppercase tracking-[0.2em] text-neutral-500 mb-3 flex items-center gap-2">
                  <Target className="w-3 h-3 text-primary" /> Median Pace
                </h3>
                <StatInline value={stats.avgWpm} subValue="WPM" label="" />
              </MinimalCard>
            </div>
          </div>

          <MinimalCard className="p-8">
            <h3 className="text-xs font-black uppercase tracking-[0.3em] text-neutral-400 mb-8">Authorization Hub</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Link to="/friends" className="block">
                <PillButton className="w-full justify-between h-14 bg-white/5 border-white/10 hover:bg-white/10 hover:border-primary/20 backdrop-blur-sm group" variant="outline">
                  <span className="flex items-center gap-4 text-[10px] font-black uppercase tracking-[0.2em]">
                    <Users className="w-5 h-5 text-primary group-hover:scale-110 transition-transform" /> Operative Network
                  </span>
                  <ArrowRight className="w-4 h-4 opacity-30 group-hover:translate-x-1 transition-all" />
                </PillButton>
              </Link>
              <Link to="/multiplayer" className="block">
                <PillButton className="w-full justify-between h-14 bg-purple-500/5 border-purple-500/20 hover:bg-purple-500/10 hover:border-purple-500/40 backdrop-blur-sm group" variant="outline">
                  <span className="flex items-center gap-4 text-[10px] font-black uppercase tracking-[0.2em] text-purple-300">
                    <Shield className="w-5 h-5 text-purple-400 group-hover:scale-110 transition-transform" /> Multiplayer Nexus
                  </span>
                  <ArrowRight className="w-4 h-4 opacity-30 group-hover:translate-x-1 transition-all" />
                </PillButton>
              </Link>
            </div>
          </MinimalCard>

          <MinimalCard className="p-6 border-white/5 opacity-50 grayscale hover:grayscale-0 hover:opacity-100 transition-all cursor-not-allowed">
            <div className="flex items-center justify-between opacity-40">
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400">Security Protocols</h3>
              <span className="text-[8px] bg-red-500/10 text-red-500 px-2 py-0.5 rounded border border-red-500/20 uppercase font-mono">Access Locked</span>
            </div>
          </MinimalCard>
        </div>
      </div>
    </PageContainer>
  );
};

export default Profile;