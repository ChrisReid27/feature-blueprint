import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { PageHeader, Panel, Stat } from "@/components/rtm/Shell";
import { Button } from "@/components/ui/button";
import { aHash, angle, blobs, defectGrid, dominantColors, gray, hamming, normalize, type Img } from "@/lib/rtm/vision";

export const Route = createFileRoute("/vision")({
  head: () => ({
    meta: [
      { title: "Computer Vision Lab · RTM Console" },
      { name: "description", content: "OCR, defect detection, shelf counting, visual tagging, segmentation, pose angles and touchless access in the browser." },
      { property: "og:title", content: "Computer Vision & Image Recognition" },
      { property: "og:description", content: "Run vision checks on any uploaded image." },
    ],
  }),
  component: Vision,
});

const W = 480, H = 320;
type Tool = "defects" | "inventory" | "segment" | "tag" | "pose";

function sample(ctx: CanvasRenderingContext2D) {
  const grd = ctx.createLinearGradient(0, 0, W, 0);
  grd.addColorStop(0, "#3a3a3a"); grd.addColorStop(1, "#bdbdbd"); // uneven lighting
  ctx.fillStyle = grd; ctx.fillRect(0, 0, W, H);
  const colors = ["#d94a2b", "#2b7bd9", "#e8c547", "#2bb673"];
  for (let r = 0; r < 2; r++) for (let c = 0; c < 6; c++) {
    if (r === 1 && c === 4) continue; // empty shelf slot
    ctx.fillStyle = colors[(r + c) % 4]; ctx.fillRect(20 + c * 75, 30 + r * 140, 50, 100);
  }
  ctx.strokeStyle = "#ffffff"; ctx.lineWidth = 2; ctx.beginPath();
  for (let i = 0; i < 12; i++) ctx.lineTo(380 + i * 6, 200 + (i % 2) * 8); ctx.stroke(); // scratch defect
  ctx.fillStyle = "#111"; ctx.font = "bold 18px monospace"; ctx.fillText("LOT 4471-B  QC PASS", 140, 300);
}

