import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { TeamStatus } from "@/lib/types/view";

export function StatusPill({ status }: { status: TeamStatus }) {
  const isActive = status === "active";
  return (
    <Badge
      variant="outline"
      className={cn(
        "border-transparent capitalize",
        isActive ? "bg-emerald-100 text-emerald-700" : "bg-muted text-muted-foreground",
      )}
    >
      {status}
    </Badge>
  );
}
