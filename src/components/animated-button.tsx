"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";
import { ReactNode } from "react";

interface AnimatedButtonProps {
  children: ReactNode;
  isLoading?: boolean;
  loadingText?: string;
  icon?: ReactNode;
  className?: string;
  onClick?: () => void;
  type?: "button" | "submit" | "reset";
  disabled?: boolean;
  size?: "default" | "sm" | "lg" | "icon";
}

export default function AnimatedButton({
  children,
  isLoading = false,
  loadingText = "Procesando...",
  icon,
  className,
  size = "default",
  ...props
}: AnimatedButtonProps) {
  return (
    <Button
      className={cn(
        "relative overflow-hidden transition-all duration-300",
        isLoading && "animate-pulse-glow",
        className
      )}
      size={size}
      disabled={isLoading || props.disabled}
      {...props}
    >
      <span
        className={cn(
          "flex items-center justify-center gap-2 transition-all duration-300",
          isLoading && "opacity-0"
        )}
      >
        {icon}
        {children}
      </span>
      
      {isLoading && (
        <span className="absolute inset-0 flex items-center justify-center">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="ml-2">{loadingText}</span>
        </span>
      )}
    </Button>
  );
}
