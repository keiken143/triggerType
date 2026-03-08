import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { PageContainer, SectionHeader } from "@/components/layout/PageContainer";
import { MinimalCard } from "@/components/ui/MinimalCard";
import { PillButton } from "@/components/ui/PillButton";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import { Search, UserPlus, Check, X, Users, MessageSquare, ArrowLeft, Trophy } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface Profile {
    user_id: string;
    username: string;
    display_name: string | null;
    avatar_url: string | null;
    id?: string;
}

interface RelationshipRequest {
    id: string;
    status: string;
    requester_id: string;
    profiles: Profile | null;
}

interface Friend extends Profile {
    relationship_id: string;
}

const Friends = () => {
    const { user } = useAuth();
    const { toast } = useToast();
    const navigate = useNavigate();
    const [friendSearchQuery, setFriendSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState<Profile[]>([]);
    const [searching, setSearching] = useState(false);
    const [incomingRequests, setIncomingRequests] = useState<RelationshipRequest[]>([]);
    const [friendsList, setFriendsList] = useState<Friend[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchIncomingRequests = useCallback(async () => {
        if (!user) return;
        try {
            // Fetch requests first
            const { data: requests, error } = await supabase
                .from('relationships')
                .select(`id, status, requester_id`)
                .eq('recipient_id', user.id)
                .eq('status', 'pending');

            if (error) throw error;

            if (requests && requests.length > 0) {
                // Fetch profiles for these requesters
                const requesterIds = requests.map(r => r.requester_id);
                const { data: profiles } = await supabase
                    .from('profiles')
                    .select('user_id, username, display_name, avatar_url')
                    .in('user_id', requesterIds);

                const requestsWithProfiles = requests.map(r => ({
                    ...r,
                    profiles: profiles?.find(p => p.user_id === r.requester_id) || null
                }));
                setIncomingRequests(requestsWithProfiles);
            } else {
                setIncomingRequests([]);
            }
        } catch (e) {
            console.error('Failed to fetch requests', e);
        }
    }, [user]);

    const fetchFriends = useCallback(async () => {
        if (!user) return;
        try {
            const { data: sent, error: errorSent } = await supabase
                .from('relationships')
                .select(`id, recipient_id`)
                .eq('requester_id', user.id)
                .eq('status', 'accepted');

            const { data: received, error: errorReceived } = await supabase
                .from('relationships')
                .select(`id, requester_id`)
                .eq('recipient_id', user.id)
                .eq('status', 'accepted');

            if (errorSent || errorReceived) throw errorSent || errorReceived;

            const allRelations = [...(sent || []), ...(received || [])];
            if (allRelations.length > 0) {
                const friendIds = allRelations.map(r => ('recipient_id' in r) ? r.recipient_id : r.requester_id);
                const { data: profiles } = await supabase
                    .from('profiles')
                    .select('user_id, username, display_name, avatar_url')
                    .in('user_id', friendIds);

                const friends = allRelations.map(r => {
                    const friendId = ('recipient_id' in r) ? r.recipient_id : r.requester_id;
                    const profile = profiles?.find(p => p.user_id === friendId);
                    return profile ? { ...profile, relationship_id: r.id } : null;
                }).filter((f): f is Friend => !!f && !!f.user_id);

                setFriendsList(friends);
            } else {
                setFriendsList([]);
            }
        } catch (e) {
            console.error('Failed to fetch friends', e);
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        if (user) {
            fetchIncomingRequests();
            fetchFriends();

            // REALTIME: Listen for relationship updates targeting this user
            const channel = supabase
                .channel('operative_network')
                .on('postgres_changes', {
                    event: '*',
                    schema: 'public',
                    table: 'relationships',
                    filter: `recipient_id=eq.${user.id}`
                }, () => {
                    fetchIncomingRequests();
                    fetchFriends();
                })
                .on('postgres_changes', {
                    event: '*',
                    schema: 'public',
                    table: 'relationships',
                    filter: `requester_id=eq.${user.id}`
                }, () => {
                    fetchFriends();
                })
                .subscribe();

            return () => {
                supabase.removeChannel(channel);
            };
        }
    }, [user, fetchIncomingRequests, fetchFriends]);

    const handleSearchUsers = async () => {
        if (!friendSearchQuery.trim()) return;
        setSearching(true);
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .ilike('username', `%${friendSearchQuery}%`)
                .neq('user_id', user?.id)
                .limit(5);

            if (error) throw error;
            setSearchResults(data || []);
        } catch (e) {
            toast({ title: "Error", description: "Search failed.", variant: "destructive" });
        } finally {
            setSearching(false);
        }
    };

    const sendFriendRequest = async (recipientId: string) => {
        try {
            const { error } = await supabase.from('relationships').insert({
                requester_id: user?.id,
                recipient_id: recipientId,
                status: 'pending'
            });
            if (error) throw error;
            toast({ title: "Sent", description: "Friend request transmitted." });
            setSearchResults(prev => prev.filter(p => p.user_id !== recipientId));
        } catch (e: unknown) {
            toast({ title: "Conflict", description: "Request already pending.", variant: "destructive" });
        }
    };

    const respondToRequest = async (requestId: string, status: 'accepted' | 'blocked') => {
        try {
            const { error } = await supabase
                .from('relationships')
                .update({ status })
                .eq('id', requestId);

            if (error) throw error;
            toast({ title: "Success", description: `Request ${status}!` });
            // Realtime will pick up the change and trigger fetches automatically
        } catch (e) {
            toast({ title: "Error", description: "Operation failed.", variant: "destructive" });
        }
    };

    const getInitials = (name: string | null) => {
        if (!name) return 'U';
        return name.split(' ').map(n => n.charAt(0)).join('').toUpperCase();
    };

    return (
        <PageContainer className="py-24">
            <div className="max-w-5xl mx-auto space-y-12">
                <div className="flex justify-between items-end">
                    <SectionHeader
                        title="Operative Network"
                        subtitle="Manage your tactical connections and team requests"
                    />
                    <PillButton variant="ghost" onClick={() => navigate(-1)} className="text-muted-foreground">
                        <ArrowLeft className="w-4 h-4 mr-2" /> Back
                    </PillButton>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

                    <div className="lg:col-span-4 space-y-6">
                        <MinimalCard className="p-6 border-primary/20">
                            <h3 className="text-sm font-bold uppercase tracking-[0.2em] text-primary mb-6">Locate Agents</h3>
                            <div className="flex gap-2">
                                <Input
                                    placeholder="Search by ID..."
                                    className="bg-white/5 border-white/10 h-10"
                                    value={friendSearchQuery}
                                    onChange={e => setFriendSearchQuery(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && handleSearchUsers()}
                                />
                                <PillButton size="icon" onClick={handleSearchUsers} disabled={searching} className="h-10 w-10 shrink-0">
                                    {searching ? <div className="animate-spin h-3 w-3 border-b-2 border-white rounded-full" /> : <Search className="w-4 h-4" />}
                                </PillButton>
                            </div>

                            <AnimatePresence>
                                {searchResults.length > 0 && (
                                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mt-6 space-y-2">
                                        <p className="text-[10px] text-neutral-500 uppercase tracking-widest mb-3">Discovery Pool</p>
                                        {searchResults.map(res => (
                                            <div key={res.id} className="flex items-center justify-between p-3 bg-muted/5 rounded-xl border border-border/5">
                                                <div className="flex items-center gap-3">
                                                    <Avatar className="w-8 h-8 border border-white/5">
                                                        <AvatarImage src={res.avatar_url || ''} />
                                                        <AvatarFallback className="text-[10px]">{getInitials(res.display_name)}</AvatarFallback>
                                                    </Avatar>
                                                    <div className="max-w-[120px]">
                                                        <p className="text-xs font-bold text-white truncate">{res.display_name || 'Agent'}</p>
                                                        <p className="text-[10px] text-neutral-500 font-mono scale-90 -translate-x-1">@{res.username}</p>
                                                    </div>
                                                </div>
                                                <PillButton size="sm" variant="outline" className="h-8" onClick={() => sendFriendRequest(res.user_id)}>
                                                    <UserPlus className="w-3 h-3 mr-1" />
                                                </PillButton>
                                            </div>
                                        ))}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </MinimalCard>

                        {incomingRequests.length > 0 && (
                            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
                                <MinimalCard className="p-6 border-purple-500/30 shadow-[0_0_20px_rgba(168,85,247,0.1)]">
                                    <h3 className="text-sm font-bold uppercase tracking-[0.2em] text-purple-400 mb-6 flex items-center gap-2">
                                        <MessageSquare className="w-3 h-3" /> Mission Invites
                                    </h3>
                                    <div className="space-y-4">
                                        {incomingRequests.map(req => (
                                            <div key={req.id} className="flex items-center justify-between p-4 bg-purple-500/5 rounded-2xl border border-purple-500/10 transition-all hover:bg-purple-500/10">
                                                <div className="flex items-center gap-3">
                                                    <Avatar className="w-10 h-10 border border-purple-500/20">
                                                        <AvatarImage src={req.profiles?.avatar_url || ''} />
                                                        <AvatarFallback className="bg-purple-900/20 text-purple-300">{getInitials(req.profiles?.display_name)}</AvatarFallback>
                                                    </Avatar>
                                                    <div>
                                                        <p className="text-xs font-bold text-white">{req.profiles?.display_name || 'Operator'}</p>
                                                        <p className="text-[10px] text-purple-400 font-mono opacity-60">INVITE RECEIVED</p>
                                                    </div>
                                                </div>
                                                <div className="flex gap-2">
                                                    <PillButton size="sm" className="h-8 w-8 p-0 bg-purple-500 hover:bg-purple-600 shadow-[0_0_10px_rgba(168,85,247,0.4)]" onClick={() => respondToRequest(req.id, 'accepted')}>
                                                        <Check className="w-4 h-4" />
                                                    </PillButton>
                                                    <PillButton size="sm" variant="ghost" className="h-8 w-8 p-0 text-white/40 hover:text-destructive" onClick={() => respondToRequest(req.id, 'blocked')}>
                                                        <X className="w-4 h-4" />
                                                    </PillButton>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </MinimalCard>
                            </motion.div>
                        )}
                    </div>

                    <div className="lg:col-span-8">
                        <MinimalCard className="p-8 min-h-[600px] relative overflow-hidden bg-[#0a0a0a]">
                            <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
                            <div className="flex items-center justify-between mb-10">
                                <div className="flex items-center gap-3">
                                    <Users className="w-5 h-5 text-primary" />
                                    <h3 className="text-sm font-black uppercase tracking-[0.3em] text-neutral-400">Tactical Network</h3>
                                </div>
                                <div className="px-3 py-1 bg-primary/10 rounded-full border border-primary/20 text-[10px] font-mono text-primary uppercase">
                                    {friendsList.length} Connected
                                </div>
                            </div>

                            {loading ? (
                                <div className="flex flex-col items-center justify-center h-[400px] gap-4 opacity-50">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                                    <p className="font-mono text-[10px] uppercase tracking-widest">Scanning Network...</p>
                                </div>
                            ) : friendsList.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {friendsList.map(friend => (
                                        <motion.div
                                            key={friend.user_id}
                                            initial={{ opacity: 0, scale: 0.95 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            className="p-5 bg-white/[0.02] border border-white/[0.05] rounded-[2rem] flex items-center justify-between group hover:border-primary/20 hover:bg-white/[0.04] transition-all cursor-pointer"
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className="relative">
                                                    <Avatar className="w-12 h-12 grayscale group-hover:grayscale-0 transition-all duration-500">
                                                        <AvatarImage src={friend.avatar_url || ''} />
                                                        <AvatarFallback className="bg-neutral-800">{getInitials(friend.display_name)}</AvatarFallback>
                                                    </Avatar>
                                                    <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-[#0a0a0a] shadow-[0_0_10px_#10b981]" />
                                                </div>
                                                <div>
                                                    <h4 className="text-sm font-bold text-white group-hover:text-primary transition-colors">{friend.display_name || 'Agent'}</h4>
                                                    <p className="text-[10px] text-neutral-500 font-mono">@{friend.username}</p>
                                                </div>
                                            </div>
                                            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <PillButton size="sm" variant="outline" className="h-8 px-3 border-white/10 hover:border-primary/40" onClick={() => navigate(`/profile/${friend.username}`)}>
                                                    <Trophy className="w-3 h-3" />
                                                </PillButton>
                                                <PillButton size="sm" className="h-8 px-3" onClick={() => navigate(`/type?ghost=${friend.user_id}`)}>
                                                    RACE
                                                </PillButton>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            ) : (
                                <div className="h-[400px] flex flex-col items-center justify-center text-center px-12">
                                    <div className="w-20 h-20 bg-muted/5 rounded-[2rem] border border-white/5 flex items-center justify-center mb-6">
                                        <Users className="w-8 h-8 text-neutral-700" />
                                    </div>
                                    <h4 className="text-lg font-bold text-neutral-200 mb-2">Passive Network</h4>
                                    <p className="text-xs text-neutral-500 max-w-[240px] leading-relaxed">
                                        Establishing new operative connections increases tactical awareness. Use the search field to find fellow agents.
                                    </p>
                                </div>
                            )}
                        </MinimalCard>
                    </div>

                </div>
            </div>
        </PageContainer>
    );
};

export default Friends;
