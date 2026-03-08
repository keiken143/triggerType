import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, Lock, User, ArrowRight, Eye, EyeOff, Keyboard } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

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
    if (user) navigate("/");
  }, [user, navigate]);

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};
    if (!name.trim()) newErrors.name = "Full name is required";
    if (!email.trim()) newErrors.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(email)) newErrors.email = "Please enter a valid email";
    if (!password) newErrors.password = "Password is required";
    else if (password.length < 6) newErrors.password = "Min 6 characters";
    if (!confirmPassword) newErrors.confirmPassword = "Please confirm your password";
    else if (password !== confirmPassword) newErrors.confirmPassword = "Passwords do not match";
    if (!acceptTerms) newErrors.terms = "You must accept the terms";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    setLoading(true);
    setErrors({});
    const { error } = await signUp(email, password, name);
    if (error) setErrors({ submit: error.message || "Failed to create account." });
    setLoading(false);
  };

  const InputField = ({
    id, label, type = "text", placeholder, value, onChange, icon: Icon, error, showToggle, isVisible, onToggle,
  }: {
    id: string; label: string; type?: string; placeholder: string; value: string;
    onChange: (v: string) => void; icon: any; error?: string;
    showToggle?: boolean; isVisible?: boolean; onToggle?: () => void;
  }) => (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-sm font-medium text-foreground">{label}</Label>
      <div className="relative">
        <Icon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          id={id}
          type={showToggle ? (isVisible ? "text" : "password") : type}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required
          className={`pl-10 ${showToggle ? "pr-10" : ""} h-11 bg-card border-border focus:border-primary transition-colors ${
            error ? "border-destructive focus:border-destructive" : ""
          }`}
        />
        {showToggle && (
          <button
            type="button"
            onClick={onToggle}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
          >
            {isVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        )}
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );

  return (
    <div className="min-h-screen flex bg-background">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden items-center justify-center bg-gradient-to-br from-secondary-glow/15 via-card to-primary/10">
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{ backgroundImage: "var(--pattern-grid)" }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent" />

        <div className="relative z-10 px-16 space-y-8 max-w-lg">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-primary/10 border border-primary/20">
              <Keyboard className="w-8 h-8 text-primary" />
            </div>
            <span className="text-3xl font-bold tracking-tight text-foreground" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              TrigType
            </span>
          </div>

          <h1 className="text-4xl font-bold leading-tight text-foreground" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            Start your typing<br />
            <span className="text-primary">journey</span> today.
          </h1>

          <p className="text-lg text-muted-foreground leading-relaxed">
            Join thousands of users improving their typing speed and accuracy with personalized AI-driven practice sessions.
          </p>

          <div className="space-y-4 pt-4">
            {[
              "Personalized practice based on your weak keys",
              "Track your progress with detailed analytics",
              "Multiple typing modes: Touch, Paragraph & Code",
            ].map((feature) => (
              <div key={feature} className="flex items-center gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                <p className="text-sm text-muted-foreground">{feature}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm space-y-6">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2 justify-center">
            <Keyboard className="w-6 h-6 text-primary" />
            <span className="text-xl font-bold text-foreground" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>TrigType</span>
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-foreground" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              Create your account
            </h2>
            <p className="text-muted-foreground text-sm">
              Fill in your details to get started
            </p>
          </div>

          {errors.submit && (
            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
              <p className="text-sm text-destructive">{errors.submit}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <InputField id="name" label="Full Name" placeholder="John Doe" value={name} onChange={setName} icon={User} error={errors.name} />
            <InputField id="email" label="Email" type="email" placeholder="you@example.com" value={email} onChange={setEmail} icon={Mail} error={errors.email} />
            <InputField id="password" label="Password" placeholder="Min. 6 characters" value={password} onChange={setPassword} icon={Lock} error={errors.password} showToggle isVisible={showPassword} onToggle={() => setShowPassword(!showPassword)} />
            <InputField id="confirmPassword" label="Confirm Password" placeholder="Re-enter password" value={confirmPassword} onChange={setConfirmPassword} icon={Lock} error={errors.confirmPassword} showToggle isVisible={showConfirmPassword} onToggle={() => setShowConfirmPassword(!showConfirmPassword)} />

            <div className="space-y-1.5">
              <div className="flex items-start gap-2">
                <input
                  type="checkbox"
                  id="terms"
                  checked={acceptTerms}
                  onChange={(e) => setAcceptTerms(e.target.checked)}
                  className={`mt-0.5 rounded border-border bg-card accent-primary ${errors.terms ? "border-destructive" : ""}`}
                />
                <Label htmlFor="terms" className="text-xs text-muted-foreground leading-relaxed">
                  I agree to the{" "}
                  <Link to="/terms" className="text-primary hover:text-primary/80">Terms</Link> and{" "}
                  <Link to="/privacy" className="text-primary hover:text-primary/80">Privacy Policy</Link>
                </Label>
              </div>
              {errors.terms && <p className="text-xs text-destructive">{errors.terms}</p>}
            </div>

            <Button type="submit" disabled={loading} className="w-full h-11" variant="glow" size="lg">
              {loading ? "Creating Account..." : "Create Account"}
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link to="/login" className="text-primary font-medium hover:text-primary/80 transition-colors">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Signup;
