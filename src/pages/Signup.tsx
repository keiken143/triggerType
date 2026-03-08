import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, Lock, User, ArrowRight, Eye, EyeOff } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { PageContainer } from "@/components/layout/PageContainer";
import { MinimalCard } from "@/components/ui/MinimalCard";
import { PillButton } from "@/components/ui/PillButton";
import { motion } from "framer-motion";

const Signup = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { signUp, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate("/");
    }
  }, [user, navigate]);

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};
    if (!name.trim()) newErrors.name = "Full name is required";
    if (!email.trim()) newErrors.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(email)) newErrors.email = "Please enter a valid email address";
    if (!password) newErrors.password = "Password is required";
    else if (password.length < 6) newErrors.password = "Password must be at least 6 characters";
    if (!confirmPassword) newErrors.confirmPassword = "Please confirm your password";
    else if (password !== confirmPassword) newErrors.confirmPassword = "Passwords do not match";
    if (!acceptTerms) newErrors.terms = "You must accept the terms and conditions";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    setLoading(true);
    setErrors({});

    const { error } = await signUp(email, password, name);
    if (error) setErrors({ submit: error.message || "Failed to create account. Please try again." });
    setLoading(false);
  };

  return (
    <PageContainer className="flex items-center justify-center min-h-[80vh] py-12">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-md">
        <MinimalCard className="p-8 pb-10">
          <div className="text-center space-y-2 mb-8">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Create an Identity</h1>
            <p className="text-muted-foreground text-sm">
              Enter your credentials to begin
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {errors.submit && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                <p className="text-sm text-red-500">{errors.submit}</p>
              </div>
            )}

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-xs font-semibold uppercase text-neutral-400 tracking-wider">Full Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="name"
                    type="text"
                    placeholder="Choose a username"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="pl-10 bg-background/50 border-border/50 text-foreground rounded-lg focus-visible:ring-primary focus-visible:ring-1"
                  />
                </div>{errors.name && <p className="text-xs text-red-500">{errors.name}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-xs font-semibold uppercase text-neutral-400 tracking-wider">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="pl-10 bg-background/50 border-border/50 text-foreground rounded-lg focus-visible:ring-primary focus-visible:ring-1"
                  />
                </div>{errors.email && <p className="text-xs text-red-500">{errors.email}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-xs font-semibold uppercase text-neutral-400 tracking-wider">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Create a password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="pl-10 pr-10 bg-background/50 border-border/50 text-foreground rounded-lg focus-visible:ring-primary focus-visible:ring-1"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.password && <p className="text-xs text-red-500">{errors.password}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-xs font-semibold uppercase text-neutral-400 tracking-wider">Confirm Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-neutral-500" />
                  <Input id="confirmPassword" type={showConfirmPassword ? "text" : "password"} placeholder="Confirm your password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required className="pl-10 pr-10 bg-white/5 border-white/10 text-white rounded-lg focus-visible:ring-primary focus-visible:ring-1" />
                  <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-3 text-neutral-500 hover:text-white transition-colors">
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.confirmPassword && <p className="text-xs text-red-500">{errors.confirmPassword}</p>}
              </div>

              <div className="flex items-start space-x-2 pt-2">
                <input type="checkbox" id="terms" checked={acceptTerms} onChange={(e) => setAcceptTerms(e.target.checked)} className="mt-1 bg-white/5 border-white/10 rounded" />
                <Label htmlFor="terms" className="text-xs text-neutral-400">
                  I agree to the <Link to="/terms" className="text-primary hover:text-primary/80 transition-colors">Terms of Service</Link> and <Link to="/privacy" className="text-primary hover:text-primary/80 transition-colors">Privacy Policy</Link>
                </Label>
              </div>
              {errors.terms && <p className="text-xs text-red-500">{errors.terms}</p>}
            </div>

            <PillButton type="submit" disabled={loading} className="w-full h-11 text-base">
              {loading ? "Creating Account..." : "Create Account"}
              <ArrowRight className="w-4 h-4 ml-2" />
            </PillButton>
          </form>

          <div className="mt-8 text-center text-sm">
            <span className="text-neutral-500">Already have an account? </span>
            <Link to="/login" className="text-primary font-medium hover:text-primary/80 transition-colors">
              Login
            </Link>
          </div>
        </MinimalCard>
      </motion.div>
    </PageContainer>
  );
};

export default Signup;