export type Section = { heading: string; level: number; body: string };

export function parseSections(md: string): Section[] {
  const out: Section[] = [];
  let cur: Section | null = null;
  md.split("\n").forEach((line) => {
    const m = line.match(/^(#{1,3})\s+(.*)/);
    if (m) { cur = { heading: m[2].trim(), level: m[1].length, body: "" }; out.push(cur); }
    else if (cur) cur.body += line + " ";
    else if (line.trim()) { cur = { heading: "", level: 0, body: line + " " }; out.push(cur); }
  });
  return out.map((s) => ({ ...s, body: s.body.trim().replace(/\s+/g, " ") }));
}

const wc = (s: string) => (s.match(/\S+/g) ?? []).length;

/** R1: answer block = first 50–75 words of H2/H3 body, cut at a sentence boundary. */
export function answerBlocks(sections: Section[]) {
  return sections.filter((s) => s.level >= 2 && s.body).map((s) => {
    const sentences = s.body.match(/[^.!?]+[.!?]+/g) ?? [s.body];
    let block = "";
    for (const sen of sentences) { if (wc(block) >= 50) break; block += sen; }
    const words = block.trim().split(/\s+/);
    if (words.length > 75) block = words.slice(0, 75).join(" ") + "…";
    const n = wc(block);
    return { heading: s.heading, block: block.trim(), words: n, ok: n >= 50 && n <= 75 };
  });
}

/** R2: Article + FAQPage JSON-LD; question headings become FAQ entries. */
export function jsonLd(title: string, author: string, sections: Section[], url: string) {
  const faqs = sections.filter((s) => s.heading.endsWith("?") && s.body);
  const graph: object[] = [{ "@type": "Article", headline: title, author: { "@type": "Person", name: author || "Unknown" }, mainEntityOfPage: url, datePublished: new Date().toISOString().slice(0, 10) }];
  if (faqs.length) graph.push({ "@type": "FAQPage", mainEntity: faqs.map((f) => ({ "@type": "Question", name: f.heading, acceptedAnswer: { "@type": "Answer", text: f.body } })) });
  return { "@context": "https://schema.org", "@graph": graph };
}

/** R6: coverage of competitor terms (top-20 SERP term set) in the draft. */
export function comprehensiveness(draft: string, terms: string[]) {
  const t = draft.toLowerCase();
  const found = terms.filter((x) => x && t.includes(x.toLowerCase()));
  return { score: terms.length ? Math.round((found.length / terms.length) * 100) : 0, missing: terms.filter((x) => !found.includes(x)) };
}

/** R7: intent classification by modifier words. */
export function intent(kw: string) {
  const k = kw.toLowerCase();
  if (/(buy|price|cheap|deal|discount|order|near me)/.test(k)) return "transactional";
  if (/(best|vs|review|top|compare)/.test(k)) return "commercial";
  if (/(login|official|website|\.com)/.test(k)) return "navigational";
  return "informational";
}

/** R7: linear trend forecast (least squares) for next n periods. */
export function forecast(series: number[], n = 3) {
  const N = series.length, xs = series.map((_, i) => i);
  const mx = (N - 1) / 2, my = series.reduce((a, b) => a + b, 0) / N;
  const slope = xs.reduce((a, x, i) => a + (x - mx) * (series[i] - my), 0) / xs.reduce((a, x) => a + (x - mx) ** 2, 0);
  return Array.from({ length: n }, (_, i) => Math.max(0, Math.round(my + slope * (N + i - mx))));
}

/** R3: group keywords into pillar clusters by shared head term. */
export function clusters(keywords: string[], pillar: string) {
  const stop = new Set(["the", "a", "for", "to", "how", "what", "is", "of", "in", "best", "vs", "and", pillar.toLowerCase()]);
  const groups = new Map<string, string[]>();
  keywords.forEach((k) => {
    const head = k.toLowerCase().split(/\s+/).find((w) => !stop.has(w) && w.length > 2) ?? "general";
    groups.set(head, [...(groups.get(head) ?? []), k]);
  });
  return [...groups.entries()].map(([head, kws]) => ({ head, kws }));
}

/** R4: orphan detection & anchor suggestions — a page is linkable when its keyword appears in the draft. */
export function internalLinks(draft: string, pages: { url: string; keyword: string; inbound: number }[]) {
  const t = draft.toLowerCase();
  return pages.map((p) => ({ ...p, orphan: p.inbound === 0, suggest: t.includes(p.keyword.toLowerCase()) }));
}

/** R8: Google Core Web Vitals "good" thresholds. */
export function cwv(lcp: number, inp: number, cls: number) {
  return { lcp: lcp <= 2.5, inp: inp <= 200, cls: cls <= 0.1 };
}

/** R9: reciprocal hreflang tags for EN/AR. */
export function hreflang(baseUrl: string) {
  const u = baseUrl.replace(/\/$/, "");
  return [`<link rel="alternate" hreflang="en" href="${u}/en/" />`, `<link rel="alternate" hreflang="ar" href="${u}/ar/" />`, `<link rel="alternate" hreflang="x-default" href="${u}/en/" />`];
}

/** R10: E-E-A-T publish gate. */
export function eeatGate(g: { author: string; credentials: string; citations: number; reviewer: string }) {
  const checks = { "Named author": !!g.author.trim(), "Author credentials": !!g.credentials.trim(), "≥2 primary-source citations": g.citations >= 2, "Expert reviewer sign-off": !!g.reviewer.trim() };
  return { checks, pass: Object.values(checks).every(Boolean) };
}
