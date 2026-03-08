import { Link } from "react-router-dom";
import { Logo } from "@/components/ui/Logo";
import AnimationContainer from "@/components/ui/AnimationContainer";
import { TextHoverEffect } from "@/components/ui/TextHoverEffect";

const footerLinks = [
    {
        title: "Pages",
        links: [
            { name: "All Products", href: "/products" },
            { name: "Studio", href: "/studio" },
            { name: "Clients", href: "/clients" },
            { name: "Pricing", href: "/pricing" },
            { name: "Blog", href: "/blog" },
        ],
    },
    {
        title: "Socials",
        links: [
            { name: "Facebook", href: "#" },
            { name: "Instagram", href: "#" },
            { name: "Twitter", href: "#" },
            { name: "LinkedIn", href: "#" },
        ],
    },
    {
        title: "Legal",
        links: [
            { name: "Privacy Policy", href: "/privacy" },
            { name: "Terms of Service", href: "/terms" },
            { name: "Cookie Policy", href: "/cookies" },
        ],
    },
    {
        title: "Register",
        links: [
            { name: "Sign Up", href: "/signup" },
            { name: "Login", href: "/login" },
            { name: "Forgot Password", href: "/forgot" },
        ],
    },
];

export const FooterSection = () => {
    return (
        <footer className="relative flex flex-col items-center justify-center border-t border-primary/20 pt-32 pb-8 md:pb-0 px-6 lg:px-8 w-full max-w-7xl mx-auto bg-[radial-gradient(40%_160px_at_50%_0%,rgba(var(--primary-rgb),0.05),transparent)]">

            {/* Tactical Indicator */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-1 bg-primary/40 rounded-full shadow-[0_0_10px_rgba(var(--primary-rgb),0.5)]" />

            <div className="grid gap-12 xl:grid-cols-3 xl:gap-8 w-full mb-20">
                <AnimationContainer delay={0.1}>
                    <div className="flex flex-col items-start justify-start md:max-w-[280px] space-y-6">
                        <Link to="/" className="flex items-center gap-3 group">
                            <Logo className="w-10 h-10 drop-shadow-[0_0_15px_rgba(var(--primary-rgb),0.3)] group-hover:scale-110 transition-transform duration-500" />
                            <span className="text-2xl font-black tracking-tighter text-foreground uppercase italic">TrigType</span>
                        </Link>
                        <p className="text-xs text-muted-foreground text-start leading-relaxed font-medium">
                            The architecture-first typing engine for elite developers. <br />
                            <span className="text-primary/60 font-mono mt-2 block">LATENCY_TRACKING // ENABLED</span>
                        </p>
                    </div>
                </AnimationContainer>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-8 xl:col-span-2">
                    {footerLinks.map((section, idx) => (
                        <AnimationContainer key={section.title} delay={0.2 + (idx * 0.1)}>
                            <div className="flex flex-col gap-6">
                                <h4 className="text-[10px] font-black text-muted-foreground/80 uppercase tracking-[0.3em]">{section.title}</h4>
                                <ul className="flex flex-col gap-4">
                                    {section.links.map((link) => (
                                        <li key={link.name}>
                                            <Link
                                                to={link.href}
                                                className="text-xs text-muted-foreground hover:text-primary transition-all duration-300 font-mono uppercase tracking-wider"
                                            >
                                                {link.name}
                                            </Link>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </AnimationContainer>
                    ))}
                </div>
            </div>

            <div className="w-full border-t border-border/10 pt-8 md:flex md:items-center md:justify-between mb-12">
                <AnimationContainer delay={0.6}>
                    <p className="text-[10px] text-muted-foreground/60 font-mono uppercase tracking-widest">
                        © TRIGTYPE_NEURAL_SUBSYSTEM 2024. ALL_RIGHTS_RESERVED.
                    </p>
                </AnimationContainer>
            </div>

            {/* High-Fidelity brand text */}
            <div className="h-[12rem] sm:h-[16rem] lg:h-[22rem] w-full flex items-center justify-center overflow-hidden opacity-20">
                <TextHoverEffect text="TRIGTYPE" />
            </div>
        </footer>
    );
};
