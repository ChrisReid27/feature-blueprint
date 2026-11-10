export type Img = { w: number; h: number; d: Uint8ClampedArray };

export const gray = (im: Img) => {
  const g = new Float32Array(im.w * im.h);
  for (let i = 0; i < g.length; i++) g[i] = 0.299 * im.d[i * 4] + 0.587 * im.d[i * 4 + 1] + 0.114 * im.d[i * 4 + 2];
  return g;
};

/** R35: lighting normalization — rescale to full 0–255 range (min/max stretch). */
export function normalize(g: Float32Array) {
  let lo = 255, hi = 0;
  g.forEach((v) => { lo = Math.min(lo, v); hi = Math.max(hi, v); });
  const r = hi - lo || 1;
  return g.map((v) => ((v - lo) / r) * 255);
}

/** R33: edge-energy grid; cells > mean + 2σ flagged as defects. */
export function defectGrid(im: Img, n = 12) {
  const g = gray(im), cw = Math.floor(im.w / n), ch = Math.floor(im.h / n);
  const e: number[] = [];
  for (let cy = 0; cy < n; cy++) for (let cx = 0; cx < n; cx++) {
    let s = 0;
    for (let y = cy * ch + 1; y < (cy + 1) * ch - 1; y++) for (let x = cx * cw + 1; x < (cx + 1) * cw - 1; x++) {
      const i = y * im.w + x;
      s += Math.abs(g[i + 1] - g[i - 1]) + Math.abs(g[i + im.w] - g[i - im.w]);
    }
    e.push(s / (cw * ch));
  }
  const m = e.reduce((a, b) => a + b, 0) / e.length;
  const sd = Math.sqrt(e.reduce((a, b) => a + (b - m) ** 2, 0) / e.length);
  return { n, cells: e.map((v) => v > m + 2 * sd) };
}

/** R34/R35/R40: connected components on normalized dark/bright foreground. */
export function blobs(im: Img, minArea = 60) {
  const g = normalize(gray(im));
  const mean = g.reduce((a, b) => a + b, 0) / g.length;
  const fg = new Uint8Array(g.length);
  g.forEach((v, i) => (fg[i] = Math.abs(v - mean) > 50 ? 1 : 0));
  const lab = new Int32Array(g.length);
  const out: { x: number; y: number; w: number; h: number; area: number }[] = [];
  let id = 0;
  for (let i = 0; i < g.length; i++) {
    if (!fg[i] || lab[i]) continue;
    id++;
    const st = [i]; lab[i] = id;
    let minx = im.w, miny = im.h, maxx = 0, maxy = 0, area = 0;
    while (st.length) {
      const p = st.pop()!, x = p % im.w, y = (p / im.w) | 0;
      area++; minx = Math.min(minx, x); maxx = Math.max(maxx, x); miny = Math.min(miny, y); maxy = Math.max(maxy, y);
      for (const q of [p - 1, p + 1, p - im.w, p + im.w])
        if (q >= 0 && q < g.length && fg[q] && !lab[q] && Math.abs((q % im.w) - x) <= 1) { lab[q] = id; st.push(q); }
    }
    if (area >= minArea) out.push({ x: minx, y: miny, w: maxx - minx + 1, h: maxy - miny + 1, area });
  }
  return out;
}

/** R37: dominant colors via 3-bit quantization + names. */
export function dominantColors(im: Img, k = 4) {
  const bins = new Map<number, [number, number, number, number]>();
  for (let i = 0; i < im.d.length; i += 16) {
    const key = ((im.d[i] >> 5) << 6) | ((im.d[i + 1] >> 5) << 3) | (im.d[i + 2] >> 5);
    const b = bins.get(key) ?? [0, 0, 0, 0];
    b[0] += im.d[i]; b[1] += im.d[i + 1]; b[2] += im.d[i + 2]; b[3]++;
    bins.set(key, b);
  }
  return [...bins.values()].sort((a, b) => b[3] - a[3]).slice(0, k).map(([r, g, b, n]) => {
    const [R, G, B] = [r / n, g / n, b / n].map(Math.round);
    return { rgb: `rgb(${R},${G},${B})`, name: colorName(R, G, B) };
  });
}
function colorName(r: number, g: number, b: number) {
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b);
  if (mx < 50) return "black"; if (mn > 205) return "white"; if (mx - mn < 25) return "gray";
  if (r === mx) return g > b * 1.4 ? (g > r * 0.7 ? "yellow" : "orange") : b > g * 1.3 ? "pink" : "red";
  if (g === mx) return b > r ? "teal" : "green";
  return r > g ? "purple" : "blue";
}

/** R32: 8×8 average hash for face template matching. */
export function aHash(im: Img) {
  const g = gray(im), bits: number[] = [];
  const vals: number[] = [];
  for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) {
    let s = 0, c = 0;
    for (let yy = Math.floor((y * im.h) / 8); yy < Math.floor(((y + 1) * im.h) / 8); yy += 2)
      for (let xx = Math.floor((x * im.w) / 8); xx < Math.floor(((x + 1) * im.w) / 8); xx += 2) { s += g[yy * im.w + xx]; c++; }
    vals.push(s / Math.max(1, c));
  }
  const m = vals.reduce((a, b) => a + b, 0) / 64;
  vals.forEach((v) => bits.push(v > m ? 1 : 0));
  return bits;
}
export const hamming = (a: number[], b: number[]) => a.reduce((s, v, i) => s + (v !== b[i] ? 1 : 0), 0);

/** R39: joint angle at b formed by a-b-c, degrees. */
export function angle(a: [number, number], b: [number, number], c: [number, number]) {
  const v1 = [a[0] - b[0], a[1] - b[1]], v2 = [c[0] - b[0], c[1] - b[1]];
  const cos = (v1[0] * v2[0] + v1[1] * v2[1]) / (Math.hypot(...v1) * Math.hypot(...v2) || 1);
  return (Math.acos(Math.max(-1, Math.min(1, cos))) * 180) / Math.PI;
}
