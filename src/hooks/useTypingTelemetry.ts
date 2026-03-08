import { useState, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export type KeyStats = {
    totalLatency: number;
    strokeCount: number;
    avgLatency: number;
    errors: number;
};

export type DifficultyMap = Record<string, KeyStats>;

export const useTypingTelemetry = (languageMode: string) => {
    const { user } = useAuth();
    const [difficultyMap, setDifficultyMap] = useState<DifficultyMap>({});
    const lastKeystrokeTime = useRef<number | null>(null);

    const recordKeystroke = useCallback((expectedKey: string, actualKey: string, isError: boolean) => {
        // We ignore spaces or empty keys for the deep error heatmap if desired, but let's track all
        if (!expectedKey) return;

        const now = performance.now();
        let latency = 0;

        if (lastKeystrokeTime.current !== null) {
            latency = now - lastKeystrokeTime.current;
        }
        lastKeystrokeTime.current = now;

        // Cap latency to 2000ms to ignore long pauses, distractions, or first keystrokes of a session
        if (latency > 2000) latency = 2000;

        setDifficultyMap(prev => {
            const keyString = expectedKey.toLowerCase();
            const currentStats = prev[keyString] || { totalLatency: 0, strokeCount: 0, avgLatency: 0, errors: 0 };

            // Only average the latency if it's less than 2000 meaning it's a fluid stroke
            // And we don't count the very first keystroke of a line towards latency because 
            // the user might have paused.
            const isFluidStroke = latency > 0 && latency < 2000;
            const newStrokeCount = isFluidStroke ? currentStats.strokeCount + 1 : currentStats.strokeCount;
            const newTotalLatency = isFluidStroke ? currentStats.totalLatency + latency : currentStats.totalLatency;

            return {
                ...prev,
                [keyString]: {
                    totalLatency: newTotalLatency,
                    strokeCount: newStrokeCount,
                    avgLatency: newStrokeCount > 0 ? newTotalLatency / newStrokeCount : 0,
                    errors: currentStats.errors + (isError ? 1 : 0),
                }
            };
        });
    }, []);

    const resetTelemetry = useCallback(() => {
        setDifficultyMap({});
        lastKeystrokeTime.current = null;
    }, []);

    const syncDnaToSupabase = useCallback(async () => {
        if (!user || Object.keys(difficultyMap).length === 0) {
            console.log("DNA sync skipped: no data to sync");
            return;
        }

        try {
            // Snapshot the current map before any async operation
            const snapshot = { ...difficultyMap };

            const { error } = await supabase.from('user_dna').insert({
                user_id: user.id,
                language_mode: languageMode,
                difficulty_map: snapshot,
            });

            if (error) {
                console.error("Error syncing DNA:", error);
            } else {
                console.log("DNA synced successfully, keys:", Object.keys(snapshot).length);
                // NOTE: We intentionally do NOT reset telemetry here.
                // The map accumulates across the session so the final sync
                // on test submission always has the full dataset.
                // Telemetry is only reset when the user starts a new test (handleReset).
            }
        } catch (e) {
            console.error("Failed to sync DNA", e);
        }
    }, [user, difficultyMap, languageMode]);

    return {
        difficultyMap,
        recordKeystroke,
        resetTelemetry,
        syncDnaToSupabase
    };
};
