import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Code, PageHeader, Panel, Stat } from "@/components/rtm/Shell";
import { Button } from "@/components/ui/button";
import { answerBlocks, clusters, comprehensiveness, cwv, eeatGate, forecast, hreflang, intent, internalLinks, jsonLd, parseSections } from "@/lib/rtm/seo";

export const Route = createFileRoute("/seo")({
  head: () => ({
    meta: [
      { title: "AI-SEO & GEO Engine · RTM Console" },
      { name: "description", content: "Answer blocks, JSON-LD, topic clusters, internal links, hreflang and an E-E-A-T publish gate." },
      { property: "og:title", content: "AI-SEO & Generative Engine Optimization" },
      { property: "og:description", content: "Optimize drafts for AI Overviews and LLM search." },
    ],
  }),
  component: Seo,
});

const DRAFT = `# Solar Panel Maintenance Guide
## How often should solar panels be cleaned?
Most residential solar panels should be cleaned two to four times per year. Dust, pollen and bird droppings can cut energy output by 5 to 25 percent depending on climate. Homes in desert regions such as Dubai or Riyadh need monthly cleaning because sand accumulates quickly. Use soft brushes and deionized water rather than pressure washers, which can damage the anti-reflective coating and void the inverter warranty.
## What tools do I need?
A soft brush, a squeegee and a hose are enough for most roofs. Professional crews use water-fed poles.`;

const PAGES = [
  { url: "/solar-inverters", keyword: "inverter", inbound: 3 },
  { url: "/anti-reflective-coating", keyword: "anti-reflective coating", inbound: 0 },
  { url: "/desert-solar", keyword: "desert", inbound: 0 },
  { url: "/roof-safety", keyword: "ladder", inbound: 2 },
];

