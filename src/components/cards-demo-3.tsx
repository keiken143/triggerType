import {
    Card,
    CardTitle,
    CardDescription,
    CardSkeletonContainer,
    Sparkles,
    FloatingContainer,
} from "@/components/ui/card";

export function CardsDemo3() {
    return (
        <Card className="max-w-[400px] border border-[rgba(255,255,255,0.10)] dark:bg-[rgba(40,40,40,0.70)] bg-gray-100 rounded-xl overflow-hidden">
            <CardSkeletonContainer>
                <div className="relative h-full w-full flex items-center justify-center p-8 overflow-hidden">
                    <Sparkles />
                    <div className="flex flex-row items-center justify-center gap-4 relative z-50">
                        <FloatingContainer delay={0}>
                            <ClaudeIcon className="h-4 w-4 md:h-6 md:w-6" />
                        </FloatingContainer>
                        <FloatingContainer delay={0.1}>
                            <CopilotIcon className="h-4 w-4 md:h-6 md:w-6" />
                        </FloatingContainer>
                        <FloatingContainer delay={0.2}>
                            <OpenAIIcon className="h-4 w-4 md:h-6 md:w-6" />
                        </FloatingContainer>
                        <FloatingContainer delay={0.3}>
                            <MetaIcon className="h-4 w-4 md:h-6 md:w-6" />
                        </FloatingContainer>
                        <FloatingContainer delay={0.4}>
                            <GeminiIcon className="h-4 w-4 md:h-6 md:w-6" />
                        </FloatingContainer>
                    </div>
                </div>
            </CardSkeletonContainer>
            <div className="p-6">
                <CardTitle className="text-xl font-bold">Damn good card</CardTitle>
                <CardDescription className="text-sm mt-2">
                    A card that showcases a set of tools used to create your product.
                </CardDescription>
            </div>
        </Card>
    );
}

const ClaudeIcon = ({ className }: { className?: string }) => (
    <svg fill="currentColor" viewBox="0 0 24 24" className={className}>
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-4-6h8v2H8zm0-4h8v2H8zm0-4h8v2H8z" />
    </svg>
);

const CopilotIcon = ({ className }: { className?: string }) => (
    <svg fill="currentColor" viewBox="0 0 24 24" className={className}>
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-5-9h10v2H7zm0 4h10v2H7zm0-8h10v2H7z" />
    </svg>
);

const OpenAIIcon = ({ className }: { className?: string }) => (
    <svg fill="currentColor" viewBox="0 0 24 24" className={className}>
        <path d="M22.28 7.53c-.52-1.99-1.3-3.04-2.22-3.15-.36-.04-.76.02-1.18.15l-.2.06c-1.4.45-3.01 1.05-4.43 1.58-.69-.4-1.39-.78-2.09-1.16l-.16-.09c-1.63-.89-3.41-1.86-5.4-1.86-.71 0-1.25.12-1.65.35-.91.53-1.19 1.63-.84 3.19.06.28.14.57.23.86l.07.24c.4 1.34 1.11 3.73 1.11 3.73s-1.18-1.57-2.14-2.84c-1.1-1.45-2.2-2.91-3.14-2.91-.4 0-.74.12-1 .36-.78.71-.91 1.83-.34 3.03.11.23.23.47.37.71l.1.18c.84 1.48 1.91 3.39 1.91 3.39s-2.09-.43-3.61-.74c-1.74-.35-3.48-.69-4.32-.23-.61.34-.84.97-.68 1.88.2 1.13.97 2.01 2.21 2.53 1.87.78 6.42.7 10.15.54q.73-.04 1.46-.08c2.27-.12 4.49-.24 6.13.48l.19.08c.61.27 1.02.46 1.37.46.54 0 .86-.44.82-1.14-.05-.83-.49-1.31-1.18-1.76-.23-.15-.49-.31-.76-.49l-.2-.14c-1.55-1.03-3.54-2.35-3.54-2.35s2.32-.2 4.09-.34c2.02-.17 4.05-.33 5.09-1.06.66-.46.91-1.11.75-2.01zm-10.29 4.47l-.13-.1s.1-.03.13-.1z" />
    </svg>
);

const MetaIcon = ({ className }: { className?: string }) => (
    <svg fill="currentColor" viewBox="0 0 24 24" className={className}>
        <path d="M7 10C5.34 10 4 11.34 4 13s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3zm10 0c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3zm.41-2.02c-1.78 0-3.35.84-4.29 2.12-.13.17-.25.35-.36.54-.11-.19-.23-.37-.36-.54-.94-1.28-2.51-2.12-4.29-2.12-3.04 0-5.5 2.46-5.5 5.5s2.46 5.5 5.5 5.5c1.78 0 3.35-.84 4.29-2.12.13-.17.25-.35.36-.54.11.19.23.37.36.54.94 1.28 2.51 2.12 4.29 2.12 3.04 0 5.5-2.46 5.5-5.5s-2.46-5.5-5.5-5.5z" />
    </svg>
);

const GeminiIcon = ({ className }: { className?: string }) => (
    <svg fill="currentColor" viewBox="0 0 24 24" className={className}>
        <path d="M12 2L9.12 9.12L2 12L9.12 14.88L12 22L14.88 14.88L22 12L14.88 9.12L12 2Z" />
    </svg>
);
