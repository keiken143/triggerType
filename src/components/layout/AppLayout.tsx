import React from 'react';
import Navbar from '@/components/Navbar';
import { AnimatePresence, motion } from 'framer-motion';
import { useLocation } from 'react-router-dom';

export const AppLayout = ({ children }: { children: React.ReactNode }) => {
    const location = useLocation();

    return (
        <div className="relative min-h-screen font-sans bg-background text-foreground antialiased selection:bg-primary/20">
            {/* Subtle grid background */}
            <div className="fixed inset-0 bg-grid-pattern opacity-[0.15] pointer-events-none z-[-1]" />

            {/* Translucent Navbar */}
            <Navbar />

            {/* Main content wrapper with smooth entry/exit animations */}
            <AnimatePresence mode="wait">
                <motion.main
                    key={location.pathname}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.25, ease: "easeOut" }}
                    className="pt-20 lg:pt-24 pb-12 flex flex-col min-h-screen"
                >
                    {children}
                </motion.main>
            </AnimatePresence>
        </div>
    );
};
