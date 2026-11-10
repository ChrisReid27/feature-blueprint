import { mulberry32 } from "./rng";

export type Rating = { user: string; item: string; stars: number; t: number; text: string };
export type UserScore = {
  user: string; n: number; ratingCounts: number[]; iatCounts: number[]; cluster: number;
  sx: number; sd: number; nest: number; burst: "boost" | "defame" | null; dupText: boolean; avg: number;
};

export const STARS = 5;
export const BUCKETS = 20;
export const MAX_IAT = 60 * 60 * 24 * 365; // 1 year, seconds

/** R14: logarithmic bucket, base chosen so MAX_IAT spans ~20 buckets. */
export function iatBucket(iat: number, buckets = BUCKETS, maxIat = MAX_IAT) {
  const b = Math.pow(maxIat, 1 / buckets);
  const k = Math.floor(Math.log(Math.max(1, iat)) / Math.log(b));
  return Math.min(buckets - 1, Math.max(0, k));
}

/** R17: character-shingle Jaccard similarity. */
export function textSimilarity(a: string, b: string) {
  const sh = (s: string) => {
    const t = s.toLowerCase().replace(/[^a-z0-9 ]/g, "");
    const out = new Set<string>();
    for (let i = 0; i < t.length - 3; i++) out.add(t.slice(i, i + 4));
    return out;
  };
  const A = sh(a), B = sh(b);
  if (!A.size || !B.size) return 0;
  let inter = 0;
  A.forEach((x) => B.has(x) && inter++);
  return inter / (A.size + B.size - inter);
}

const PROMO = /(code|referral|gift card|free cash|points|promo)/i;

/** R11 + R18: multinomial mixture fit via EM, cost O(#it · m · K). */
export function fitMixture(data: number[][], K: number, iters = 25, seed = 7) {
  const rnd = mulberry32(seed);
  const d = data[0].length;
  let theta = Array.from({ length: K }, () => {
    const v = Array.from({ length: d }, () => 0.5 + rnd());
    const s = v.reduce((a, b) => a + b, 0);
    return v.map((x) => x / s);
  });
  let pi = Array(K).fill(1 / K);
  let resp: number[][] = [];
  for (let it = 0; it < iters; it++) {
    resp = data.map((n) => {
      const ll = theta.map((th, k) => Math.log(pi[k]) + n.reduce((a, c, j) => a + c * Math.log(th[j]), 0));
      const m = Math.max(...ll);
      const e = ll.map((x) => Math.exp(x - m));
      const s = e.reduce((a, b) => a + b, 0);
      return e.map((x) => x / s);
    });
    pi = Array.from({ length: K }, (_, k) => (resp.reduce((a, r) => a + r[k], 0) + 1) / (data.length + K));
    theta = Array.from({ length: K }, (_, k) => {
      const v = Array(d).fill(1); // Dirichlet(1) smoothing
      data.forEach((n, i) => n.forEach((c, j) => (v[j] += resp[i][k] * c)));
      const s = v.reduce((a: number, b: number) => a + b, 0);
      return v.map((x: number) => x / s);
    });
  }
  const assign = resp.map((r) => r.indexOf(Math.max(...r)));
  return { theta, pi, assign };
}

/** Surprise of a user's counts vs cluster distribution: n · KL(empirical || cluster). */
export function surprise(counts: number[], dist: number[]) {
  const n = counts.reduce((a, b) => a + b, 0);
  if (!n) return 0;
  return counts.reduce((a, c, j) => (c ? a + c * Math.log(c / n / dist[j]) : a), 0);
}

const std = (xs: number[]) => {
  const m = xs.reduce((a, b) => a + b, 0) / xs.length;
  return Math.sqrt(xs.reduce((a, b) => a + (b - m) ** 2, 0) / xs.length) || 1;
};

