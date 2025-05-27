import React from "react";
import { cn } from "@/lib/utils";

interface ActionCardProps extends React.HTMLAttributes<HTMLDivElement> {
  icon: React.ReactNode;
  iconBg?: string;
  title: string;
  description?: string;
  onClick?: () => void;
}

export function ActionCard({
  icon,
  iconBg = "bg-muted",
  title,
  description,
  onClick,
  className,
  ...props
}: ActionCardProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-4 p-4 rounded-xl cursor-pointer transition hover:bg-accent border border-border",
        className
      )}
      onClick={onClick}
      tabIndex={0}
      role="button"
      {...props}
    >
      <div className={cn("flex items-center justify-center w-12 h-12 rounded-lg", iconBg)}>
        {icon}
      </div>
      <div className="flex flex-col flex-1 min-w-0">
        <span className="font-semibold text-base truncate">{title}</span>
        {description && (
          <span className="text-xs text-muted-foreground mt-0.5 truncate">{description}</span>
        )}
      </div>
    </div>
  );
} 