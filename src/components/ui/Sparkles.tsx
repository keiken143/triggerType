"use client";

import { motion } from "framer-motion";

export const Sparkles = ({ count = 12 }: { count?: number }) => {
    const randomMove = () => Math.random() * 2 - 1;
    const randomOpacity = () => Math.random();
    const random = () => Math.random();

    return (
        <div className="absolute inset-0 pointer-events-none">
            {[...Array(count)].map((_, i) => (
                <motion.span
                    key={`star-${i}`}
                    animate={{
                        top: `calc(${random() * 100}% + ${randomMove()}px)`,
                        left: `calc(${random() * 100}% + ${randomMove()}px)`,
                        opacity: [randomOpacity(), 1, 0],
                        scale: [0, 1, 0],
                    }}
                    transition={{
                        duration: random() * 2 + 4,
                        repeat: Infinity,
                        ease: "linear",
                    }}
                    style={{
                        position: "absolute",
                        width: `2px`,
                        height: `2px`,
                        borderRadius: "50%",
                        zIndex: 1,
                    }}
                    className="inline-block bg-foreground dark:bg-white"
                />
            ))}
        </div>
    );
};
