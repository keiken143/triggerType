import { useState, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export type TrajectoryPoint = [number, number]; // [timestamp_ms, character_index_typed]

export const useGhostRecorder = () => {
    const { user } = useAuth();
    const [trajectory, setTrajectory] = useState<TrajectoryPoint[]>([]);
    const startTime = useRef<number | null>(null);

    const recordGhostPoint = useCallback((charIndex: number) => {
        const now = performance.now();
        if (startTime.current === null) {
            startTime.current = now;
            // Also record the very first keystroke at time 0, index 0 
            // Wait, let's just record progress from start
        }

        const timeDelta = Math.floor(now - startTime.current);

        // Only add if index progressed (we ignore backspaces or errors for pure ghost tracking, or track them if we want backward movement)
        // Actually tracking exact index is nice for ghost cursor. Let's just track it.
        setTrajectory(prev => [...prev, [timeDelta, charIndex]]);
    }, []);

    const resetGhost = useCallback(() => {
        setTrajectory([]);
        startTime.current = null;
    }, []);

    const saveGhostRace = useCallback(async (languageMode: string, wpm: number, accuracy: number, textLengths: number) => {
        if (!user || trajectory.length === 0) return;

        try {
            // Limit trajectory data size simply to the first e.g. 500 points if it's too long, but for a session it should be fine.
            const { error } = await supabase.from('ghost_races').insert({
                user_id: user.id,
                language_mode: languageMode,
                wpm_achieved: wpm,
                accuracy_achieved: accuracy,
                trajectory_data: trajectory,
            });

            if (error) {
                console.error('Error saving ghost race:', error);
            } else {
                console.log('Ghost race saved!');
            }
        } catch (e) {
            console.error('Failed to save ghost race', e);
        }
    }, [user, trajectory]);

    return {
        trajectory,
        recordGhostPoint,
        resetGhost,
        saveGhostRace
    };
};
