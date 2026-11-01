import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Card({
  children,
  className,
  ...rest
}: { children: ReactNode; className?: string | undefined } & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-3xl border border-border bg-card p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_12px_32px_-24px_rgba(15,23,42,0.35)]",
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  );
}

export function SectionTitle({ icon, title, sub }: { icon?: string | undefined; title: string; sub?: string | undefined }) {
  return (
    <div className="mb-5">
      <h1 className="text-2xl font-bold sm:text-3xl">
        {icon ? <span className="mr-2">{icon}</span> : null}
        {title}
      </h1>
      {sub ? <p className="mt-1 text-sm text-muted-foreground">{sub}</p> : null}
    </div>
  );
}

export function Bar({ value, className }: { value: number; className?: string | undefined }) {
  return (
    <div className="h-2.5 w-full overflow-hidden rounded-full bg-secondary">
      <div
        className={cn("h-full rounded-full bg-brand transition-all duration-700", className)}
        style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
      />
    </div>
  );
}

export function Pill({
  children,
  tone = "muted",
}: {
  children: ReactNode;
  tone?: "muted" | "good" | "warn" | "bad" | "brand";
}) {
  const tones: Record<string, string> = {
    muted: "bg-secondary text-secondary-foreground",
    good: "bg-mint/15 text-mint",
    warn: "bg-amber/20 text-amber",
    bad: "bg-rose/15 text-rose",
    brand: "bg-brand/12 text-brand",
  };
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold", tones[tone])}>
      {children}
    </span>
  );
}

export function BigButton({
  children,
  className,
  variant = "primary",
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "soft" | "ghost" }) {
  const variants = {
    primary:
      "bg-brand text-primary-foreground hover:bg-brand-deep active:scale-[0.985] shadow-[0_10px_24px_-14px_var(--brand)]",
    soft: "bg-secondary text-secondary-foreground hover:bg-accent active:scale-[0.985]",
    ghost: "border border-border bg-card hover:bg-accent",
  };
  return (
    <button
      className={cn(
        "inline-flex w-full items-center justify-center gap-2 rounded-2xl px-5 py-3.5 text-base font-semibold transition-all disabled:cursor-not-allowed disabled:opacity-50",
        variants[variant],
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  );
}
