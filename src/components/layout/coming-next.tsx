import { Construction } from "lucide-react";

/**
 * A nav item that routes nowhere is worse than one that says what it will be,
 * so pages still to be built say so plainly rather than faking content.
 */
export function ComingNext({ title, note }: { title: string; note: string }) {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-[26px] font-[650] tracking-[-0.01em]">{title}</h1>
      <section className="flex flex-col items-center gap-3 rounded-[14px] border bg-card px-6 py-16 text-center">
        <Construction className="size-7 text-muted-foreground" aria-hidden />
        <p className="text-[15px] font-semibold">Not built yet</p>
        <p className="max-w-md text-sm text-muted-foreground">{note}</p>
      </section>
    </div>
  );
}
