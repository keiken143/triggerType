import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { TrajectoryPoint } from './useGhostRecorder';

export const useGhostPlayer = (ghostId: string | null, isTyping: boolean) => {
    const [ghostTrajectory, setGhostTrajectory] = useState<TrajectoryPoint[]>([]);
    const [ghostName, setGhostName] = useState<string>("Ghost");
    const [currentGhostIndex, setCurrentGhostIndex] = useState(0); // The character index the ghost is currently on

    const startTime = useRef<number | null>(null);
    const trajectoryIndex = useRef<number>(0);

    // Fetch ghost data on mount
    useEffect(() => {
        if (!ghostId) return;

        const fetchGhost = async () => {
            try {
                const { data, error } = await supabase
                    .from('ghost_races')
                    .select('trajectory_data, user_id')
                    .eq('id', ghostId)
                    .single();

                if (error) throw error;

                if (data && data.trajectory_data) {
                    setGhostTrajectory(data.trajectory_data as unknown as TrajectoryPoint[]);

                    // Fetch profile separately to avoid join issues
                    const { data: profileData } = await supabase
                        .from('profiles')
                        .select('username')
                        .eq('user_id', data.user_id)
                        .maybeSingle();

                    setGhostName(profileData?.username || "Opponent");
                }
            } catch (err) {
                console.error("Failed to fetch ghost", err);
            }
        };

        fetchGhost();
    }, [ghostId]);

    // Playback loop
    useEffect(() => {
        if (!isTyping || ghostTrajectory.length === 0) return;

        if (startTime.current === null) {
            startTime.current = performance.now();
        }

        let animationFrameId: number;

        const loop = (timestamp: number) => {
            const elapsed = timestamp - (startTime.current || timestamp);

            // Advance the ghost's cursor based on the trajectory
            let newIdx = trajectoryIndex.current;
            while (
                newIdx < ghostTrajectory.length &&
                ghostTrajectory[newIdx][0] <= elapsed
            ) {
                newIdx++;
            }

            if (newIdx !== trajectoryIndex.current) {
                trajectoryIndex.current = newIdx;
                const charIndexRendered = ghostTrajectory[newIdx - 1]?.[1] || 0;
                setCurrentGhostIndex(charIndexRendered);
            }

            animationFrameId = requestAnimationFrame(loop);
        };

        animationFrameId = requestAnimationFrame(loop);

        return () => {
            cancelAnimationFrame(animationFrameId);
        };
    }, [isTyping, ghostTrajectory]);

    const resetGhostPlayer = () => {
        startTime.current = null;
        trajectoryIndex.current = 0;
        setCurrentGhostIndex(0);
    };

    return {
        ghostTrajectory,
        currentGhostIndex,
        ghostName,
        resetGhostPlayer
    };
};