function Vision() {
  const cv = useRef<HTMLCanvasElement>(null);
  const [img, setImg] = useState<Img | null>(null);
  const [tool, setTool] = useState<Tool>("defects");
  const [ocr, setOcr] = useState<{ busy: boolean; text: string; pct: number }>({ busy: false, text: "", pct: 0 });
  const [tags, setTags] = useState<{ x: number; y: number; label: string; url: string }[]>([]);
  const [pts, setPts] = useState<[number, number][]>([]);
  const [enrolled, setEnrolled] = useState<{ name: string; hash: number[] }[]>([]);
  const [access, setAccess] = useState<string | null>(null);

  const capture = () => {
    const c = cv.current!; const ctx = c.getContext("2d")!;
    const d = ctx.getImageData(0, 0, W, H);
    setImg({ w: W, h: H, d: d.data });
  };
  const loadSample = () => { sample(cv.current!.getContext("2d")!); capture(); setTags([]); setPts([]); };
  useEffect(loadSample, []);

  const upload = (f: File) => {
    const im = new Image();
    im.onload = () => {
      const ctx = cv.current!.getContext("2d")!;
      ctx.fillStyle = "#000"; ctx.fillRect(0, 0, W, H);
      const s = Math.min(W / im.width, H / im.height);
      ctx.drawImage(im, (W - im.width * s) / 2, (H - im.height * s) / 2, im.width * s, im.height * s);
      capture(); setTags([]); setPts([]);
    };
    im.src = URL.createObjectURL(f);
  };

  const runOcr = async () => {
    setOcr({ busy: true, text: "", pct: 0 });
    try {
      const { createWorker } = await import("tesseract.js");
      const w = await createWorker("eng", 1, { logger: (m) => m.status === "recognizing text" && setOcr((o) => ({ ...o, pct: Math.round(m.progress * 100) })) });
      const { data } = await w.recognize(cv.current!);
      await w.terminate();
      setOcr({ busy: false, text: data.text.trim() || "(no text found)", pct: 100 });
    } catch (e) { setOcr({ busy: false, text: "OCR failed: " + (e as Error).message, pct: 0 }); }
  };
  const download = (ext: "txt" | "xml" | "doc") => {
    const body = ext === "xml" ? `<?xml version="1.0"?>\n<document><text>${ocr.text.replace(/&/g, "&amp;").replace(/</g, "&lt;")}</text></document>` : ext === "doc" ? `<html><body><pre>${ocr.text}</pre></body></html>` : ocr.text;
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([body], { type: "text/plain" })); a.download = `ocr.${ext}`; a.click();
  };

  const defects = img ? defectGrid(img) : null;
  const objs = img ? blobs(img) : [];
  const colors = img ? dominantColors(img) : [];
  const seg = img && tool === "segment" ? normalize(gray(img)) : null;
  const segShare = seg ? Math.round((seg.filter((v) => v > 128).length / seg.length) * 100) : 0;
  const poseAngle = pts.length === 3 ? angle(pts[0], pts[1], pts[2]) : null;

  const clickCanvas = (e: React.MouseEvent) => {
    const r = (e.target as HTMLElement).getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width) * W, y = ((e.clientY - r.top) / r.height) * H;
    if (tool === "tag") {
      const label = prompt("Product name for this tag?"); if (!label) return;
      setTags((t) => [...t, { x, y, label, url: `https://shop.example.com/search?q=${encodeURIComponent(label)}` }]);
    } else if (tool === "pose") setPts((p) => (p.length >= 3 ? [[x, y]] : [...p, [x, y]]));
  };

  const pct = (v: number, t: number) => `${(v / t) * 100}%`;

  return (
    <div className="mx-auto max-w-6xl space-y-4">
      <PageHeader code="PF-4 · R31–R40" title="Computer Vision Lab">
        Upload a photo, scan, or video frame — or use the built-in shelf sample — and pick a tool. All analysis runs privately in your browser.
      </PageHeader>
      <div className="grid gap-4 lg:grid-cols-5">
        <div className="space-y-3 lg:col-span-3">
          <div className="flex flex-wrap gap-2">
            <label className="cursor-pointer"><input type="file" accept="image/*" hidden onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])} /><span className="inline-flex h-8 items-center rounded border bg-card px-3 text-xs font-medium">Upload image</span></label>
            <Button size="sm" variant="outline" onClick={loadSample}>Load shelf sample</Button>
            {(["defects", "inventory", "segment", "tag", "pose"] as Tool[]).map((t) => (
              <Button key={t} size="sm" variant={tool === t ? "default" : "secondary"} onClick={() => setTool(t)}>{t}</Button>
            ))}
          </div>
          <div className="relative overflow-hidden rounded-md border bg-sidebar" onClick={clickCanvas}>
            <canvas ref={cv} width={W} height={H} className="block w-full" />
            {tool === "defects" && defects && defects.cells.map((d, i) => d && (
              <div key={i} className="absolute border-2 border-destructive bg-destructive/25" style={{ left: pct((i % defects.n) * (W / defects.n), W), top: pct(Math.floor(i / defects.n) * (H / defects.n), H), width: pct(W / defects.n, W), height: pct(H / defects.n, H) }} />
            ))}
            {(tool === "inventory") && objs.map((o, i) => (
              <div key={i} className="absolute border-2 border-success" style={{ left: pct(o.x, W), top: pct(o.y, H), width: pct(o.w, W), height: pct(o.h, H) }}>
                <span className="absolute -top-4 left-0 bg-success px-1 font-mono text-[9px] text-primary-foreground">#{i + 1}</span>
              </div>
            ))}
            {tool === "segment" && <div className="pointer-events-none absolute inset-0 bg-accent/30 mix-blend-multiply" />}
            {tags.map((t, i) => (
              <a key={i} href={t.url} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()} className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary px-2 py-0.5 text-[10px] font-semibold text-primary-foreground shadow" style={{ left: pct(t.x, W), top: pct(t.y, H) }}>🛒 {t.label}</a>
            ))}
            {tool === "pose" && pts.map((p, i) => <div key={i} className="absolute h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-warning ring-2 ring-background" style={{ left: pct(p[0], W), top: pct(p[1], H) }} />)}
          </div>
        </div>
        <div className="space-y-4 lg:col-span-2">
          {tool === "defects" && <Panel reqs={["R33"]} title="Assembly-line defect detection"><Stat label="Defect cells" value={defects?.cells.filter(Boolean).length ?? 0} tone={defects?.cells.some(Boolean) ? "bad" : "good"} /><p className="mt-2 text-xs text-muted-foreground">Cells with abnormal edge energy (&gt; mean + 2σ) are flagged as scratches or cracks.</p></Panel>}
          {tool === "inventory" && <Panel reqs={["R34", "R35", "R40"]} title="Shelf scan / object & player tracking"><div className="grid grid-cols-2 gap-2"><Stat label="Objects detected" value={objs.length} /><Stat label="Lighting" value="normalized" tone="good" /></div><p className="mt-2 text-xs text-muted-foreground">Brightness is stretched before detection so dim and bright areas count equally. Each object gets a stable ID and position for sorting or tracking players.</p></Panel>}
          {tool === "segment" && <Panel reqs={["R38"]} title="Biomedical region segmentation"><Stat label="High-intensity region" value={`${segShare}% of frame`} /><p className="mt-2 text-xs text-muted-foreground">Intensity threshold segmentation for X-ray/MRI/ultrasound slices. Prototype — not for clinical use.</p></Panel>}
          {tool === "tag" && <Panel reqs={["R36"]} title="Tap-to-buy tagging"><p className="text-xs">Click anywhere on the image to place a shoppable tag. {tags.length} tag(s) placed.</p></Panel>}
          {tool === "pose" && <Panel reqs={["R39"]} title="Pose form coach"><p className="text-xs">Click hip → knee → ankle.</p>{poseAngle !== null && <><Stat label="Knee angle" value={`${poseAngle.toFixed(0)}°`} tone={poseAngle >= 80 && poseAngle <= 100 ? "good" : "warn"} /><p className="mt-1 text-xs">{poseAngle > 100 ? "Squat deeper — aim for ~90°." : poseAngle < 80 ? "Too deep — rise slightly to protect knees." : "Great form!"}</p></>}</Panel>}
          <Panel reqs={["R37"]} title="Visual attributes (search-by-image)">
            <div className="flex flex-wrap gap-2">{colors.map((c, i) => <span key={i} className="flex items-center gap-1 rounded border px-2 py-0.5 text-xs"><span className="h-3 w-3 rounded-sm" style={{ background: c.rgb }} />{c.name}</span>)}</div>
            <p className="mt-2 font-mono text-[10px] text-muted-foreground">query: color:{[...new Set(colors.map((c) => c.name))].join("|")} objects:{objs.length}</p>
          </Panel>
          <Panel reqs={["R31"]} title="OCR → TXT / XML / Word">
            <Button size="sm" onClick={runOcr} disabled={ocr.busy}>{ocr.busy ? `Reading… ${ocr.pct}%` : "Extract text"}</Button>
            {ocr.text && <><pre className="mt-2 max-h-28 overflow-auto whitespace-pre-wrap rounded bg-muted p-2 text-xs">{ocr.text}</pre><div className="mt-2 flex gap-1">{(["txt", "xml", "doc"] as const).map((x) => <Button key={x} size="sm" variant="outline" onClick={() => download(x)}>.{x}</Button>)}</div></>}
          </Panel>
          <Panel reqs={["R32"]} title="Touchless entrance (face template match)">
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => { const name = prompt("Name to enroll current image as?"); if (name && img) { setEnrolled((e) => [...e, { name, hash: aHash(img) }]); toast.success(`${name} enrolled`); } }}>Enroll current</Button>
              <Button size="sm" onClick={() => { if (!img) return; const h = aHash(img); const best = enrolled.map((e) => ({ ...e, d: hamming(h, e.hash) })).sort((a, b) => a.d - b.d)[0]; setAccess(best && best.d <= 10 ? `✓ Access granted: ${best.name} (distance ${best.d})` : "✕ Access denied — no match"); }}>Verify at door</Button>
            </div>
            {access && <p className={`mt-2 text-xs font-semibold ${access.startsWith("✓") ? "text-success" : "text-destructive"}`}>{access}</p>}
            <p className="mt-1 text-[10px] text-muted-foreground">{enrolled.length} enrolled · templates stay on this device.</p>
          </Panel>
        </div>
      </div>
    </div>
  );
}
