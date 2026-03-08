import { motion } from "framer-motion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Marquee from "@/components/ui/Marquee";
import { MagicCard } from "@/components/ui/MagicCard";
import MagicBadge from "@/components/ui/MagicBadge";
import AnimationContainer from "@/components/ui/AnimationContainer";

const REVIEWS = [
    {
        name: "Nathan Hill",
        username: "@nate_codes",
        review: "The best investment we've made in years. It's not just a tool; it's a game-changer that has propelled our business forward.",
        avatar: "https://i.pravatar.cc/150?u=nathan"
    },
    {
        name: "Ivy Wilson",
        username: "@ivy_dev",
        review: "A must-have tool for any professional. It's revolutionized the way we approach problem-solving and decision-making.",
        avatar: "https://i.pravatar.cc/150?u=ivy"
    },
    {
        name: "David Wright",
        username: "@dwright_sci",
        review: "It's like having a superpower! This tool has given us the ability to do things we never thought were possible in our field.",
        avatar: "https://i.pravatar.cc/150?u=david"
    },
    {
        name: "Quinn Taylor",
        username: "@quinn_growth",
        review: "It's a game-changer for our business. The insights it provides are invaluable and have driven substantial growth for us.",
        avatar: "https://i.pravatar.cc/150?u=quinn"
    },
    {
        name: "Leo Carter",
        username: "@leo_strat",
        review: "Transformative technology with real impact. It has streamlined our operations and brought unprecedented efficiency to our processes.",
        avatar: "https://i.pravatar.cc/150?u=leo"
    },
    {
        name: "Jack Brown",
        username: "@jack_perf",
        review: "The results are always impressive. This has helped us to not only meet but exceed our performance targets.",
        avatar: "https://i.pravatar.cc/150?u=jack"
    },
    {
        name: "Tina Brooks",
        username: "@tina_analyst",
        review: "Incredible attention to detail. The workflow is so smooth, I can't imagine going back to our old ways.",
        avatar: "https://i.pravatar.cc/150?u=tina"
    },
    {
        name: "Peter White",
        username: "@pwhite_planner",
        review: "Strategic planning has never been this data-driven. The interface is clean and the engine is incredibly fast.",
        avatar: "https://i.pravatar.cc/150?u=peter"
    },
    {
        name: "Sarah Jenkins",
        username: "@sjenkins_ux",
        review: "A masterclass in user experience. Every interaction feels intentional and polished to perfection.",
        avatar: "https://i.pravatar.cc/150?u=sarah"
    }
];

export const TestimonialsSection = () => {
    return (
        <section className="relative z-10 py-32 px-4 sm:px-6 overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(var(--primary-rgb),0.05),transparent_50%)]" />
            <AnimationContainer delay={0.1}>
                <div className="flex flex-col items-center justify-center w-full py-8 max-w-2xl mx-auto mb-20 text-center space-y-4">
                    <div className="inline-block px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-[10px] font-black uppercase tracking-[0.3em] text-primary">
                        Neural Feedback
                    </div>
                    <h2 className="text-4xl md:text-6xl font-black uppercase tracking-tighter text-foreground">
                        Operative <span className="text-primary">Transmission</span>
                    </h2>
                    <p className="text-sm text-muted-foreground max-w-lg leading-relaxed font-medium">
                        Real-time accounts from the neural frontier. Our architecture-first approach is trusted by elite developers worldwide.
                    </p>
                </div>
            </AnimationContainer>

            <div className="relative flex h-[600px] w-full flex-row items-start justify-center overflow-hidden [mask-image:linear-gradient(to_bottom,transparent,black_15%,black_85%,transparent)] gap-4 md:gap-8 max-w-7xl mx-auto">
                <Marquee vertical slowOnHover className="[--duration:35s]">
                    {REVIEWS.slice(0, 3).map((review, index) => (
                        <TestimonialCard key={index} {...review} />
                    ))}
                </Marquee>
                <Marquee vertical reverse slowOnHover className="[--duration:28s]">
                    {REVIEWS.slice(3, 6).map((review, index) => (
                        <TestimonialCard key={index} {...review} />
                    ))}
                </Marquee>
                <Marquee vertical slowOnHover className="[--duration:40s] hidden md:flex">
                    {REVIEWS.slice(6, 9).map((review, index) => (
                        <TestimonialCard key={index} {...review} />
                    ))}
                </Marquee>
            </div>
        </section>
    );
};

const TestimonialCard = ({ name, username, review, avatar }: any) => (
    <MagicCard className="w-full md:w-80 min-h-[160px] p-0 mb-6 cursor-default bg-card/40 border-border/40 group shadow-sm hover:shadow-md transition-shadow">
        <div className="flex flex-col w-full border-none h-full bg-transparent p-6 space-y-4">
            <div className="flex flex-row items-center gap-4">
                <Avatar className="h-10 w-10 border border-border/50 grayscale group-hover:grayscale-0 transition-all duration-500 shadow-sm">
                    <AvatarImage src={avatar} alt={name} />
                    <AvatarFallback className="bg-muted text-[10px] font-black text-muted-foreground">{name[0]}</AvatarFallback>
                </Avatar>
                <div className="flex flex-col">
                    <p className="text-xs font-black text-primary uppercase tracking-wider">{name}</p>
                    <p className="text-[10px] text-muted-foreground font-mono">ID: {username.toUpperCase()}</p>
                </div>
            </div>
            <p className="text-xs text-muted-foreground font-medium leading-relaxed italic opacity-80 group-hover:opacity-100 transition-opacity">
                "{review}"
            </p>
        </div>
    </MagicCard>
);
