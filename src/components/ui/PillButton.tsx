import React from 'react';
import { cn } from '@/lib/utils';
import { motion, HTMLMotionProps } from 'framer-motion';

export interface PillButtonProps extends HTMLMotionProps<'button'> {
    variant?: 'primary' | 'secondary' | 'accent' | 'ghost' | 'outline' | 'destructive';
    size?: 'sm' | 'md' | 'lg' | 'icon';
}

const variantStyles = {
    primary: 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm',
    secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80 shadow-sm',
    accent: 'bg-accent text-accent-foreground hover:bg-accent/90 shadow-glow/10',
    ghost: 'hover:bg-accent/10 text-muted-foreground hover:text-foreground',
    outline: 'border border-border bg-transparent hover:bg-accent/10 text-muted-foreground hover:text-foreground',
    destructive: 'bg-destructive/10 text-destructive border border-destructive/20 hover:bg-destructive/20'
};

const sizeStyles = {
    sm: 'h-8 px-4 text-xs',
    md: 'h-10 px-6 text-sm',
    lg: 'h-12 px-8 text-base font-medium',
    icon: 'h-10 w-10 p-0 flex items-center justify-center'
};

export const PillButton = React.forwardRef<HTMLButtonElement, PillButtonProps>(
    ({ className, variant = 'primary', size = 'md', ...props }, ref) => {
        return (
            <motion.button
                ref={ref}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                className={cn(
                    "inline-flex items-center justify-center whitespace-nowrap rounded-full font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 ring-offset-background",
                    variantStyles[variant],
                    sizeStyles[size],
                    className
                )}
                {...props}
            />
        );
    }
);

PillButton.displayName = 'PillButton';
