import React from 'react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface StatInlineProps {
    label: string;
    value: string | number;
    subValue?: string | number;
    className?: string;
    labelClassName?: string;
    valueClassName?: string;
}

export const StatInline = ({ label, value, subValue, className, labelClassName, valueClassName }: StatInlineProps) => {
    return (
        <div className={cn("flex items-baseline gap-2", className)}>
            <span className={cn("text-xs font-medium text-muted-foreground uppercase tracking-wider", labelClassName)}>
                {label}
            </span>
            <motion.span
                initial={{ opacity: 0, filter: 'blur(10px)' }}
                animate={{ opacity: 1, filter: 'blur(0px)' }}
                className={cn("text-2xl font-bold tracking-tight text-foreground font-mono", valueClassName)}
            >
                {value}
                {subValue && (
                    <span className="text-sm font-semibold text-muted-foreground ml-1">
                        {subValue}
                    </span>
                )}
            </motion.span>
        </div>
    );
};
