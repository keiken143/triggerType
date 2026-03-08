import React from 'react';

interface PageContainerProps {
    children: React.ReactNode;
    className?: string;
    maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
}

export const PageContainer = ({ children, className = '', maxWidth = '2xl' }: PageContainerProps) => {
    const maxWidthClasses = {
        sm: 'max-w-screen-sm',
        md: 'max-w-screen-md',
        lg: 'max-w-screen-lg',
        xl: 'max-w-screen-xl',
        '2xl': 'max-w-screen-2xl',
        full: 'max-w-full',
    };

    return (
        <div className={`mx-auto w-full px-4 sm:px-6 lg:px-8 ${maxWidthClasses[maxWidth]} ${className}`}>
            {children}
        </div>
    );
};

export const SectionHeader = ({ title, subtitle, className = '' }: { title: string; subtitle?: string; className?: string }) => {
    return (
        <div className={`mb-8 ${className}`}>
            <h2 className="text-2xl font-semibold tracking-tight text-foreground">{title}</h2>
            {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
        </div>
    );
};