function Seo() {
  const [title, setTitle] = useState("Solar Panel Maintenance Guide");
  const [draft, setDraft] = useState(DRAFT);
  const [terms, setTerms] = useState("cleaning frequency, deionized water, warranty, efficiency loss, bird droppings, monitoring app, professional service, cost");
  const [kws, setKws] = useState("solar panel cleaning cost\nbest solar panel cleaning kit\nsolar panel cleaning near me\nhow to clean solar panels\nsolar inverter maintenance\nsolar inverter vs microinverter\nsolar panel efficiency loss");
  const [trend, setTrend] = useState("120, 135, 150, 170, 160, 190, 210");
  const [vitals, setVitals] = useState({ lcp: 2.1, inp: 240, cls: 0.05 });
  const [gate, setGate] = useState({ author: "", credentials: "", citations: 0, reviewer: "" });
  const [status, setStatus] = useState<"draft" | "in review" | "published">("draft");

  const sections = useMemo(() => parseSections(draft), [draft]);
  const blocks = answerBlocks(sections);
  const ld = jsonLd(title, gate.author, sections, "https://example.com/en/solar-maintenance");
  const comp = comprehensiveness(draft, terms.split(",").map((t) => t.trim()).filter(Boolean));
  const kwList = kws.split("\n").map((k) => k.trim()).filter(Boolean);
  const cl = clusters(kwList, "solar");
  const series = trend.split(",").map(Number).filter((n) => !isNaN(n));
  const fc = series.length > 1 ? forecast(series) : [];
  const links = internalLinks(draft, PAGES);
  const v = cwv(vitals.lcp, vitals.inp, vitals.cls);
  const eeat = eeatGate(gate);
  const questions = sections.filter((s) => s.heading.endsWith("?")).map((s) => s.heading);

  return (
    <div className="mx-auto max-w-6xl space-y-4">
      <PageHeader code="PF-1 · R1–R10" title="AI-SEO & Generative Engine Optimization">
        Write or paste a draft in Markdown. Every panel below updates live to show how AI search engines will read and cite it.
      </PageHeader>
      <div className="grid gap-4 lg:grid-cols-2">
        <Panel reqs={["R10"]} title="Draft editor (human-in-the-loop)">
          <input value={title} onChange={(e) => setTitle(e.target.value)} className="mb-2 h-9 w-full rounded border bg-background px-3 text-sm font-semibold" />
          <textarea value={draft} onChange={(e) => setDraft(e.target.value)} rows={14} className="w-full rounded border bg-background p-3 font-mono text-xs" />
        </Panel>
        <Panel reqs={["R1"]} title="Extractable answer blocks (target 50–75 words after each H2/H3)">
          <div className="space-y-2">
            {blocks.map((b) => (
              <div key={b.heading} className="rounded border bg-background p-2">
                <div className="flex justify-between text-xs font-semibold"><span>{b.heading}</span><span className={b.ok ? "text-success" : "text-warning"}>{b.words} words {b.ok ? "✓" : "– adjust"}</span></div>
                <p className="mt-1 text-xs text-muted-foreground">{b.block}</p>
              </div>
            ))}
          </div>
        </Panel>
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <Panel reqs={["R6"]} title="Comprehensiveness vs top-20 SERP terms">
          <Stat label="Coverage score" value={`${comp.score}/100`} tone={comp.score >= 70 ? "good" : "warn"} />
          <textarea value={terms} onChange={(e) => setTerms(e.target.value)} rows={3} className="mt-2 w-full rounded border bg-background p-2 text-xs" />
          <p className="mt-1 text-xs text-muted-foreground">Missing: {comp.missing.join(", ") || "none"}</p>
        </Panel>
        <Panel reqs={["R4"]} title="Internal linking & orphan pages">
          <ul className="space-y-1 text-xs">
            {links.map((l) => (
              <li key={l.url} className="flex justify-between gap-2 border-b pb-1">
                <span className="font-mono">{l.url}{l.orphan && <span className="ml-1 text-destructive">orphan</span>}</span>
                <span className={l.suggest ? "text-success" : "text-muted-foreground"}>{l.suggest ? `link "${l.keyword}"` : "no anchor in draft"}</span>
              </li>
            ))}
          </ul>
        </Panel>
        <Panel reqs={["R5"]} title="Multi-modal: voice & conversational variants">
          <ul className="list-disc space-y-1 pl-4 text-xs">
            {questions.map((q) => <li key={q}>"Hey Google, {q.toLowerCase()}"</li>)}
            {questions.map((q) => <li key={q + "c"}>Conversational: "{q.replace(/\?$/, "")} for my home?"</li>)}
            <li>Image alt: "{title} – technician cleaning rooftop solar panels with soft brush"</li>
          </ul>
        </Panel>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Panel reqs={["R2"]} title="JSON-LD structured data (Article + FAQPage)">
          <Code>{`<script type="application/ld+json">\n${JSON.stringify(ld, null, 2)}\n</script>`}</Code>
        </Panel>
        <Panel reqs={["R3", "R7"]} title="Topic clusters, intent & trend forecast">
          <textarea value={kws} onChange={(e) => setKws(e.target.value)} rows={4} className="w-full rounded border bg-background p-2 font-mono text-xs" />
          <div className="mt-2 rounded border bg-background p-2 text-xs">
            <div className="font-semibold">Pillar: {title}</div>
            {cl.map((c) => (
              <div key={c.head} className="ml-3 mt-1 border-l pl-2">
                <span className="font-mono text-primary">{c.head}</span>
                {c.kws.map((k) => <div key={k} className="ml-2">{k} <span className="text-muted-foreground">· {intent(k)}</span></div>)}
              </div>
            ))}
          </div>
          <label className="mt-2 block text-xs">Monthly search volume <input value={trend} onChange={(e) => setTrend(e.target.value)} className="h-8 w-full rounded border bg-background px-2 font-mono" /></label>
          <p className="mt-1 text-xs">Forecast next 3 months: <span className="font-mono font-semibold">{fc.join(" → ")}</span></p>
        </Panel>
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <Panel reqs={["R8"]} title="Technical audit — Core Web Vitals">
          {([["lcp", "LCP (s)", 0.1], ["inp", "INP (ms)", 10], ["cls", "CLS", 0.01]] as const).map(([k, label, step]) => (
            <label key={k} className="mb-1 flex items-center justify-between gap-2 text-xs">
              {label}
              <input type="number" step={step} value={vitals[k]} onChange={(e) => setVitals({ ...vitals, [k]: +e.target.value })} className="h-7 w-20 rounded border bg-background px-2" />
              <span className={v[k] ? "text-success" : "text-destructive"}>{v[k] ? "good" : "needs work"}</span>
            </label>
          ))}
          {!v.inp && <p className="mt-1 text-xs text-muted-foreground">Fix: break up long tasks and defer third-party scripts.</p>}
          {!v.lcp && <p className="mt-1 text-xs text-muted-foreground">Fix: preload hero image, serve AVIF/WebP.</p>}
        </Panel>
        <Panel reqs={["R9"]} title="Bilingual EN/AR hreflang">
          <Code>{hreflang("https://example.com/solar-maintenance").join("\n")}</Code>
          <p className="mt-2 text-xs text-muted-foreground" dir="rtl">دليل صيانة الألواح الشمسية — Arabic variant served RTL with lang="ar".</p>
        </Panel>
        <Panel reqs={["R10"]} title="E-E-A-T publish gate">
          {(["author", "credentials", "reviewer"] as const).map((k) => (
            <input key={k} placeholder={k === "reviewer" ? "Expert reviewer name" : k === "author" ? "Author name" : "Author credentials"} value={gate[k]} onChange={(e) => setGate({ ...gate, [k]: e.target.value })} className="mb-1 h-8 w-full rounded border bg-background px-2 text-xs" />
          ))}
          <label className="flex items-center gap-2 text-xs">Primary citations <input type="number" min={0} value={gate.citations} onChange={(e) => setGate({ ...gate, citations: +e.target.value })} className="h-7 w-16 rounded border bg-background px-2" /></label>
          <ul className="my-2 text-xs">{Object.entries(eeat.checks).map(([k, ok]) => <li key={k} className={ok ? "text-success" : "text-muted-foreground"}>{ok ? "✓" : "○"} {k}</li>)}</ul>
          <div className="flex items-center gap-2">
            <Button size="sm" disabled={!eeat.pass || status === "published"} onClick={() => { setStatus("published"); toast.success("Published after editorial review"); }}>Publish</Button>
            <span className="font-mono text-xs">status: {status}</span>
          </div>
        </Panel>
      </div>
    </div>
  );
}
