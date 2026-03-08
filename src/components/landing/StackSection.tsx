"use client";

import { useEffect } from "react";
import { useAnimate, motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Bot } from "lucide-react";
import {
    MagicCard,
    CardTitle,
    CardDescription,
    CardSkeletonContainer
} from "@/components/ui/MagicCard";
import {
    ClaudeLogo,
    OpenAILogo,
    GeminiLogo,
    MetaIconOutline
} from "@/components/ui/Logos";
import { Sparkles } from "@/components/ui/Sparkles";
import AnimationContainer from "@/components/ui/AnimationContainer";

export const StackSection = () => {
    return (
        <section className="relative z-10 py-24 px-4 sm:px-6">
            <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                <AnimationContainer delay={0.1}>
                    <div className="flex flex-col space-y-6">
                        <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground">
                            Built on the <span className="text-muted-foreground">Neural Frontier</span>
                        </h2>
                        <p className="text-lg text-muted-foreground leading-relaxed max-w-lg">
                            TrigType leverages state-of-the-art Large Language Models to analyze your typing patterns and generate personalized practice modules.
                        </p>
                        <div className="flex flex-col gap-4 text-sm text-muted-foreground font-mono">
                            <div className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                                Real-time GPU inference
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-blue-500" />
                                Adaptive ML roadmaps
                            </div>
                        </div>
                    </div>
                </AnimationContainer>

                <AnimationContainer delay={0.3}>
                    <MagicCard className="max-w-xl mx-auto p-12 border-border/40 bg-card/40 backdrop-blur-3xl relative overflow-hidden group">
                        <div className="absolute inset-0 bg-grid-pattern opacity-10 [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)]" />

                        <CardSkeletonContainer showGradient={false} className="h-[22rem] bg-transparent border-none mb-10 flex items-center justify-center relative overflow-hidden">
                            <LogosAnimation />
                            <div className="h-64 w-px absolute top-12 m-auto z-40 bg-gradient-to-b from-transparent via-primary/50 to-transparent">
                                <div className="w-16 h-32 top-1/2 -translate-y-1/2 absolute -left-[31px] opacity-30">
                                    <Sparkles count={12} />
                                </div>
                            </div>
                        </CardSkeletonContainer>

                        <div className="relative z-10 space-y-3">
                            <div className="inline-block px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-[9px] font-black uppercase tracking-[0.2em] text-primary mb-2">
                                System Core // 01
                            </div>
                            <CardTitle className="text-2xl font-black uppercase tracking-tight text-foreground">Technical Integration</CardTitle>
                            <CardDescription className="text-sm leading-relaxed text-muted-foreground">
                                We integrate with the world's most powerful AI engines to provide you with the most accurate typing feedback and generation.
                            </CardDescription>
                        </div>
                    </MagicCard>
                </AnimationContainer>
            </div>
        </section>
    );
};

const LogosAnimation = () => {
    const [scope, animate] = useAnimate();

    useEffect(() => {
        let mounted = true;
        const scale = [1, 1.1, 1];
        const transform = ["translateY(0px)", "translateY(-8px)", "translateY(0px)"];
        const duration = 0.8;

        const sequence = async () => {
            if (!scope.current) return;

            while (mounted && scope.current) {
                try {
                    await animate(".circle-1", { scale, transform }, { duration });
                    if (!mounted || !scope.current) break;
                    await animate(".circle-2", { scale, transform }, { duration });
                    if (!mounted || !scope.current) break;
                    await animate(".circle-3", { scale, transform }, { duration });
                    if (!mounted || !scope.current) break;
                    await animate(".circle-4", { scale, transform }, { duration });
                    if (!mounted || !scope.current) break;
                    await animate(".circle-5", { scale, transform }, { duration });

                    // Small pause at the end
                    await new Promise(resolve => setTimeout(resolve, 800));
                } catch (err) {
                    break;
                }
            }
        };

        sequence();
        return () => { mounted = false; };
    }, [animate, scope]);

    return (
        <div ref={scope} className="flex flex-row shrink-0 justify-center items-center gap-3 md:gap-5">
            <Container className="h-10 w-10 md:h-14 md:w-14 circle-1">
                <ClaudeLogo className="h-5 w-5 md:h-7 md:w-7" />
            </Container>
            <Container className="h-14 w-14 md:h-20 md:w-20 circle-2 bg-foreground dark:bg-white border-none shadow-xl">
                <Bot className="h-7 w-7 md:h-10 md:w-10 text-background" />
            </Container>
            <Container className="h-16 w-16 md:h-24 md:w-24 circle-3">
                <OpenAILogo className="h-10 w-10 md:h-14 md:w-14" />
            </Container>
            <Container className="h-14 w-14 md:h-20 md:w-20 circle-4">
                <MetaIconOutline className="h-7 w-7 md:h-10 md:w-10" />
            </Container>
            <Container className="h-10 w-10 md:h-14 md:w-14 circle-5">
                <GeminiLogo className="h-5 w-5 md:h-7 md:w-7" />
            </Container>
        </div>
    );
};

const Container = ({ className, children }: { className?: string; children: React.ReactNode }) => (
    <div className={cn(
        "rounded-full flex items-center justify-center border border-border/30 bg-muted/10 transition-all",
        "shadow-[0px_0px_8px_0px_rgba(255,255,255,0.05)_inset,0px_16px_32px_-8px_rgba(0,0,0,0.3)]",
        className
    )}>
        {children}
    </div>
);
