import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Legend } from "recharts";
import { PageHeader, Panel, Stat, money } from "@/components/rtm/Shell";
import { Button } from "@/components/ui/button";
import { BUSINESSES, FUNDING_SOURCES, OPPORTUNITIES, PAYROLL_BENCHMARK, TOOLKIT, capitalGap, equitySplit, matchScore } from "@/lib/rtm/equity";

export const Route = createFileRoute("/equity")({
  head: () => ({
    meta: [
      { title: "Small Business Equity & Procurement · RTM Console" },
      { name: "description", content: "Procurement matching, revolving loan funds, equity separation and capital gap analysis for minority businesses." },
      { property: "og:title", content: "Small Business Equity & Procurement" },
      { property: "og:description", content: "Match certified businesses to contracts and close capital gaps." },
    ],
  }),
  component: Equity,
});

type Loan = { biz: string; amount: number; repaid: number };
const STAGES = ["Posted", "Bid submitted", "Certified review", "Awarded"] as const;

function Equity() {
  const [fund, setFund] = useState(250000);
  const [loans, setLoans] = useState<Loan[]>([{ biz: "Sweet Auburn Catering", amount: 25000, repaid: 8000 }]);
  const [stage, setStage] = useState<Record<string, number>>({});
  const [done, setDone] = useState<string[]>([]);
  const [selBiz, setSelBiz] = useState(BUSINESSES[1].id);
  const outstanding = loans.reduce((a, l) => a + l.amount - l.repaid, 0);
  const available = fund - outstanding;
  const totalRev = BUSINESSES.reduce((a, b) => a + b.revenue, 0);
  const avgPay = BUSINESSES.reduce((a, b) => a + b.payroll, 0) / BUSINESSES.reduce((a, b) => a + b.employees, 0);

  const lend = (biz: string, amount: number) => {
    if (amount > available) { toast.error("Exceeds available fund balance"); return; }
    setLoans((l) => [...l, { biz, amount, repaid: 0 }]);
    toast.success(`${money(amount)} disbursed to ${biz}`);
  };

  return (
    <div className="mx-auto max-w-6xl space-y-4">
      <PageHeader code="PF-3 · R21–R30" title="Small Business Equity & Procurement">
        Connect certified minority-owned businesses with public and corporate buyers, track revolving loans, and pinpoint capital gaps.
      </PageHeader>
      <Panel reqs={["R21"]} title="Ecosystem landscape & impact report">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <Stat label="Businesses tracked" value={BUSINESSES.length} />
          <Stat label="Combined revenue" value={money(totalRev)} />
          <Stat label="MBE-certified" value={`${BUSINESSES.filter((b) => b.certs.includes("MBE")).length}/${BUSINESSES.length}`} />
          <Stat label="Contracts awarded" value={Object.values(stage).filter((s) => s === 3).length} tone="good" />
        </div>
      </Panel>
      <Panel reqs={["R23", "R25"]} title="Procurement matching & bid workflow (race-conscious goal tracks / race-neutral streamlined tracks)">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="text-left text-muted-foreground"><tr><th className="p-1">Opportunity</th><th>Track</th><th>Value</th><th>Best match</th><th>Score</th><th>Workflow</th></tr></thead>
            <tbody>
              {OPPORTUNITIES.map((o) => {
                const best = [...BUSINESSES].sort((a, b) => matchScore(b, o) - matchScore(a, o))[0];
                const st = stage[o.id] ?? 0;
                return (
                  <tr key={o.id} className="border-t">
                    <td className="p-1"><div className="font-semibold">{o.buyer}</div><div className="text-muted-foreground">{o.type} · NAICS {o.naics}</div></td>
                    <td>{o.track}{o.goalPct ? ` · ${o.goalPct}% goal` : " · simplified bid"}</td>
                    <td className="font-mono">{money(o.value)}</td>
                    <td>{best.name}</td>
                    <td className="font-mono font-semibold">{matchScore(best, o)}</td>
                    <td>
                      <div className="flex items-center gap-2">
                        <span className="font-mono">{STAGES[st]}</span>
                        {st < 3 && <Button size="sm" variant="outline" className="h-6 px-2 text-[10px]" onClick={() => setStage({ ...stage, [o.id]: st + 1 })}>{o.track === "race-neutral" && st === 1 ? "Skip to award" : "Advance"}</Button>}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Panel>
      <div className="grid gap-4 lg:grid-cols-2">
        <Panel reqs={["R24"]} title="Revolving loan fund">
          <div className="grid grid-cols-3 gap-2">
            <Stat label="Fund size" value={money(fund)} />
            <Stat label="Outstanding" value={money(outstanding)} tone="warn" />
            <Stat label="Available" value={money(available)} tone="good" />
          </div>
          <table className="mt-2 w-full text-xs">
            <tbody>
              {loans.map((l, i) => (
                <tr key={i} className="border-t">
                  <td className="p-1">{l.biz}</td><td className="font-mono">{money(l.repaid)} / {money(l.amount)}</td>
                  <td><Button size="sm" variant="outline" className="h-6 px-2 text-[10px]" disabled={l.repaid >= l.amount} onClick={() => { setLoans(loans.map((x, j) => j === i ? { ...x, repaid: Math.min(x.amount, x.repaid + 5000) } : x)); setFund((f) => f); }}>Record $5k repayment</Button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>
        <Panel reqs={["R26", "R30"]} title="Equity separation & capital gap">
          <select value={selBiz} onChange={(e) => setSelBiz(e.target.value)} className="mb-2 h-8 w-full rounded border bg-background px-2 text-sm">
            {BUSINESSES.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
          {(() => {
            const b = BUSINESSES.find((x) => x.id === selBiz)!;
            const e = equitySplit(b), g = capitalGap(b);
            return (
              <>
                <div className="grid grid-cols-3 gap-2">
                  <Stat label="Business equity" value={money(e.businessEquity)} />
                  <Stat label="Home equity (excluded)" value={money(e.homeEquity)} />
                  <Stat label="Debt / equity" value={isFinite(g.debtToEquity) ? g.debtToEquity.toFixed(2) : "∞"} tone={g.debtToEquity > 2 ? "bad" : "good"} />
                </div>
                <p className="mt-2 text-xs">{Math.round(e.homeShare * 100)}% of this owner's net worth is in their home, not the business.</p>
                {g.flagged ? (
                  <div className="mt-2 flex items-center justify-between rounded border border-destructive/40 bg-destructive/5 p-2 text-xs">
                    <span>Capital gap: <b>{money(g.gap)}</b> → routed to targeted lending</span>
                    <Button size="sm" className="h-7" onClick={() => lend(b.name, Math.min(50000, Math.max(5000, Math.round(g.gap / 1000) * 1000)))}>Offer loan</Button>
                  </div>
                ) : <p className="mt-2 text-xs text-success">No capital gap detected.</p>}
              </>
            );
          })()}
        </Panel>
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <Panel reqs={["R27"]} title="Payroll & sales analytics" className="lg:col-span-2">
          <p className="mb-2 text-xs text-muted-foreground">Portfolio avg pay/worker: <b>{money(avgPay)}</b> · benchmarks: minority-owned {money(PAYROLL_BENCHMARK.minority)}, non-minority {money(PAYROLL_BENCHMARK.nonMinority)}</p>
          <div className="h-52">
            <ResponsiveContainer>
              <BarChart data={BUSINESSES.map((b) => ({ name: b.name.split(" ")[0], "Pay / worker": Math.round(b.payroll / b.employees), "Sales / worker": Math.round(b.revenue / b.employees / 4) }))}>
                <XAxis dataKey="name" tick={{ fontSize: 10 }} /><YAxis tick={{ fontSize: 10 }} /><Tooltip /><Legend wrapperStyle={{ fontSize: 10 }} />
                <Bar dataKey="Pay / worker" fill="var(--chart-1)" /><Bar dataKey="Sales / worker" fill="var(--chart-2)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <p className="text-[10px] text-muted-foreground">Sales/worker shown ÷4 for scale.</p>
        </Panel>
        <Panel reqs={["R28"]} title="Alternative capital sources">
          <ul className="space-y-1 text-xs">{FUNDING_SOURCES.map((f) => <li key={f.name} className="flex justify-between border-b pb-1"><span><b>{f.name}</b><br /><span className="text-muted-foreground">{f.kind}</span></span><span className="font-mono">≤{money(f.max)}</span></li>)}</ul>
        </Panel>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Panel reqs={["R22"]} title="Capacity-building & mentoring toolkit">
          <ul className="space-y-1 text-xs">
            {TOOLKIT.map((t) => (
              <li key={t.title} className="flex items-center justify-between">
                <span>{t.title} <span className="text-muted-foreground">· {t.level}</span></span>
                <Button size="sm" variant={done.includes(t.title) ? "secondary" : "outline"} className="h-6 px-2 text-[10px]" onClick={() => setDone((d) => d.includes(t.title) ? d : [...d, t.title])}>{done.includes(t.title) ? "Completed" : "Start"}</Button>
              </li>
            ))}
          </ul>
          <p className="mt-2 font-mono text-[10px]">Progress {done.length}/{TOOLKIT.length}</p>
        </Panel>
        <Panel reqs={["R29"]} title="Local market access — corridor directory">
          <ul className="space-y-1 text-xs">
            {BUSINESSES.map((b) => (
              <li key={b.id} className="flex justify-between border-b pb-1">
                <span>{b.name} <span className="text-muted-foreground">· {b.zone}</span></span>
                <Button size="sm" variant="outline" className="h-6 px-2 text-[10px]" onClick={() => toast.success(`Geo-targeted campaign launched: 3 mi around ${b.zone}`)}>Launch local campaign</Button>
              </li>
            ))}
          </ul>
        </Panel>
      </div>
    </div>
  );
}
