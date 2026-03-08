import { cn } from "@/lib/utils";

interface LogoProps {
    className?: string;
}

/**
 * Theme-aware Logo component derived from a complex metallic pyramid SVG.
 * Uses CSS variables (--logo-1 through --logo-7) to adapt its appearance between light and dark modes.
 */
export const Logo = ({ className }: LogoProps) => {
    return (
        <svg
            width="512"
            height="512"
            viewBox="0 0 512 512"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={cn("w-10 h-10", className)}
        >
            <defs>
                {/* Top Left Gradient: Light to Muted */}
                <linearGradient id="logoTopLeft" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" className="logo-stop-1" stopColor="currentColor" />
                    <stop offset="100%" className="logo-stop-2" stopColor="currentColor" />
                </linearGradient>

                {/* Top Right Gradient: Mid-Light to Deep Dark */}
                <linearGradient id="logoTopRight" x1="100%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" className="logo-stop-3" stopColor="currentColor" />
                    <stop offset="100%" className="logo-stop-4" stopColor="currentColor" />
                </linearGradient>

                {/* Bottom Left Gradient: Middle Metallic to Lightest */}
                <linearGradient id="logoBottomLeft" x1="0%" y1="100%" x2="100%" y2="0%">
                    <stop offset="0%" className="logo-stop-5" stopColor="currentColor" />
                    <stop offset="100%" className="logo-stop-1" stopColor="currentColor" />
                </linearGradient>

                {/* Bottom Right Gradient: Mid-Dark to Mid-Light */}
                <linearGradient id="logoBottomRight" x1="100%" y1="100%" x2="0%" y2="0%">
                    <stop offset="0%" className="logo-stop-6" stopColor="currentColor" />
                    <stop offset="100%" className="logo-stop-7" stopColor="currentColor" />
                </linearGradient>

                {/* High-fidelity sparkle radial gradient */}
                <radialGradient id="logoSparkle" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="white" />
                    <stop offset="100%" stopColor="transparent" />
                </radialGradient>
            </defs>

            <style>
                {`
          .logo-stop-1 { stop-color: var(--logo-1, #ffffff); }
          .logo-stop-2 { stop-color: var(--logo-2, #6b6b6b); }
          .logo-stop-3 { stop-color: var(--logo-3, #d9d9d9); }
          .logo-stop-4 { stop-color: var(--logo-4, #1a1a1a); }
          .logo-stop-5 { stop-color: var(--logo-5, #9a9a9a); }
          .logo-stop-6 { stop-color: var(--logo-6, #4a4a4a); }
          .logo-stop-7 { stop-color: var(--logo-7, #d0d0d0); }
        `}
            </style>

            {/* Top pyramid faces */}
            <polygon points="256,60 160,256 256,210" fill="url(#logoTopLeft)" className="opacity-95" />
            <polygon points="256,60 352,256 256,210" fill="url(#logoTopRight)" className="opacity-95" />

            {/* Bottom pyramid faces */}
            <polygon points="160,256 256,452 256,210" fill="url(#logoBottomLeft)" className="opacity-95" />
            <polygon points="352,256 256,452 256,210" fill="url(#logoBottomRight)" className="opacity-95" />

            {/* Pulsating sparkles for a dynamic, premium feel */}
            <circle cx="270" cy="140" r="6" fill="url(#logoSparkle)" opacity="0.9" className="animate-pulse duration-1000" />
            <circle cx="220" cy="300" r="4" fill="url(#logoSparkle)" opacity="0.8" className="animate-pulse duration-[1.5s] [animation-delay:200ms]" />
            <circle cx="300" cy="360" r="5" fill="url(#logoSparkle)" opacity="0.85" className="animate-pulse duration-[2s] [animation-delay:400ms]" />
        </svg>
    );
};
