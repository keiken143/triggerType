import * as React from "react"
import { motion } from "framer-motion"

import { cn } from "@/lib/utils"

const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "rounded-lg border bg-card text-card-foreground shadow-sm",
      className
    )}
    {...props}
  />
))
Card.displayName = "Card"

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 p-6", className)}
    {...props}
  />
))
CardHeader.displayName = "CardHeader"

const CardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      "text-2xl font-semibold leading-none tracking-tight",
      className
    )}
    {...props}
  />
))
CardTitle.displayName = "CardTitle"

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
))
CardDescription.displayName = "CardDescription"

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
))
CardContent.displayName = "CardContent"

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center p-6 pt-0", className)}
    {...props}
  />
))
CardFooter.displayName = "CardFooter"

const CardSkeletonContainer = ({
  className,
  children,
  showGradient = true,
}: {
  className?: string;
  children: React.ReactNode;
  showGradient?: boolean;
}) => {
  return (
    <motion.div
      whileHover="vibrate"
      className={cn(
        "h-[15rem] md:h-[20rem] rounded-xl z-40 relative overflow-hidden group/container",
        className,
        showGradient &&
        "bg-neutral-100 dark:bg-[rgba(40,40,40,0.70)] [mask-image:radial-gradient(50%_50%_at_50%_50%,white_0%,transparent_100%)]"
      )}
    >
      {children}
    </motion.div>
  );
};

const Sparkles = () => {
  const randomPosition = () => ({
    top: `${Math.random() * 100}%`,
    left: `${Math.random() * 100}%`,
    scale: Math.random() * 1,
    opacity: Math.random(),
    delay: Math.random() * 5,
  });

  const sparkles = React.useMemo(() =>
    Array.from({ length: 40 }).map((_, i) => ({
      id: i,
      ...randomPosition(),
    })), []
  );

  return (
    <div className="absolute inset-0 z-0">
      {sparkles.map((sparkle) => (
        <motion.div
          key={sparkle.id}
          initial={{ opacity: 0, scale: 0 }}
          animate={{
            opacity: [0, sparkle.opacity, 0],
            scale: [0, sparkle.scale, 0],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            delay: sparkle.delay,
            ease: "linear",
          }}
          style={{
            position: "absolute",
            top: sparkle.top,
            left: sparkle.left,
            width: "2px",
            height: "2px",
            backgroundColor: "#fff",
            borderRadius: "50%",
            boxShadow: "0 0 10px #fff, 0 0 20px #fff",
          }}
        />
      ))}
      <div className="absolute inset-x-0 top-0 h-px w-2/3 mx-auto bg-gradient-to-r from-transparent via-blue-500 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 h-px w-2/3 mx-auto bg-gradient-to-r from-transparent via-blue-500 to-transparent" />
      <div className="absolute inset-y-0 left-1/2 w-px h-2/3 my-auto bg-gradient-to-b from-transparent via-blue-500 to-transparent" />
    </div>
  );
};

const FloatingContainer = ({
  className,
  children,
  delay = 0,
}: {
  className?: string;
  children: React.ReactNode;
  delay?: number;
}) => {
  return (
    <motion.div
      initial={{
        y: 0,
        scale: 1,
      }}
      animate={{
        y: [-4, 4, -4],
        scale: [1, 1.05, 1],
      }}
      whileHover={{
        scale: 1.2,
        y: -10,
        rotate: [0, -5, 5, 0],
        transition: { duration: 0.3 }
      }}
      whileTap={{ scale: 0.9 }}
      transition={{
        duration: 4,
        repeat: Infinity,
        repeatType: "reverse",
        ease: "easeInOut",
        delay: delay,
      }}
      className={cn(
        "h-10 w-10 md:h-14 md:w-14 rounded-full flex items-center justify-center bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-[0_0_10px_rgba(0,0,0,0.05)] cursor-pointer hover:shadow-glow/20 transition-shadow duration-300",
        className
      )}
    >
      {children}
    </motion.div>
  );
};

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardDescription,
  CardContent,
  CardSkeletonContainer,
  Sparkles,
  FloatingContainer,
}
