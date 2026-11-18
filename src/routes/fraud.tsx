import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts";
import { VerificationQueue } from "@/components/directory/VerificationQueue";
import { Code, PageHeader, Panel, Stat } from "@/components/rtm/Shell";
import { Button } from "@/components/ui/button";
import { BUCKETS, posteriorMeanSamples, runBirdnest, syntheticRatings } from "@/lib/rtm/birdnest";

export const Route = createFileRoute("/fraud")({
  head: () => ({
    meta: [
      { title: "Community trust · Neighborly" },
      {
        name: "description",
        content:
          "Bayesian rating fraud detection with NEST scores, burst and promo-spam detection, and moderator sanctions.",
      },
      { property: "og:title", content: "BIRDNEST Fraud Detection" },
      {
        property: "og:description",
        content: "NEST scoring, burst detection and moderator sanctions.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Fraud,
});

type Sanction = "badge revoked" | "reviews purged" | "listing suspended";

function Fraud() {
  const [seed, setSeed] = useState(42);
  const [K, setK] = useState(3);
  const [tau, setTau] = useState(4);
  const [sanctions, setSanctions] = useState<Record<string, Sanction[]>>({});
  const [log, setLog] = useState<string[]>([]);
  const ratings = useMemo(() => syntheticRatings(seed), [seed]);
  const { scores, ms } = useMemo(() => {
    const t0 = performance.now();
    const scores = runBirdnest(ratings, K);
    return { scores, ms: performance.now() - t0 };
  }, [ratings, K]);
  const [shownMs, setShownMs] = useState<number | null>(null);
  useEffect(() => setShownMs(ms), [ms]);
  const [sel, setSel] = useState<string | null>(null);
  const flagged = scores.filter((s) => s.nest > tau);
  const current = scores.find((s) => s.user === (sel ?? scores[0]?.user)) ?? scores[0];
  const post = useMemo(() => {
    if (!current) return [];
    const samples = posteriorMeanSamples([1, 1, 1, 1, 1], current.ratingCounts);
    const bins = Array.from({ length: 40 }, (_, i) => ({ x: (1 + (i * 4) / 40).toFixed(1), n: 0 }));
    samples.forEach((v) => bins[Math.min(39, Math.floor(((v - 1) / 4) * 40))].n++);
    return bins;
  }, [current]);
  const precision = (k: number) => {
    const top = scores.slice(0, k);
    return Math.round((top.filter((s) => !s.user.startsWith("user_")).length / k) * 100);
  };
  const apply = (user: string, s: Sanction) => {
    setSanctions((p) => ({ ...p, [user]: [...new Set([...(p[user] ?? []), s])] }));
    setLog((l) => [`${new Date().toLocaleTimeString()} · ${user} → ${s}`, ...l]);
    toast.success(`${user}: ${s}`);
  };

  if (!current) return null;
  return (
    <div className="mx-auto max-w-6xl space-y-4">
      <PageHeader code="PF-2 · R11–R20" title="BIRDNEST Fraud Detection & Moderation">
        Review unusual activity, protect honest feedback, and manage business verification.
      </PageHeader>
      <VerificationQueue />
      <h2 className="pt-4 font-display text-2xl">Review fraud risk</h2>
      <p className="text-xs text-muted-foreground">
        BIRDNEST review signals · sample activity, not a verdict on the businesses above.
      </p>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        <Stat label="Ratings" value={ratings.length.toLocaleString()} />
        <Stat label="Users" value={scores.length} />
        <Stat label="Needs attention" value={flagged.length} tone="bad" />
        <Stat label="Detection confidence" value={`${precision(10)}%`} tone="good" />
        <Stat label="Last scan" value={shownMs === null ? "—" : `${shownMs.toFixed(0)} ms`} />
      </div>

      <Panel
        reqs={["R11", "R18"]}
        title="Mixture model controls — EM over rating + time-gap counts, O(#it·m·K)"
      >
        <div className="flex flex-wrap items-center gap-4 text-sm">
          <label className="flex items-center gap-2">
            Activity groups{" "}
            <input
              type="number"
              min={1}
              max={6}
              value={K}
              onChange={(e) => setK(+e.target.value || 1)}
              className="h-8 w-16 rounded border bg-background px-2"
            />
          </label>
          <label className="flex items-center gap-2">
            Sensitivity{" "}
            <input
              type="range"
              min={1}
              max={10}
              step={0.5}
              value={tau}
              onChange={(e) => setTau(+e.target.value)}
            />{" "}
            <span className="font-mono">{tau}</span>
          </label>
          <Button variant="outline" size="sm" onClick={() => setSeed((s) => s + 1)}>
            Refresh activity
          </Button>
        </div>
      </Panel>

      <div className="grid gap-4 lg:grid-cols-5">
        <Panel
          reqs={["R12", "R13", "R16", "R17"]}
          title="Ranked suspicion — NEST = sₓ/σₓ + s_Δ/σ_Δ"
          className="lg:col-span-3"
        >
          <div className="max-h-[420px] overflow-auto">
            <table className="w-full text-xs">
              <thead className="sticky top-0 bg-card text-left text-muted-foreground">
                <tr>
                  <th className="p-1">Account</th>
                  <th>Reviews</th>
                  <th>Rating</th>
                  <th>Rating risk</th>
                  <th>Timing risk</th>
                  <th>Risk</th>
                  <th>Signals</th>
                </tr>
              </thead>
              <tbody>
                {scores.slice(0, 40).map((s) => (
                  <tr
                    key={s.user}
                    onClick={() => setSel(s.user)}
                    className={`cursor-pointer border-t font-mono ${s.user === current.user ? "bg-primary/10" : "hover:bg-muted"}`}
                  >
                    <td className="p-1">{s.user}</td>
                    <td>{s.n}</td>
                    <td>{s.avg.toFixed(1)}</td>
                    <td>{s.sx.toFixed(1)}</td>
                    <td>{s.sd.toFixed(1)}</td>
                    <td className={s.nest > tau ? "font-semibold text-destructive" : ""}>
                      {s.nest.toFixed(2)}
                    </td>
                    <td className="space-x-1">
                      {s.burst === "boost" && <Tag>Rating boost</Tag>}
                      {s.burst === "defame" && <Tag>Negative burst</Tag>}
                      {s.dupText && <Tag>Repeated promotions</Tag>}
                      {sanctions[s.user]?.length ? <Tag tone="ok">sanctioned</Tag> : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
        <div className="space-y-4 lg:col-span-2">
          <Panel
            reqs={["R19"]}
            title={`Posterior of ${current.user}'s mean rating (10,000 Dirichlet draws)`}
          >
            <div className="h-40">
              <ResponsiveContainer>
                <BarChart data={post}>
                  <XAxis dataKey="x" tick={{ fontSize: 9 }} interval={7} />
                  <YAxis hide />
                  <Tooltip />
                  <Bar dataKey="n" fill="var(--chart-1)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Panel>
          <Panel
            reqs={["R14"]}
            title={`Log time-gap buckets (${BUCKETS} buckets, seconds → 1 year)`}
          >
            <div className="flex h-20 items-end gap-0.5">
              {current.iatCounts.map((c, i) => {
                const max = Math.max(1, ...current.iatCounts);
                return (
                  <div
                    key={i}
                    title={`bucket ${i}: ${c}`}
                    className="flex-1 rounded-t-sm bg-chart-2"
                    style={{ height: `${(c / max) * 100}%`, minHeight: 2 }}
                  />
                );
              })}
            </div>
            <div className="mt-1 flex justify-between font-mono text-[9px] text-muted-foreground">
              <span>~1s</span>
              <span>~1h</span>
              <span>~1y</span>
            </div>
          </Panel>
          <Panel reqs={["R15"]} title="Moderator sanctions (US 15)">
            <div className="flex flex-wrap gap-2">
              {(["badge revoked", "reviews purged", "listing suspended"] as Sanction[]).map((s) => (
                <Button
                  key={s}
                  size="sm"
                  variant={current.nest > tau ? "default" : "outline"}
                  onClick={() => apply(current.user, s)}
                >
                  {s}
                </Button>
              ))}
            </div>
            <Button
              size="sm"
              variant="destructive"
              className="mt-2 w-full"
              onClick={() => flagged.forEach((f) => apply(f.user, "reviews purged"))}
            >
              Auto-purge all {flagged.length} flagged
            </Button>
            <div className="mt-2 max-h-24 overflow-auto font-mono text-[10px] text-muted-foreground">
              {log.map((l, i) => (
                <div key={i}>{l}</div>
              ))}
            </div>
          </Panel>
        </div>
      </div>
      <Panel reqs={["R20"]} title="Open-source verification worker interface">
        <p className="mb-2 text-xs text-muted-foreground">
          Download the activity report for a second review.
        </p>
        <Code>
          {[
            "user_id,nest,s_x,s_delta,n",
            ...flagged.map(
              (f) => `${f.user},${f.nest.toFixed(3)},${f.sx.toFixed(3)},${f.sd.toFixed(3)},${f.n}`,
            ),
          ].join("\n")}
        </Code>
      </Panel>
    </div>
  );
}

const Tag = ({ children, tone }: { children: string; tone?: "ok" }) => (
  <span
    className={`rounded-sm px-1 text-[9px] ${tone ? "bg-success/15 text-success" : "bg-destructive/15 text-destructive"}`}
  >
    {children}
  </span>
);