/** R12 + R13: NEST(i) = s_x/σ_x + s_Δ/σ_Δ */
export function runBirdnest(ratings: Rating[], K = 3): UserScore[] {
  const byUser = new Map<string, Rating[]>();
  ratings.forEach((r) => byUser.set(r.user, [...(byUser.get(r.user) ?? []), r]));
  const users = [...byUser.keys()];
  const rc = users.map((u) => {
    const v = Array(STARS).fill(0);
    byUser.get(u)!.forEach((r) => v[r.stars - 1]++);
    return v;
  });
  const ic = users.map((u) => {
    const v = Array(BUCKETS).fill(0);
    const rs = [...byUser.get(u)!].sort((a, b) => a.t - b.t);
    for (let j = 1; j < rs.length; j++) v[iatBucket(rs[j].t - rs[j - 1].t)]++;
    return v;
  });
  const joint = rc.map((r, i) => [...r, ...ic[i]]);
  const { theta, assign } = fitMixture(joint, K);
  const sx = rc.map((c, i) => surprise(c, norm(theta[assign[i]].slice(0, STARS))));
  const sd = ic.map((c, i) => surprise(c, norm(theta[assign[i]].slice(STARS))));
  const ox = std(sx), od = std(sd);
  return users.map((u, i) => {
    const rs = byUser.get(u)!;
    const n = rs.length;
    const avg = rs.reduce((a, r) => a + r.stars, 0) / n;
    const share5 = rc[i][4] / n, share1 = rc[i][0] / n;
    const burst = n >= 4 && share5 >= 0.9 ? "boost" : n >= 4 && share1 >= 0.9 ? "defame" : null;
    let dupText = false;
    for (let a = 0; a < rs.length && !dupText; a++)
      for (let b = a + 1; b < rs.length; b++)
        if (textSimilarity(rs[a].text, rs[b].text) > 0.7 && PROMO.test(rs[a].text)) { dupText = true; break; }
    return { user: u, n, ratingCounts: rc[i], iatCounts: ic[i], cluster: assign[i], sx: sx[i], sd: sd[i],
      nest: sx[i] / ox + sd[i] / od, burst, dupText, avg };
  }).sort((a, b) => b.nest - a.nest);
}

const norm = (v: number[]) => { const s = v.reduce((a, b) => a + b, 0); return v.map((x) => x / s); };

/** R19: Monte Carlo draws from Dirichlet(alpha + n), returns mean-rating samples. */
export function posteriorMeanSamples(alpha: number[], counts: number[], draws = 10000, seed = 3) {
  const rnd = mulberry32(seed);
  const gamma = (k: number): number => {
    if (k < 1) return gamma(k + 1) * Math.pow(rnd(), 1 / k);
    const d = k - 1 / 3, c = 1 / Math.sqrt(9 * d);
    for (;;) {
      let x, v;
      do { const u1 = rnd(), u2 = rnd(); x = Math.sqrt(-2 * Math.log(u1 || 1e-12)) * Math.cos(2 * Math.PI * u2); v = 1 + c * x; } while (v <= 0);
      v = v ** 3; const u = rnd();
      if (Math.log(u) < 0.5 * x * x + d - d * v + d * Math.log(v)) return d * v;
    }
  };
  const out: number[] = [];
  for (let s = 0; s < draws; s++) {
    const g = alpha.map((a, j) => gamma(a + counts[j]));
    const t = g.reduce((a, b) => a + b, 0);
    out.push(g.reduce((a, x, j) => a + (x / t) * (j + 1), 0));
  }
  return out;
}

/** Synthetic benchmark stream: honest users plus boosters, defamers and promo spammers. */
export function syntheticRatings(seed = 42, honest = 120): Rating[] {
  const rnd = mulberry32(seed);
  const out: Rating[] = [];
  const base = 1_700_000_000;
  const texts = ["Solid product, works as described.", "Delivery was slow but item is fine.", "Not worth the price.", "Love it, using daily.", "Average quality overall.", "Broke after two weeks."];
  for (let u = 0; u < honest; u++) {
    let t = base + rnd() * 1e7;
    const k = 3 + Math.floor(rnd() * 8);
    for (let j = 0; j < k; j++) {
      t += 86400 * (1 + rnd() * 60);
      const p = rnd();
      const stars = p < 0.08 ? 1 : p < 0.16 ? 2 : p < 0.35 ? 3 : p < 0.7 ? 4 : 5;
      out.push({ user: `user_${u}`, item: `item_${Math.floor(rnd() * 40)}`, stars, t, text: texts[Math.floor(rnd() * texts.length)] });
    }
  }
  const attack = (name: string, stars: number, text: (j: number) => string, count: number) => {
    let t = base + 5e6 + rnd() * 1e5;
    for (let j = 0; j < count; j++) {
      t += 20 + rnd() * 90;
      out.push({ user: name, item: `item_${j % 3}`, stars, t, text: text(j) });
    }
  };
  for (let i = 0; i < 4; i++) attack(`booster_${i}`, 5, () => "Amazing seller!! best ever 5 stars", 14);
  for (let i = 0; i < 3; i++) attack(`defamer_${i}`, 1, () => "Terrible scam, avoid this shop", 12);
  for (let i = 0; i < 3; i++) attack(`spam_${i}`, 5, (j) => `Great app! Use referral code WIN${100 + i} for free cash and gift card points ${j % 2 ? "now" : "today"}`, 27);
  return out;
}
