import { Brain, Target, Users, BarChart3, Terminal as TerminalIcon, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { PageContainer, SectionHeader } from "@/components/layout/PageContainer";
import { PillButton } from "@/components/ui/PillButton";
import { MinimalCard } from "@/components/ui/MinimalCard";
import { MagicCard, CardTitle, CardDescription, CardSkeletonContainer } from "@/components/ui/MagicCard";
import { cn } from "@/lib/utils";
import MagicBadge from "@/components/ui/MagicBadge";
import AnimationContainer from "@/components/ui/AnimationContainer";
import { Sparkles } from "@/components/ui/Sparkles";
import { motion } from "framer-motion";
import { Logo } from "@/components/ui/Logo";
import { TestimonialsSection } from "@/components/landing/TestimonialsSection";
import { FooterSection } from "@/components/landing/FooterSection";
import { StackSection } from "@/components/landing/StackSection";

const Landing = () => {
  const { user } = useAuth();

  const features = [
    {
      icon: Brain,
      title: "Smart Typing Engine",
      description: "Real-time keystroke tracking with precision speed and error analytics.",
    },
    {
      icon: Target,
      title: "ML-Powered Roadmap",
      description: "Personalized practice paths that adapt to your typing behavior over time.",
    },
    {
      icon: Users,
      title: "Multiplayer + Leaderboards",
      description: "Compete with others in real-time typing races and climb the global rankings.",
    },
    {
      icon: BarChart3,
      title: "Progress Dashboard",
      description: "Visualize your streaks, accuracy, fatigue speed, and typing evolution over time.",
    }
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 24 } }
  };

  return (
    <PageContainer className="flex-1 flex flex-col justify-center py-12">
      {/* Hero Section */}
      <section className="relative z-10 w-full mb-24 lg:mb-32">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="flex flex-col space-y-10"
          >
            <div>
              <div className="inline-flex items-center rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-[10px] text-primary font-black uppercase tracking-[0.3em] mb-8 backdrop-blur-sm shadow-[0_0_15px_rgba(var(--primary-rgb),0.1)]">
                <span className="flex h-1.5 w-1.5 rounded-full bg-primary animate-pulse mr-2"></span>
                System v2.0 // Active
              </div>
              <div className="flex flex-col gap-6 mb-8">
                <div className="flex items-center gap-4">
                  <Logo className="w-12 h-12 lg:w-16 lg:h-16 drop-shadow-[0_0_20px_rgba(var(--primary-rgb),0.3)] animate-pulse-glow" />
                  <div className="h-px flex-1 bg-gradient-to-r from-primary/30 to-transparent" />
                </div>
                <h1 className="text-5xl sm:text-6xl lg:text-8xl font-black tracking-tighter text-foreground leading-[0.9] uppercase">
                  Type at the speed <br />
                  <span className="text-muted-foreground/60">of thought.</span>
                </h1>
              </div>
              <p className="text-base lg:text-lg text-muted-foreground max-w-lg leading-relaxed font-medium">
                The elite minimalist typing platform for architecture-level mastery. Practice with real code, track your neural precision, and build deep muscle memory.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-5">
              <Link to={user ? "/type" : "/signup"}>
                <PillButton size="lg" className="w-full sm:w-auto font-black uppercase tracking-widest bg-primary text-primary-foreground hover:bg-primary/90 shadow-[0_0_20px_rgba(var(--primary-rgb),0.3)]">
                  Initialize Combat
                </PillButton>
              </Link>
              <Link to="/login">
                <PillButton variant="outline" size="lg" className="w-full sm:w-auto border-border text-foreground font-black uppercase tracking-widest hover:bg-muted/5">
                  Access Intel
                </PillButton>
              </Link>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="relative lg:ml-auto w-full max-w-xl group"
          >
            <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 to-transparent blur-3xl opacity-30 z-0"></div>
            <MinimalCard className="relative z-10 p-6 font-mono text-sm leading-relaxed overflow-hidden bg-card/60 border-border/40 backdrop-blur-xl shadow-2xl">
              <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] opacity-10" />
              <div className="absolute inset-0 w-full h-full pointer-events-none opacity-40 bg-gradient-to-b from-transparent via-primary/10 to-transparent animate-scan" style={{ height: '200%' }} />

              <div className="flex items-center justify-between mb-6 border-b border-border/10 pb-4">
                <div className="flex items-center gap-3">
                  <div className="flex gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-500/20" />
                    <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/20" />
                    <div className="w-2.5 h-2.5 rounded-full bg-green-500/20" />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <TerminalIcon className="w-3.5 h-3.5 text-primary/60" />
                  <span className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">Nexus_Engine // 01</span>
                </div>
              </div>

              <div className="space-y-2 text-muted-foreground relative z-10">
                <p><span className="text-primary/80">import</span> <span className="text-foreground">&#123;</span> Nexus <span className="text-foreground">&#125;</span> <span className="text-primary/80">from</span> <span className="text-green-600 dark:text-green-400/80">'@trig/core'</span><span className="text-foreground">;</span></p>
                <p><br /></p>
                <p><span className="text-primary/80">const</span> deployment <span className="text-foreground">=</span> <span className="text-primary/80">new</span> <span className="text-yellow-600 dark:text-yellow-400/80">Nexus</span><span className="text-foreground">(</span><span className="text-foreground">&#123;</span></p>
                <p className="pl-4">mode<span className="text-foreground">:</span> <span className="text-green-600 dark:text-green-400/80">'combat'</span><span className="text-foreground">,</span></p>
                <p className="pl-4 flex items-center">
                  status<span className="text-foreground">:</span> <span className="text-foreground relative ml-2 px-2 py-0.5 bg-primary/10 rounded-sm border border-primary/20"><span className="absolute -left-1 top-1/2 -translate-y-1/2 w-1 h-1 bg-primary rounded-full animate-pulse"></span>'ACTIVE'</span>
                </p>
                <p><span className="text-foreground">&#125;</span><span className="text-foreground">)</span><span className="text-foreground">;</span></p>
              </div>
            </MinimalCard>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="relative z-10 w-full">
        <div className="flex flex-col items-center justify-center text-center mb-16 space-y-4">
          <div className="inline-block px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-[10px] font-black uppercase tracking-[0.3em] text-primary">
            Neural Infrastructure
          </div>
          <h2 className="text-4xl sm:text-5xl font-black uppercase tracking-tighter">Developer-First <span className="text-primary">Features</span></h2>
          <p className="text-neutral-500 max-w-lg text-sm">Engineered for absolute precision and architectural typing mastery.</p>
        </div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-100px" }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          {/* Smart Typing Engine */}
          <motion.div variants={itemVariants}>
            <MagicCard className="h-full flex flex-col overflow-hidden bg-card/40 border-border/40 group">
              <CardSkeletonContainer className="bg-transparent h-48 flex items-center justify-center relative border-b border-border/40">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-30" />
                <div className="relative h-20 w-20 rounded-full flex items-center justify-center bg-background border border-primary/20 shadow-[0_0_30px_rgba(var(--primary-rgb),0.2)] group-hover:scale-110 transition-transform duration-500">
                  <Brain className="h-10 w-10 text-primary animate-pulse" />
                </div>
              </CardSkeletonContainer>
              <div className="p-6 flex-1 flex flex-col space-y-4">
                <div className="h-px w-12 bg-primary/40" />
                <CardTitle className="text-lg font-black uppercase tracking-tight text-foreground">Smart Typing Engine</CardTitle>
                <CardDescription className="text-xs leading-relaxed text-muted-foreground">
                  Real-time biometric tracking with sub-millisecond precision speed and neural error analytics.
                </CardDescription>
              </div>
            </MagicCard>
          </motion.div>

          {/* ML Roadmap */}
          <motion.div variants={itemVariants}>
            <MagicCard className="h-full flex flex-col overflow-hidden bg-card/40 border-border/40 group">
              <CardSkeletonContainer className="bg-transparent h-48 flex items-center justify-center relative border-b border-border/40">
                <div className="absolute inset-0 bg-grid-pattern opacity-10 [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,#000_70%,transparent_100%)]" />
                <div className="relative flex gap-1 items-center justify-center">
                  <div className="h-14 w-14 rounded-2xl bg-muted/5 border border-border/5 flex items-center justify-center group-hover:rotate-12 transition-transform duration-500">
                    <Target className="h-7 w-7 text-primary/80" />
                  </div>
                  <ArrowRight className="w-4 h-4 text-muted-foreground opacity-30" />
                  <div className="h-14 w-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center group-hover:-rotate-12 transition-transform duration-500">
                    <BarChart3 className="h-7 w-7 text-primary" />
                  </div>
                </div>
              </CardSkeletonContainer>
              <div className="p-6 flex-1 flex flex-col space-y-4">
                <div className="h-px w-12 bg-primary/40" />
                <CardTitle className="text-lg font-black uppercase tracking-tight text-foreground">Adaptive Learning</CardTitle>
                <CardDescription className="text-xs leading-relaxed text-muted-foreground">
                  Machine-generated practice paths that evolve based on your individual performance DNA.
                </CardDescription>
              </div>
            </MagicCard>
          </motion.div>

          {/* Multiplayer */}
          <motion.div variants={itemVariants}>
            <MagicCard className="h-full flex flex-col overflow-hidden bg-card/40 border-border/40 group">
              <CardSkeletonContainer className="bg-transparent h-48 flex items-center justify-center relative border-b border-border/40">
                <div className="absolute inset-0 bg-grid-pattern opacity-10 [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,#000_70%,transparent_100%)]" />
                <div className="flex -space-x-4 relative z-50">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className={cn(
                      "h-14 w-14 rounded-full border-2 border-background flex items-center justify-center bg-card/60 shadow-xl transition-all duration-500",
                      i === 1 && "z-30 group-hover:-translate-x-4",
                      i === 2 && "z-20 scale-90 group-hover:scale-100",
                      i === 3 && "z-10 scale-75 opacity-50 group-hover:translate-x-4 group-hover:opacity-100 group-hover:scale-90"
                    )}>
                      <Users className="h-6 w-6 text-primary/80" />
                    </div>
                  ))}
                </div>
              </CardSkeletonContainer>
              <div className="p-6 flex-1 flex flex-col space-y-4">
                <div className="h-px w-12 bg-primary/40" />
                <CardTitle className="text-lg font-black uppercase tracking-tight text-foreground">Ghost Combat</CardTitle>
                <CardDescription className="text-xs leading-relaxed text-muted-foreground">
                  Race against the recorded trajectories of other operatives in asynchronous combat.
                </CardDescription>
              </div>
            </MagicCard>
          </motion.div>

          {/* Progress Dashboard */}
          <motion.div variants={itemVariants}>
            <MagicCard className="h-full flex flex-col overflow-hidden bg-card/40 border-border/40 group">
              <CardSkeletonContainer className="bg-transparent h-48 flex items-center justify-center relative border-b border-border/40">
                <div className="absolute inset-0 bg-grid-pattern opacity-10 [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,#000_70%,transparent_100%)]" />
                <div className="relative w-full px-10 space-y-4">
                  <div className="h-1 bg-primary/5 w-full rounded-full overflow-hidden">
                    <div className="h-full bg-primary w-[70%] animate-pulse" />
                  </div>
                  <div className="h-1 bg-primary/5 w-full rounded-full overflow-hidden">
                    <div className="h-full bg-primary/40 w-[40%]" />
                  </div>
                  <div className="h-1 bg-primary/5 w-full rounded-full overflow-hidden">
                    <div className="h-full bg-purple-500/50 w-[90%]" />
                  </div>
                </div>
              </CardSkeletonContainer>
              <div className="p-6 flex-1 flex flex-col space-y-4">
                <div className="h-px w-12 bg-primary/40" />
                <CardTitle className="text-lg font-black uppercase tracking-tight text-foreground">Strategic Intel</CardTitle>
                <CardDescription className="text-xs leading-relaxed text-muted-foreground">
                  Visualize your tactical evolution with precision heatmaps and longitudinal trend analytics.
                </CardDescription>
              </div>
            </MagicCard>
          </motion.div>
        </motion.div>
      </section>

      {/* Technical Stack Section - New Expansion */}
      <StackSection />

      {/* Testimonials Section */}
      <TestimonialsSection />

      {/* Footer Section */}
      <FooterSection />
    </PageContainer>
  );
};

export default Landing;