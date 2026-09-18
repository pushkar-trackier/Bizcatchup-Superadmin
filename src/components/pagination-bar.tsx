import { Button } from "@/components/ui/button";

interface PaginationBarProps {
  offset: number;
  limit: number;
  total: number;
  onPageChange: (nextOffset: number) => void;
}

export function PaginationBar({ offset, limit, total, onPageChange }: PaginationBarProps) {
  const from = total === 0 ? 0 : offset + 1;
  const to = Math.min(offset + limit, total);

  return (
    <div className="flex items-center justify-between border-t px-4 py-3 text-sm text-muted-foreground">
      <span>
        {from}–{to} of {total}
      </span>
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={offset === 0}
          onClick={() => onPageChange(Math.max(0, offset - limit))}
        >
          Previous
        </Button>
        <Button variant="outline" size="sm" disabled={to >= total} onClick={() => onPageChange(offset + limit)}>
          Next
        </Button>
      </div>
    </div>
  );
}
