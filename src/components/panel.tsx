import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** The design's surface: white card, 1px border, 14px radius. */
export function Panel({ children, className }: { children: ReactNode; className?: string }) {
  return <section className={cn("rounded-[14px] border bg-card", className)}>{children}</section>;
}

export function PageHead({
  title,
  description,
  actions,
}: {
  title: string;
  description?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end gap-4">
      <div className="flex flex-col gap-1">
        <h1 className="text-[26px] font-[650] tracking-[-0.01em]">{title}</h1>
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="ml-auto flex flex-wrap items-center gap-2.5">{actions}</div>}
    </div>
  );
}

/** Uppercase micro-heading used inside the detail panels. */
export function SectionLabel({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <h3 className={cn("text-[13px] font-semibold tracking-[0.05em] text-muted-foreground uppercase", className)}>
      {children}
    </h3>
  );
}

/**
 * Several controls in the design have no backend behind them yet. They are
 * rendered as the design draws them but disabled, with the reason in the
 * tooltip, rather than silently dropped or wired to nothing.
 */
export function NotWiredButton({
  children,
  reason,
  className,
}: {
  children: ReactNode;
  reason: string;
  className?: string;
}) {
  return (
    <button
      type="button"
      disabled
      title={reason}
      className={cn(
        "flex h-9 cursor-not-allowed items-center gap-2 rounded-[9px] border bg-card px-3.5 text-sm text-muted-foreground opacity-70",
        className,
      )}
    >
      {children}
    </button>
  );
}
