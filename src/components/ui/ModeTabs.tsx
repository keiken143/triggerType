import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

export interface Tab {
    id: string;
    label: React.ReactNode;
}

export interface ModeTabsProps {
    tabs: Tab[];
    activeTab: string;
    onChange: (tabId: string) => void;
    layoutId: string;
    className?: string;
    tabClassName?: string;
}

export const ModeTabs = ({ tabs, activeTab, onChange, layoutId, className, tabClassName }: ModeTabsProps) => {
    return (
        <div className={cn("inline-flex bg-muted/40 p-1 rounded-full border border-border/50 items-center relative overflow-hidden", className)}>
            {tabs.map((tab) => {
                const isActive = activeTab === tab.id;

                return (
                    <button
                        key={tab.id}
                        onClick={(e) => {
                            e.preventDefault();
                            onChange(tab.id);
                        }}
                        className={cn(
                            "relative px-5 py-2 text-sm font-medium rounded-full transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring ring-offset-background z-10 flex items-center justify-center",
                            isActive
                                ? "text-foreground"
                                : "text-muted-foreground hover:text-foreground/80",
                            tabClassName
                        )}
                        style={{ WebkitTapHighlightColor: "transparent" }}
                        aria-pressed={isActive}
                    >
                        {isActive && (
                            <motion.div
                                layoutId={layoutId}
                                className="absolute inset-0.5 bg-background dark:bg-neutral-800 rounded-full border border-border/50 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.1),0_4px_12px_-4px_rgba(0,0,0,0.05)] dark:shadow-none"
                                transition={{ type: "spring", stiffness: 450, damping: 35 }}
                                style={{ zIndex: -1 }}
                            />
                        )}
                        <span className="relative z-10 flex items-center gap-2">{tab.label}</span>
                    </button>
                );
            })}
        </div>
    );
};
