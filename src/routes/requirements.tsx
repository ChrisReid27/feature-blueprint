import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { PageHeader } from "@/components/rtm/Shell";
import { MODULES, REQUIREMENTS, type ModuleId } from "@/lib/rtm/requirements";

export const Route = createFileRoute("/requirements")({
  head: () => ({
    meta: [
      { title: "Requirements Traceability Matrix · Neighborly" },
      {
        name: "description",
        content:
          "Bi-directional matrix mapping R1–R50 to five prototype modules, each linked to its working feature.",
      },
      { property: "og:title", content: "Requirements Traceability Matrix" },
      { property: "og:description", content: "R1–R50 mapped to the Neighborly product tools." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Matrix,
});

const IDS = Object.keys(MODULES) as ModuleId[];

function Matrix() {
  const [q, setQ] = useState("");
  const [mod, setMod] = useState<ModuleId | "all">("all");
  const rows = useMemo(
    () =>
      REQUIREMENTS.filter(
        (r) =>
          (mod === "all" || r.module === mod) &&
          (r.id + r.text).toLowerCase().includes(q.toLowerCase()),
      ),
    [q, mod],
  );
  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader code="RTM · V-Model" title="Requirements">
        Explore the original 50 requirements and the product tools they map to. These are sample
        implementations, not production integrations.
      </PageHeader>
      <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-5">
        {IDS.map((m) => (
          <Link
            key={m}
            to={MODULES[m].path}
            className="rounded-md border bg-card p-3 transition-colors hover:border-primary"
          >
            <div className="font-mono text-xs text-primary">{m}</div>
            <div className="mt-1 text-sm font-semibold leading-tight">{MODULES[m].name}</div>
            <div className="mt-2 font-mono text-[10px] text-muted-foreground">
              {REQUIREMENTS.filter((r) => r.module === m).length} reqs · 100% traced
            </div>
          </Link>
        ))}
      </div>
      <div className="mb-3 flex flex-wrap gap-2">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search R-id or text…"
          className="h-9 flex-1 rounded border bg-card px-3 text-sm"
        />
        <select
          value={mod}
          onChange={(e) => setMod(e.target.value as ModuleId | "all")}
          className="h-9 rounded border bg-card px-2 text-sm"
        >
          <option value="all">All modules</option>
          {IDS.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>
      </div>
      <div className="overflow-x-auto rounded-md border bg-card">
        <table className="w-full text-sm">
          <thead className="bg-sidebar text-sidebar-foreground">
            <tr>
              <th className="p-2 text-left font-mono text-xs">ID</th>
              <th className="p-2 text-left text-xs">Requirement</th>
              {IDS.map((m) => (
                <th key={m} className="w-14 p-2 font-mono text-xs">
                  {m}
                </th>
              ))}
              <th className="p-2 text-xs">Trace</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-t hover:bg-muted/60">
                <td className="p-2 font-mono text-xs font-semibold">{r.id}</td>
                <td className="p-2">{r.text}</td>
                {IDS.map((m) => (
                  <td key={m} className="p-2 text-center">
                    {r.module === m && (
                      <span className="inline-block h-3 w-3 rounded-sm bg-primary" aria-label="X" />
                    )}
                  </td>
                ))}
                <td className="p-2 text-center">
                  <Link
                    to={MODULES[r.module].path}
                    hash={r.id}
                    className="font-mono text-xs text-primary underline-offset-2 hover:underline"
                  >
                    open →
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
