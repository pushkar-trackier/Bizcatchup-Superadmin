import Link from "next/link";
import { Fragment } from "react";

interface PageHeaderProps {
  title: string;
  breadcrumb: { label: string; href?: string }[];
}

export function PageHeader({ title, breadcrumb }: PageHeaderProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 pb-6">
      <h1 className="text-2xl font-semibold">{title}</h1>
      <nav className="text-sm text-muted-foreground">
        {breadcrumb.map((crumb, i) => (
          <Fragment key={crumb.label}>
            {i > 0 && <span className="mx-1.5">/</span>}
            {crumb.href ? (
              <Link href={crumb.href} className="text-primary hover:underline">
                {crumb.label}
              </Link>
            ) : (
              <span>{crumb.label}</span>
            )}
          </Fragment>
        ))}
      </nav>
    </div>
  );
}
