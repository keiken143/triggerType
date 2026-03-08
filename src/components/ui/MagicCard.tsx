import { useRef, useState } from "react";
import { cn } from "@/lib/utils";

export const MagicCard = ({
    children,
    className,
}: {
    children: React.ReactNode;
    className?: string;
}) => {
    const divRef = useRef<HTMLDivElement>(null);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [opacity, setOpacity] = useState(0);

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!divRef.current) return;
        const div = divRef.current;
        const rect = div.getBoundingClientRect();
        setPosition({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    };

    return (
        <div
            ref={divRef}
            onMouseMove={handleMouseMove}
            onMouseEnter={() => setOpacity(1)}
            onMouseLeave={() => setOpacity(0)}
            className={cn(
                "relative overflow-hidden rounded-xl border border-border/50 bg-card transition-all duration-300",
                "shadow-[2px_4px_16px_0px_rgba(248,248,248,0.02)_inset] dark:shadow-[2px_4px_16px_0px_rgba(248,248,248,0.06)_inset]",
                "group hover:border-border/80",
                className
            )}
        >
            <div
                className="pointer-events-none absolute -inset-px opacity-0 transition duration-300"
                style={{
                    opacity,
                    background: `radial-gradient(400px circle at ${position.x}px ${position.y}px, hsl(var(--foreground)/.1), transparent 60%)`,
                }}
            />
            <div className="relative z-10">{children}</div>
        </div>
    );
};

export const CardTitle = ({
    children,
    className,
}: {
    children: React.ReactNode;
    className?: string;
}) => (
    <h3 className={cn("text-lg font-bold text-foreground py-2", className)}>
        {children}
    </h3>
);

export const CardDescription = ({
    children,
    className,
}: {
    children: React.ReactNode;
    className?: string;
}) => (
    <p className={cn("text-sm text-muted-foreground leading-relaxed", className)}>
        {children}
    </p>
);

export const CardSkeletonContainer = ({
    className,
    children,
    showGradient = true,
}: {
    className?: string;
    children: React.ReactNode;
    showGradient?: boolean;
}) => (
    <div
        className={cn(
            "h-[12rem] rounded-xl z-40 overflow-hidden relative",
            className,
            showGradient &&
            "bg-muted/20 [mask-image:radial-gradient(50%_50%_at_50%_50%,white_0%,transparent_100%)]"
        )}
    >
        {children}
    </div>
);
