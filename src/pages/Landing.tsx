import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import Navbar from "@/components/Navbar";
import { 
  Brain, 
  Target, 
  TrendingUp, 
  Code, 
  Users, 
  Zap,
  BarChart3,
  Trophy
} from "lucide-react";
import { Link } from "react-router-dom";

const Landing = () => {
  const features = [
    {
      icon: Brain,
      title: "Smart Typing Engine",
      description: "Real-time keystroke tracking with precision speed and error analytics.",
      color: "text-primary"
    },
    {
      icon: Target,
      title: "ML-Powered Roadmap",
      description: "Personalized practice paths that adapt to your typing behavior over time.",
      color: "text-secondary-glow"
    },
    {
      icon: TrendingUp,
      title: "Typing Biometrics",
      description: "Analyze hold time, transition lag, and rhythm to build your unique typing fingerprint.",
      color: "text-primary"
    },
    {
      icon: Code,
      title: "Developer Mode + Notation Training",
      description: "Personalize practice paths that adapt to your typing behavior over time.",
      color: "text-secondary-glow"
    },
    {
      icon: Users,
      title: "Multiplayer + Leaderboards",
      description: "Compete with others in real-time typing races and climb the global rankings.",
      color: "text-primary"
    },
    {
      icon: BarChart3,
      title: "Progress Dashboard",
      description: "Visualize your streaks, accuracy, fatigue speed, and typing evolution over time.",
      color: "text-secondary-glow"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-surface to-background">
      <div 
        className="fixed inset-0 opacity-5"
        style={{ backgroundImage: "var(--pattern-grid)" }}
      />
      
      <Navbar />
      
      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-6">
        <div className="container mx-auto text-center">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
              Type <span className="text-primary">Smarter</span>, Code <span className="text-secondary-glow">Faster</span>
              <br />
              <span className="text-3xl md:text-5xl">with <span className="text-primary">TriggerType</span></span>
            </h1>
            
            <p className="text-xl md:text-2xl text-muted-foreground mb-4">
              Precision-driven typing powered by smart analytics.
            </p>
            <p className="text-lg md:text-xl text-muted-foreground mb-12">
              Practice code. Track patterns. Outperform yourself.
            </p>

            <Link to="/signup">
              <Button variant="hero" size="lg" className="text-lg px-8 py-4">
                <Zap className="w-5 h-5 mr-2" />
                Get Started
              </Button>
            </Link>
          </div>
        </div>

        {/* Floating geometric shapes */}
        <div className="absolute top-1/4 left-10 w-20 h-20 border border-primary/20 rotate-45 hidden lg:block" />
        <div className="absolute top-1/3 right-20 w-16 h-16 border border-secondary-glow/20 rotate-12 hidden lg:block" />
        <div className="absolute bottom-1/4 left-1/4 w-12 h-12 bg-primary/10 rotate-45 hidden lg:block" />
      </section>

      {/* Features Section */}
      <section className="py-20 px-6">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-4">
              Why Choose <span className="text-primary">TriggerType</span>?
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <Card 
                  key={index}
                  className="p-8 bg-card/50 backdrop-blur-sm border-border/50 hover:border-primary/30 transition-all duration-300 hover:shadow-lg hover:shadow-primary/10 group"
                >
                  <div className="flex items-start space-x-4">
                    <div className={`p-3 rounded-lg bg-surface ${feature.color} group-hover:scale-110 transition-transform duration-300`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold mb-3 text-foreground">
                        {feature.title}
                      </h3>
                      <p className="text-muted-foreground leading-relaxed">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6 bg-gradient-to-r from-primary/10 via-surface/50 to-secondary-glow/10">
        <div className="container mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Ready to Transform Your Typing?
          </h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Join thousands of developers and professionals who've improved their typing speed and accuracy with TriggerType.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/signup">
              <Button variant="glow" size="lg" className="px-8">
                <Trophy className="w-5 h-5 mr-2" />
                Start Free Trial
              </Button>
            </Link>
            <Link to="/type">
              <Button variant="outline" size="lg" className="px-8">
                Try Demo
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Landing;