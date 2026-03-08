import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { PageContainer, SectionHeader } from "@/components/layout/PageContainer";
import { MinimalCard } from "@/components/ui/MinimalCard";
import { PillButton } from "@/components/ui/PillButton";
import { motion } from "framer-motion";
import { Trophy, Zap, Users, Shield, Target, ArrowRight, Play, Star } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface Ghost {
    id: string;
    wpm_achieved: number;
    accuracy_achieved: number;
    language_mode: string;
    created_at: string;
    user_id: string;
    profiles: {
        user_id: string;
        username: string;
        display_name: string;
        avatar_url: string;
    } | null;
}

const Multiplayer = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [ghosts, setGhosts] = useState<Ghost[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'network' | 'global'>('network');

    const fetchGhosts = useCallback(async () => {
        if (!user) return;
        setLoading(true);
        try {
            let query = supabase
                .from('ghost_races')
                .select(`
                  id, 
                  wpm_achieved, 
                  accuracy_achieved, 
                  language_mode, 
                  created_at, 
                  user_id
                `)
                .order('wpm_achieved', { ascending: false })
                .limit(12);

            if (activeTab === 'network') {
                const { data: relationshipData } = await supabase
                    .from('relationships')
                    .select('requester_id, recipient_id')
                    .eq('status', 'accepted')
                    .or(`requester_id.eq.${user.id},recipient_id.eq.${user.id}`);

                const friendIds = relationshipData?.map(r =>
                    r.requester_id === user.id ? r.recipient_id : r.requester_id
                ) || [];

                if (friendIds.length > 0) {
                    query = query.in('user_id', friendIds);
                } else {
                    setGhosts([]);
                    setLoading(false);
                    return;
                }
            }

            const { data: ghostData, error } = await query;
            if (error) throw error;

            if (ghostData && ghostData.length > 0) {
                // Fetch profiles for these users separately to avoid join issues
                const userIds = Array.from(new Set(ghostData.map(g => g.user_id)));
                const { data: profileData } = await supabase
                    .from('profiles')
                    .select('user_id, username, display_name, avatar_url')
                    .in('user_id', userIds);

                const ghostsWithProfiles = ghostData.map(ghost => ({
                    ...ghost,
                    profiles: profileData?.find(p => p.user_id === ghost.user_id) || null
                }));

                setGhosts(ghostsWithProfiles);
            } else {
                setGhosts([]);
            }
        } catch (e) {
            console.error('Failed to fetch ghosts', e);
        } finally {
            setLoading(false);
        }
    }, [user, activeTab]);

    useEffect(() => {
        if (user) {
            fetchGhosts();

            const channel = supabase
                .channel('multiplayer_nexus')
                .on('postgres_changes', {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'ghost_races'
                }, () => {
                    fetchGhosts();
                })
                .subscribe();

            return () => { supabase.removeChannel(channel); };
        }
    }, [user, activeTab, fetchGhosts]);

    return (
        <PageContainer className="py-24">
            <div className="max-w-7xl mx-auto space-y-12">
                <div className="flex flex-col md:flex-row justify-between items-end gap-6">
                    <SectionHeader
                        title="Multiplayer Nexus"
                        subtitle="Engage in asynchronous combat against operative ghost trajectories"
                    />
                    <div className="flex bg-muted/20 border border-border/40 p-1 rounded-full backdrop-blur-xl">
                        <button
                            onClick={() => setActiveTab('network')}
                            className={`px-6 py-2 rounded-full text-[10px] font-black tracking-widest uppercase transition-all ${activeTab === 'network' ? 'bg-primary text-primary-foreground shadow-glow/20' : 'text-muted-foreground hover:text-foreground'}`}
                        >
                            Operative Network
                        </button>
                        <button
                            onClick={() => setActiveTab('global')}
                            className={`px-6 py-2 rounded-full text-[10px] font-black tracking-widest uppercase transition-all ${activeTab === 'global' ? 'bg-primary text-primary-foreground shadow-glow/20' : 'text-muted-foreground hover:text-foreground'}`}
                        >
                            Global Intel
                        </button>
                    </div>
                </div>

                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                    <MinimalCard className="p-10 border-primary/20 bg-card/40 overflow-hidden relative group">
                        <div className="absolute inset-0 bg-[radial-gradient(40%_300px_at_50%_0%,rgba(var(--primary-rgb),0.1),transparent)]" />
                        <div className="absolute inset-0 bg-grid-pattern opacity-10" />

                        <div className="absolute top-0 right-0 p-12 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity">
                            <Shield className="w-80 h-80 -mr-24 -mt-24 rotate-12" />
                        </div>

                        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                            <div className="space-y-6">
                                <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 border border-primary/20 rounded-full text-[9px] font-black text-primary uppercase tracking-[0.3em]">
                                    <Zap className="w-3 h-3 fill-primary" /> Live Network Link // ACTIVE
                                </div>
                                <h2 className="text-4xl sm:text-5xl font-black uppercase tracking-tighter leading-[0.9] text-foreground">
                                    Asynchronous <br /> <span className="text-primary drop-shadow-[0_0_15px_rgba(var(--primary-rgb),0.3)]">Ghost Combat</span>
                                </h2>
                                <p className="text-muted-foreground max-w-sm leading-relaxed text-sm font-medium">
                                    Race against the recorded neural DNA of elite operatives. Match their millisecond-perfect trajectories in high-latency combat simulations.
                                </p>
                                <div className="flex gap-4 pt-4">
                                    <PillButton onClick={() => navigate('/type')} className="px-10 h-14 text-[10px] font-black uppercase tracking-[0.2em] bg-primary text-background shadow-[0_0_30px_rgba(var(--primary-rgb),0.4)] hover:shadow-primary/60 transition-all border-none">
                                        Initiate Combat <ArrowRight className="ml-2 w-4 h-4" />
                                    </PillButton>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-6 relative">
                                <div className="p-8 bg-muted/10 border border-border/20 rounded-[3rem] space-y-2 text-center group/card transition-all hover:bg-primary/[0.03] hover:border-primary/20 backdrop-blur-sm shadow-sm">
                                    <div className="p-3 bg-primary/10 rounded-2xl w-fit mx-auto mb-3">
                                        <Users className="w-5 h-5 text-primary" />
                                    </div>
                                    <p className="text-4xl font-black tracking-tighter text-foreground">{ghosts.length <= 12 ? 'ACTIVE' : ghosts.length}</p>
                                    <p className="text-[9px] text-muted-foreground uppercase tracking-[0.2em] font-black">Uplinks</p>
                                </div>
                                <div className="p-8 bg-muted/10 border border-border/20 rounded-[3rem] space-y-2 text-center transition-all hover:bg-purple-500/[0.03] hover:border-purple-500/20 backdrop-blur-sm shadow-sm">
                                    <div className="p-3 bg-purple-500/10 rounded-2xl w-fit mx-auto mb-3">
                                        <Trophy className="w-5 h-5 text-purple-400" />
                                    </div>
                                    <p className="text-4xl font-black tracking-tighter text-foreground">24/7</p>
                                    <p className="text-[9px] text-muted-foreground uppercase tracking-[0.2em] font-black">Ready</p>
                                </div>
                            </div>
                        </div>
                    </MinimalCard>
                </motion.div>

                <div className="space-y-8">
                    <div className="flex items-center gap-3 border-l-2 border-primary pl-4 py-1">
                        <h3 className="text-xs font-black uppercase tracking-[0.3em] text-foreground/70">Tactical Feed</h3>
                        <div className="h-px flex-1 bg-gradient-to-r from-border to-transparent" />
                    </div>

                    {loading ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            {[1, 2, 3, 4].map(i => (
                                <div key={i} className="h-48 bg-muted/10 rounded-[2rem] border border-border/20 animate-pulse" />
                            ))}
                        </div>
                    ) : ghosts.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                            {ghosts.map((ghost, idx) => (
                                <motion.div
                                    key={ghost.id}
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: idx * 0.05 }}
                                >
                                    <MinimalCard className="p-6 transition-all group flex flex-col justify-between h-full bg-card/40 border-border/50 hover:border-primary/30 hover:bg-card/60 hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.5)]">
                                        <div className="space-y-5">
                                            <div className="flex items-center justify-between">
                                                <div className="p-0.5 rounded-full bg-gradient-to-tr from-primary to-transparent">
                                                    <Avatar className="w-12 h-12 border-2 border-background">
                                                        <AvatarImage src={ghost.profiles?.avatar_url || ''} />
                                                        <AvatarFallback className="bg-muted font-bold">{(ghost.profiles?.display_name || 'U').charAt(0)}</AvatarFallback>
                                                    </Avatar>
                                                </div>
                                                <div className="text-right">
                                                    <div className="inline-block px-1.5 py-0.5 bg-muted rounded text-[7px] font-black uppercase tracking-widest text-muted-foreground transition-colors group-hover:bg-primary/20 group-hover:text-primary">
                                                        {ghost.language_mode}
                                                    </div>
                                                    <p className="text-[10px] font-mono mt-1 text-muted-foreground">{new Date(ghost.created_at).toLocaleDateString()}</p>
                                                </div>
                                            </div>
                                            <div>
                                                <h4 className="text-base font-black text-foreground tracking-tight border-b border-border/10 pb-2 mb-3">
                                                    <span className="text-primary text-xs opacity-50 mr-1">ID//</span>
                                                    {ghost.profiles?.username || 'ANONYMOUS'}
                                                </h4>
                                                <div className="flex items-end gap-3 px-1">
                                                    <div className="flex flex-col">
                                                        <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground mb-0.5">Velocity</span>
                                                        <div className="text-2xl font-black leading-none text-foreground">{Math.round(ghost.wpm_achieved)} <span className="text-[10px] opacity-40">WPM</span></div>
                                                    </div>
                                                    <div className="w-px h-8 bg-border/20 mx-1" />
                                                    <div className="flex flex-col">
                                                        <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground mb-0.5">Precision</span>
                                                        <div className="text-lg font-black leading-none text-primary/80">{Math.round(ghost.accuracy_achieved)}%</div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <PillButton
                                            onClick={() => navigate(`/type?ghost=${ghost.id}`)}
                                            className="w-full mt-8 bg-primary/5 hover:bg-primary hover:text-primary-foreground border-border/20 h-11 text-[9px] uppercase font-black tracking-[0.2em] transition-all transform group-active:scale-[0.98]"
                                        >
                                            <Play className="w-3.5 h-3.5 mr-2 fill-current" /> Initialize Combat
                                        </PillButton>
                                    </MinimalCard>
                                </motion.div>
                            ))}
                        </div>
                    ) : (
                        <div className="p-32 text-center bg-card/5 rounded-[4rem] border border-border/50 backdrop-blur-3xl">
                            <div className="p-6 bg-muted/10 rounded-full w-fit mx-auto mb-6">
                                <Users className="w-12 h-12 text-muted-foreground/30" />
                            </div>
                            <h4 className="text-xl font-black text-foreground uppercase tracking-widest">Ghost Log Offline</h4>
                            <p className="text-sm text-muted-foreground max-w-xs mx-auto mt-2 italic">
                                {activeTab === 'network' ? "No operative trajectories detected in your immediate network." : "Global trajectory uplink currently inactive."}
                            </p>
                        </div>
                    )}
                </div>

            </div>
        </PageContainer>
    );
};

export default Multiplayer;
