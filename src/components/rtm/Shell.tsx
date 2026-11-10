import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { MODULES, type ModuleId } from "@/lib/rtm/requirements";

export function Shell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen bg-background font-sans text-foreground">
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground md:flex">
        <div className="border-b border-sidebar-border p-5">
          <div className="font-mono text-xs uppercase tracking-widest text-sidebar-primary">RTM / Prototype</div>
          <div className="mt-1 text-lg font-semibold">Traceability Console</div>
        </div>
        <nav className="flex flex-col gap-1 p-3 text-sm">
          <NavItem to="/" label="Traceability Matrix" code="RTM" />
          {(Object.keys(MODULES) as ModuleId[]).map((m) => (
            <NavItem key={m} to={MODULES[m].path} label={MODULES[m].short} code={m} />
          ))}
        </nav>
        <div className="mt-auto p-5 font-mono text-[10px] leading-relaxed text-sidebar-foreground/60">
          R1–R50 · V-Model verified · runs in-browser on sample data
        </div>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <nav className="flex gap-2 overflow-x-auto border-b bg-sidebar p-2 md:hidden">
          <Link to="/" className="rounded px-2 py-1 font-mono text-xs text-sidebar-foreground">RTM</Link>
          {(Object.keys(MODULES) as ModuleId[]).map((m) => (
            <Link key={m} to={MODULES[m].path} className="rounded px-2 py-1 font-mono text-xs text-sidebar-foreground">{m}</Link>
          ))}
        </nav>
        <main className="bg-blueprint flex-1 p-4 md:p-8">{children}</main>
      </div>
    </div>
  );
}

function NavItem({ to, label, code }: { to: string; label: string; code: string }) {
  return (
    <Link
      to={to}
      activeOptions={{ exact: true }}
      className="flex items-center gap-3 rounded px-3 py-2 transition-colors hover:bg-sidebar-accent data-[status=active]:bg-sidebar-accent data-[status=active]:text-sidebar-accent-foreground"
    >
      <span className="w-10 font-mono text-[10px] text-sidebar-primary">{code}</span>
      <span>{label}</span>
    </Link>
  );
}

export function PageHeader({ code, title, children }: { code: string; title: string; children?: ReactNode }) {
  return (
    <header className="mb-6">
      <div className="font-mono text-xs uppercase tracking-widest text-primary">{code}</div>
      <h1 className="mt-1 text-3xl font-semibold tracking-tight">{title}</h1>
      {children && <p className="mt-2 max-w-3xl text-sm text-muted-foreground">{children}</p>}
    </header>
  );
}

export function Panel({ reqs, title, children, className = "" }: { reqs: string[]; title: string; children: ReactNode; className?: string }) {
  return (
    <section id={reqs[0]} className={`scroll-mt-6 rounded-md border bg-card p-4 shadow-sm ${className}`}>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        {reqs.map((r) => (
          <span key={r} className="rounded-sm bg-primary/10 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-primary">{r}</span>
        ))}
        <h2 className="text-sm font-semibold">{title}</h2>
      </div>
      {children}
    </section>
  );
}

export function Stat({ label, value, tone = "default" }: { label: string; value: ReactNode; tone?: "default" | "good" | "bad" | "warn" }) {
  const c = tone === "good" ? "text-success" : tone === "bad" ? "text-destructive" : tone === "warn" ? "text-warning" : "text-foreground";
  return (
    <div className="rounded border bg-background p-3">
      <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className={`mt-1 text-xl font-semibold ${c}`}>{value}</div>
    </div>
  );
}

export const Code = ({ children }: { children: ReactNode }) => (
  <pre className="max-h-72 overflow-auto rounded bg-sidebar p-3 font-mono text-[11px] leading-relaxed text-sidebar-foreground">{children}</pre>
);

export const money = (n: number) => "$" + Math.round(n).toLocaleString("en-US");
