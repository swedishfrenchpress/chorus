import { cn } from "@/lib/utils";

interface SectionProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  children: React.ReactNode;
}

export function Section({ title, children, className, ...props }: SectionProps) {
  return (
    <div className={cn("space-y-4", className)} {...props}>
      <div className="flex items-center gap-4">
        <div className="flex-1 h-px bg-border" />
        <h2 className="text-sm font-medium uppercase tracking-wider whitespace-nowrap">
          {title}
        </h2>
        <div className="flex-1 h-px bg-border" />
      </div>
      {children}
    </div>
  );
} 