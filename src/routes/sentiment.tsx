import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Cell } from "recharts";
import { PageHeader, Panel, Stat } from "@/components/rtm/Shell";
import { Button } from "@/components/ui/button";
import { LOSS_AVERSION, SAMPLE_REVIEWS, analyze, cronbachAlpha, empatheticReply, volumeSpikes, type Platform, type Review } from "@/lib/rtm/sentiment";

export const Route = createFileRoute("/sentiment")({
  head: () => ({
    meta: [
      { title: "Customer voices · Neighborly" },
      { name: "description", content: "Harvest reviews across platforms, detect sarcasm, prioritize negatives, spot pile-ons and reply with empathy." },
      { property: "og:title", content: "Social Sentiment & Reputation Management" },
      { property: "og:description", content: "Protect your local business reputation." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Sentiment,
});

const PLATFORMS: Platform[] = ["Google", "Instagram", "Zomato", "Swiggy", "Facebook", "X"];
const SURVEY = [[4, 5, 4, 4], [3, 3, 4, 3], [5, 5, 5, 4], [2, 2, 3, 2], [4, 4, 4, 5], [3, 4, 3, 3], [5, 4, 5, 5], [2, 3, 2, 2]];

function Sentiment() {
  const [reviews, setReviews] = useState<Review[]>(SAMPLE_REVIEWS);
  const [enabled, setEnabled] = useState<Platform[]>(PLATFORMS);
  const [text, setText] = useState("");
  const [plat, setPlat] = useState<Platform>("Google");
  const [zone, setZone] = useState("Shaw");
  const [replies, setReplies] = useState<Record<number, { text: string; status: "drafted" | "sent" }>>({});
  const [survey, setSurvey] = useState(SURVEY.map((r) => r.join(",")).join("\n"));

  const all = useMemo(() => reviews.filter((r) => enabled.includes(r.platform)).map(analyze), [reviews, enabled]);
  const queue = [...all].sort((a, b) => b.priority - a.priority);
  const days = Array.from({ length: 8 }, (_, i) => all.filter((r) => r.day === i + 1).length);
  const spikes = volumeSpikes(days);
  const zones = [...new Set(all.map((r) => r.zone))].map((z) => {
    const rs = all.filter((r) => r.zone === z);
    return { z, n: rs.length, net: Math.round((rs.reduce((a, r) => a + (r.label === "positive" ? 1 : r.label === "negative" ? -1 : 0), 0) / rs.length) * 100) };
  });
  const aspects = (["product", "service", "ambience"] as const).map((a) => {
    const rs = all.filter((r) => r.aspect === a);
    return { a, n: rs.length, neg: rs.filter((r) => r.label === "negative").length };
  });
  const rows = survey.split("\n").map((l) => l.split(",").map(Number)).filter((r) => r.length > 1 && r.every((n) => !isNaN(n)));
  const alpha = rows.length > 2 ? cronbachAlpha(rows) : NaN;
  const critical = queue.filter((r) => r.label === "negative" && r.priority > 1.2 && replies[r.id]?.status !== "sent");
  const neg = all.filter((r) => r.label === "negative").length;

  return (
    <div className="mx-auto max-w-6xl space-y-4">
      <PageHeader code="PF-5 · R41–R50" title="Sentiment & Reputation Management">
        See what customers love, prioritize concerns, and write thoughtful replies.
      </PageHeader>
      {critical.length > 0 && (
        <div id="R49" className="flex items-center justify-between rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm">
          <span><b>{critical.length} high-risk reviews</b> need a reply{spikes.some(Boolean) && " · review pile-on in progress"}</span>
        </div>
      )}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="Reviews" value={all.length} />
        <Stat label="Negative" value={neg} tone="bad" />
        <Stat label="Subtle concerns" value={all.filter((r) => r.sarcasm).length} tone="warn" />
        <Stat label="Replied" value={Object.values(replies).filter((r) => r.status === "sent").length} tone="good" />
      </div>
      <Panel reqs={["R41"]} title="Multi-platform harvesting">
        <div className="mb-2 flex flex-wrap gap-2">
          {PLATFORMS.map((p) => (
            <Button key={p} size="sm" variant={enabled.includes(p) ? "default" : "outline"} onClick={() => setEnabled((e) => (e.includes(p) ? e.filter((x) => x !== p) : [...e, p]))}>{p}</Button>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          <select value={plat} onChange={(e) => setPlat(e.target.value as Platform)} className="h-9 rounded border bg-background px-2 text-sm">{PLATFORMS.map((p) => <option key={p}>{p}</option>)}</select>
          <input value={zone} onChange={(e) => setZone(e.target.value)} placeholder="Zone" className="h-9 w-28 rounded border bg-background px-2 text-sm" />
          <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Paste customer feedback…" className="h-9 min-w-48 flex-1 rounded border bg-background px-2 text-sm" />
          <Button onClick={() => { if (!text.trim()) return; setReviews((r) => [...r, { id: r.length, platform: plat, zone, text, day: 8 }]); setText(""); }}>Add review</Button>
        </div>
      </Panel>
      <div className="grid gap-4 lg:grid-cols-5">
        <Panel reqs={["R42", "R43", "R44", "R46"]} title={`Priority queue — loss-aversion weight ×${LOSS_AVERSION} on negatives`} className="lg:col-span-3">
          <div className="max-h-[480px] space-y-2 overflow-auto">
            {queue.map((r) => (
              <div key={r.id} className="rounded border bg-background p-2 text-xs">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`rounded-sm px-1.5 font-semibold ${r.label === "negative" ? "bg-destructive/15 text-destructive" : r.label === "positive" ? "bg-success/15 text-success" : "bg-muted text-muted-foreground"}`}>{r.label}</span>
                  {r.sarcasm && <span className="rounded-sm bg-warning/20 px-1.5">sarcasm</span>}
                  <span className="text-muted-foreground">{r.platform} · {r.zone} · {r.aspect}</span>
                  
                </div>
                <p className="mt-1">"{r.text}"</p>
                {replies[r.id] ? (
                  <div className="mt-1 rounded bg-muted p-2">
                    <textarea value={replies[r.id].text} disabled={replies[r.id].status === "sent"} onChange={(e) => setReplies({ ...replies, [r.id]: { ...replies[r.id], text: e.target.value } })} className="w-full rounded border bg-background p-1" rows={2} />
                    {replies[r.id].status === "sent" ? <span className="text-success">✓ Reply saved for {r.platform}</span> : <Button size="sm" className="mt-1 h-6 text-[10px]" onClick={() => { setReplies({ ...replies, [r.id]: { ...replies[r.id], status: "sent" } }); toast.success("Reply saved in this preview"); }}>Approve reply</Button>}
                  </div>
                ) : <Button size="sm" variant="outline" className="mt-1 h-6 text-[10px]" onClick={() => setReplies({ ...replies, [r.id]: { text: empatheticReply(r), status: "drafted" } })}>Draft empathetic reply</Button>}
              </div>
            ))}
          </div>
        </Panel>
        <div className="space-y-4 lg:col-span-2">
          <Panel reqs={["R45"]} title="Herd behavior — daily volume spikes (> mean + 2σ)">
            <div className="h-32">
              <ResponsiveContainer><BarChart data={days.map((n, i) => ({ d: `D${i + 1}`, n }))}><XAxis dataKey="d" tick={{ fontSize: 10 }} /><YAxis hide /><Tooltip /><Bar dataKey="n">{days.map((_, i) => <Cell key={i} fill={spikes[i] ? "var(--destructive)" : "var(--chart-2)"} />)}</Bar></BarChart></ResponsiveContainer>
            </div>
          </Panel>
          <Panel reqs={["R47"]} title="Mental accounting — product vs service vs ambience">
            {aspects.map((a) => <div key={a.a} className="flex justify-between border-b py-1 text-xs"><span className="capitalize">{a.a}</span><span className="font-mono">{a.n} reviews · {a.neg} negative</span></div>)}
          </Panel>
          <Panel reqs={["R48"]} title="Urban-zone sentiment (Navi Mumbai)">
            {zones.map((z) => <div key={z.z} className="flex items-center gap-2 py-0.5 text-xs"><span className="w-20">{z.z}</span><div className="h-2 flex-1 rounded bg-muted"><div className={`h-2 rounded ${z.net >= 0 ? "bg-success" : "bg-destructive"}`} style={{ width: `${Math.abs(z.net)}%` }} /></div><span className="w-10 text-right font-mono">{z.net > 0 ? "+" : ""}{z.net}</span></div>)}
          </Panel>
          <Panel reqs={["R50"]} title="Instrument reliability — Cronbach's α">
            <textarea value={survey} onChange={(e) => setSurvey(e.target.value)} rows={4} className="w-full rounded border bg-background p-2 font-mono text-xs" />
            <Stat label="Survey confidence" value={isNaN(alpha) ? "—" : alpha.toFixed(3)} tone={alpha > 0.8 ? "good" : "bad"} />
          </Panel>
        </div>
      </div>
    </div>
  );
}
