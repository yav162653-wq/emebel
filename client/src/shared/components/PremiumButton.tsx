import React from 'react';
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

interface PremiumButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  isLoading?: boolean;
}

export const PremiumButton = React.forwardRef<HTMLButtonElement, PremiumButtonProps>(
  ({ className, variant = 'primary', size = 'md', isLoading, children, ...props }, ref) => {
    
    const variants = {
      primary: "bg-primary text-primary-foreground hover:bg-primary/90 shadow-md shadow-primary/20",
      secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
      outline: "border-2 border-primary text-primary hover:bg-primary/5",
      ghost: "text-foreground hover:bg-accent/10 hover:text-accent",
    };

    const sizes = {
      sm: "h-9 px-4 text-xs tracking-wider uppercase",
      md: "h-11 px-8 text-sm tracking-wide uppercase font-medium",
      lg: "h-14 px-10 text-base tracking-wide uppercase font-semibold",
      icon: "h-10 w-10 p-0",
    };

    return (
      <button
        ref={ref}
        disabled={isLoading || props.disabled}
        className={cn(
          "relative inline-flex items-center justify-center rounded-sm transition-all duration-300 ease-out",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none",
          "active:scale-[0.98]",
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      >
        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {children}
      </button>
    );
  }
);
PremiumButton.displayName = "PremiumButton";
