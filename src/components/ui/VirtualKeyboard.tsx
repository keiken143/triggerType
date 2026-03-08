"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

const KEYBOARD_LAYOUT = [
    ["q", "w", "e", "r", "t", "y", "u", "i", "o", "p"],
    ["a", "s", "d", "f", "g", "h", "j", "k", "l"],
    ["z", "x", "c", "v", "b", "n", "m"],
    ["space"]
];

// Technical Heatmap Colors - Inspired by Keybr's minimalist approach
const HEATMAP_SHADES = [
    "bg-muted/5",           // Default
    "bg-emerald-500/10",    // Correct/Calibrated
    "bg-amber-500/10",      // Potential error
    "bg-rose-500/10",       // High error rate
];

export const VirtualKeyboard = ({
    keyErrors = {}
}: {
    keyErrors?: Record<string, number>
}) => {
    const [activeKey, setActiveKey] = useState<string | null>(null);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            const key = e.key.toLowerCase();
            setActiveKey(key === " " ? "space" : key);
        };
        const handleKeyUp = () => setActiveKey(null);
        window.addEventListener("keydown", handleKeyDown);
        window.addEventListener("keyup", handleKeyUp);
        return () => {
            window.removeEventListener("keydown", handleKeyDown);
            window.removeEventListener("keyup", handleKeyUp);
        };
    }, []);

    const getHeatmapColor = (key: string) => {
        const errors = keyErrors[key] || 0;
        if (errors === 0) return HEATMAP_SHADES[0];
        if (errors < 2) return HEATMAP_SHADES[1];
        if (errors < 5) return HEATMAP_SHADES[2];
        return HEATMAP_SHADES[3];
    };

    return (
        <div className="flex flex-col items-center gap-2 md:gap-3 w-full max-w-4xl mx-auto select-none">
            {KEYBOARD_LAYOUT.map((row, rowIdx) => (
                <div key={rowIdx} className="flex gap-2 md:gap-3 w-full justify-center">
                    {row.map((key) => (
                        <Key
                            key={key}
                            label={key}
                            isActive={activeKey === key}
                            heatmapClass={getHeatmapColor(key)}
                            errors={keyErrors[key] || 0}
                        />
                    ))}
                </div>
            ))}
        </div>
    );
};

const Key = ({ label, isActive, heatmapClass, errors }: { label: string; isActive: boolean; heatmapClass: string; errors: number }) => {
    const isSpace = label === "space";

    return (
        <motion.div
            animate={{
                scale: isActive ? 0.92 : 1,
                backgroundColor: isActive ? "hsl(var(--primary))" : undefined,
                borderColor: isActive ? "hsl(var(--primary))" : "rgba(var(--border), 0.15)",
                color: isActive ? "hsl(var(--primary-foreground))" : "currentColor",
                y: isActive ? 2 : 0,
            }}
            transition={{ type: "spring", stiffness: 800, damping: 20 }}
            className={cn(
                "flex flex-col items-center justify-between p-2 rounded-md border font-mono transition-colors relative overflow-hidden shadow-sm",
                !isActive && heatmapClass,
                isSpace ? "w-[24rem] h-14 md:h-16" : "w-12 h-14 md:w-16 md:h-16"
            )}
        >
            <div className={cn(
                "text-xs md:text-sm font-black uppercase w-full text-left transition-opacity",
                isActive ? "opacity-100" : "opacity-40"
            )}>
                {isSpace ? "" : label}
            </div>

            {/* Heatmap dot indicator like Keybr */}
            {!isActive && errors > 0 && (
                <div className={cn(
                    "w-2 h-2 rounded-full",
                    errors < 2 ? "bg-emerald-500/60 shadow-[0_0_8px_rgba(16,185,129,0.4)]" :
                        errors < 5 ? "bg-amber-500/60 shadow-[0_0_8px_rgba(245,158,11,0.4)]" :
                            "bg-rose-500/60 shadow-[0_0_8px_rgba(244,63,94,0.4)]"
                )} />
            )}

            {/* Active press effect */}
            {isActive && (
                <motion.div
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.1 }}
                    className="absolute inset-0 bg-primary/30 flex items-center justify-center pointer-events-none"
                >
                    <div className="w-2.5 h-2.5 rounded-full bg-primary-foreground shadow-[0_0_12px_white]" />
                </motion.div>
            )}
        </motion.div>
    );
};
