"use client";

import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ApiError } from "@/lib/api/client";
import { cn } from "@/lib/utils";

/**
 * A failed request must never look like an empty result — an admin reading
 * "0 teams" when the API is actually down makes the wrong call. Every query
 * surface renders this instead of falling back to [] or "—".
 */
export function queryErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    return error.status === 401 || error.status === 403
      ? "Not authorized for this data (401). Your sign-in may have expired."
      : `${error.message} (${error.status})`;
  }
  if (error instanceof Error && error.message) return error.message;
  return "Could not reach the server.";
}

export function QueryError({
  error,
  onRetry,
  className,
}: {
  error: unknown;
  onRetry?: () => void;
  className?: string;
}) {
  return (
    <div
      role="alert"
      className={cn(
        "flex flex-wrap items-center gap-3 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm",
        className,
      )}
    >
      <AlertTriangle className="size-4 shrink-0 text-destructive" />
      <span className="flex-1 text-foreground">{queryErrorMessage(error)}</span>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry}>
          <RefreshCw className="size-3.5" />
          Retry
        </Button>
      )}
    </div>
  );
}
