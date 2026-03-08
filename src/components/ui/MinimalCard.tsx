import React from 'react';
import { cn } from '@/lib/utils';
import { motion, HTMLMotionProps } from 'framer-motion';

interface MinimalCardProps extends HTMLMotionProps<'div'> {
    animateHover?: boolean;
}

export const MinimalCard = React.forwardRef<HTMLDivElement, MinimalCardProps>(
    ({ className, animateHover = false, children, ...props }, ref) => {
        return (
            <motion.div
                ref={ref}
                whileHover={animateHover ? { y: -2, scale: 1.01 } : undefined}
                transition={{ duration: 0.15, ease: 'easeOut' }}
                className={cn(
                    "bg-card/40 text-foreground border border-border/50 rounded-xl shadow-sm backdrop-blur-md relative overflow-hidden",
                    animateHover && "hover:border-border/80 hover:shadow-glow/10 transition-all duration-200",
                    className
                )}
                {...props}
            >
                {children}
            </motion.div>
        );
    }
);

MinimalCard.displayName = 'MinimalCard';
