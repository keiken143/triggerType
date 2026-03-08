import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import Navbar from "@/components/Navbar";
import { 
  Brain, 
  Target, 
  Users, 
  Zap,
  BarChart3,
  ArrowRight,
  Keyboard,
  Code,
  ChevronDown,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { motion } from "framer-motion";

const Landing = () => {
  const { user } = useAuth();

  const features = [
    {
      icon: Brain,
      title: "Smart Typing Engine",
      description: "Real-time keystroke tracking with precision speed and error analytics.",
      gradient: "from-primary/20 to-primary/5",
    },
    {
      icon: Target,
      title: "ML-Powered Roadmap",
      description: "Personalized practice paths that adapt to your typing behavior over time.",
      gradient: "from-secondary-glow/20 to-secondary-glow/5",
    },
    {
      icon: Users,
      title: "Multiplayer Races",
      description: "Compete with others in real-time typing races and climb the global rankings.",
      gradient: "from-primary/20 to-primary/5",
    },
    {
      icon: BarChart3,
      title: "Progress Dashboard",
      description: "Visualize your streaks, accuracy, and typing evolution over time.",
      gradient: "from-secondary-glow/20 to-secondary-glow/5",
    },
  ];

  const stats = [
    { value: "150+", label: "WPM Record" },
    { value: "99.8%", label: "Peak Accuracy" },
    { value: "10K+", label: "Tests Taken" },
    { value: "7", label: "Languages" },
  ];

  return (
    <div className="min-h-screen bg-background overflow-hidden">
      <div
        className="fixed inset-0 opacity-[0.03] pointer-events-none"
        style={{ backgroundImage: "var(--pattern-grid)" }}
      />
      <Navbar />

      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex items-center justify-center px-6">
        {/* Ambient glow */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/8 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-secondary-glow/6 rounded-full blur-[100px] pointer-events-none" />

        <div className="container mx-auto text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="max-w-4xl mx-auto"
          >
            {/* Badge */}

            <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-extrabold tracking-tight mb-6 leading-[1.05]">
              Type{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary-glow">
                Smarter
              </span>
              <br />
              Code{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-secondary-glow to-primary">
                Faster
              </span>
            </h1>

            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
              Precision-driven typing practice powered by smart analytics. 
              Practice code, track patterns, and outperform yourself.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to={user ? "/type" : "/signup"}>
                <Button
                  size="lg"
                  className="text-base px-8 py-6 bg-gradient-to-r from-primary to-primary-glow text-primary-foreground hover:shadow-xl hover:shadow-primary/25 hover:scale-105 transition-all duration-300"
                >
                  <Zap className="w-5 h-5 mr-2" />
                  Get Started Free
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
              <Link to="/type">
                <Button
                  variant="outline"
                  size="lg"
                  className="text-base px-8 py-6 border-border/80 hover:border-primary/50 hover:bg-primary/5 transition-all duration-300"
                >
                  <Code className="w-5 h-5 mr-2" />
                  Try a Demo
                </Button>
              </Link>
            </div>
          </motion.div>

          {/* Stats row */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.6 }}
            className="flex flex-wrap justify-center gap-8 md:gap-16 mt-20"
          >
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="text-2xl md:text-3xl font-bold text-primary">{stat.value}</p>
                <p className="text-xs md:text-sm text-muted-foreground mt-1">{stat.label}</p>
              </div>
            ))}
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
        >
          <ChevronDown className="w-5 h-5 text-muted-foreground animate-bounce" />
        </motion.div>
      </section>

      {/* Features Section */}
      <section className="py-24 px-6 relative">
        <div className="container mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-5xl font-bold mb-4">
              Why{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary-glow">
                TriggerType
              </span>
              ?
            </h2>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto">
              Everything you need to master typing and level up your coding speed.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ delay: index * 0.1, duration: 0.5 }}
                >
                  <Card
                    className={`group relative p-8 bg-gradient-to-br ${feature.gradient} border-border/40 hover:border-primary/40 transition-all duration-500 hover:shadow-xl hover:shadow-primary/5 overflow-hidden`}
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    <div className="relative flex items-start gap-5">
                      <div className="p-3 rounded-xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300 shrink-0">
                        <Icon className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold mb-2 text-foreground group-hover:text-primary transition-colors duration-300">
                          {feature.title}
                        </h3>
                        <p className="text-muted-foreground leading-relaxed text-sm">
                          {feature.description}
                        </p>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-6 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/5 to-transparent pointer-events-none" />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="container mx-auto text-center relative z-10"
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to Transform Your Typing?
          </h2>
          <p className="text-lg text-muted-foreground mb-8 max-w-xl mx-auto">
            Join developers who've improved their typing speed and accuracy with TriggerType.
          </p>
          <Link to={user ? "/type" : "/signup"}>
            <Button
              size="lg"
              className="text-base px-10 py-6 bg-gradient-to-r from-primary to-primary-glow text-primary-foreground hover:shadow-xl hover:shadow-primary/25 hover:scale-105 transition-all duration-300"
            >
              Start Typing Now
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 border-t border-border/30">
        <div className="container mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-sm text-muted-foreground">
            © 2026 <span className="text-foreground font-medium">TriggerType</span>. All rights reserved.
          </div>
          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            <span className="hover:text-primary transition-colors cursor-pointer">Privacy</span>
            <span className="hover:text-primary transition-colors cursor-pointer">Terms</span>
            <span className="hover:text-primary transition-colors cursor-pointer">Contact</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
