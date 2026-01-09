import { cn } from "@/lib/utils";
import { DECISION_LABELS } from "@/lib/calcul";

interface DecisionBadgeProps {
  decision: string | null;
  size?: 'sm' | 'md' | 'lg';
}

export function DecisionBadge({ decision, size = 'md' }: DecisionBadgeProps) {
  if (!decision) {
    return (
      <span className={cn(
        "inline-flex items-center rounded-full bg-muted text-muted-foreground",
        size === 'sm' && "px-1.5 py-0.5 text-xs",
        size === 'md' && "px-2.5 py-0.5 text-sm",
        size === 'lg' && "px-3 py-1 text-base"
      )}>
        -
      </span>
    );
  }

  const config = DECISION_LABELS[decision];
  
  if (!config) {
    return (
      <span className={cn(
        "inline-flex items-center rounded-full bg-muted text-muted-foreground",
        size === 'sm' && "px-1.5 py-0.5 text-xs",
        size === 'md' && "px-2.5 py-0.5 text-sm",
        size === 'lg' && "px-3 py-1 text-base"
      )}>
        {decision}
      </span>
    );
  }

  return (
    <span className={cn(
      "inline-flex items-center rounded-full text-white font-medium",
      config.color,
      size === 'sm' && "px-1.5 py-0.5 text-xs",
      size === 'md' && "px-2.5 py-0.5 text-sm",
      size === 'lg' && "px-3 py-1 text-base"
    )}>
      {decision}
    </span>
  );
}
