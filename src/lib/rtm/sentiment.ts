export type Platform = "Google" | "Instagram" | "Zomato" | "Swiggy" | "Facebook" | "X";
export type Review = { id: number; platform: Platform; zone: string; text: string; day: number };
export type Analysis = Review & {
  label: "positive" | "negative" | "neutral"; score: number; intensity: number; sarcasm: boolean;
  aspect: "product" | "service" | "ambience"; priority: number;
};

const LEX: Record<string, number> = {
  good: 2, great: 3, amazing: 4, excellent: 4, love: 3, loved: 3, tasty: 3, delicious: 4, fresh: 2, friendly: 2, fast: 2, best: 3, nice: 2, perfect: 4, clean: 2,
  bad: -2, terrible: -4, awful: -4, worst: -4, cold: -2, slow: -2, rude: -3, dirty: -3, stale: -3, late: -2, bland: -2, overpriced: -3, horrible: -4, disappointed: -3, noisy: -2, never: -1,
};
const BOOST: Record<string, number> = { very: 1.5, extremely: 2, so: 1.3, really: 1.3, super: 1.5, absolutely: 1.8 };
const NEG = new Set(["not", "no", "never", "isn't", "wasn't", "don't", "didn't", "hardly"]);
const SARCASM = [/yeah,? right/i, /oh (great|wonderful|perfect)/i, /\/s\b/, /thanks for nothing/i, /just what i needed/i, /love (waiting|being ignored)/i, /(great|amazing|wonderful|perfect).{0,40}(hours?|wait|late|cold|never|ignored)/i];

/** R44: Kahneman–Tversky loss aversion coefficient — negative reviews weigh 2.25×. */
export const LOSS_AVERSION = 2.25;

export function analyze(r: Review): Analysis {
  const words = r.text.toLowerCase().match(/[a-z']+/g) ?? [];
  let score = 0, hits = 0;
  words.forEach((w, i) => {
    let v = LEX[w];
    if (v === undefined) return;
    if (BOOST[words[i - 1]]) v *= BOOST[words[i - 1]];
    if (NEG.has(words[i - 1]) || NEG.has(words[i - 2])) v *= -0.8;
    score += v; hits++;
  });
  const excl = (r.text.match(/!/g) ?? []).length;
  const sarcasm = SARCASM.some((p) => p.test(r.text));
  if (sarcasm && score > 0) score = -Math.abs(score);
  const intensity = Math.min(1, (Math.abs(score) + excl * 0.5) / 6);
  const label = score > 0.5 ? "positive" : score < -0.5 ? "negative" : "neutral";
  const t = r.text.toLowerCase();
  const aspect = /(waiter|staff|service|delivery|wait|rude|manager|order)/.test(t) ? "service"
    : /(ambience|ambiance|music|noisy|decor|seating|vibe|clean|dirty)/.test(t) ? "ambience" : "product";
  const priority = label === "negative" ? intensity * LOSS_AVERSION : label === "neutral" ? intensity * 0.5 : intensity;
  return { ...r, label, score, intensity, sarcasm, aspect, priority: hits || sarcasm ? priority : 0.1 };
}

/** R45: flag days whose volume exceeds mean + z·σ of the series. */
export function volumeSpikes(counts: number[], z = 2) {
  const m = counts.reduce((a, b) => a + b, 0) / counts.length;
  const s = Math.sqrt(counts.reduce((a, b) => a + (b - m) ** 2, 0) / counts.length);
  return counts.map((c) => s > 0 && c > m + z * s);
}

/** R50: Cronbach's alpha over a respondents × items matrix. */
export function cronbachAlpha(rows: number[][]) {
  const k = rows[0].length;
  const variance = (xs: number[]) => {
    const m = xs.reduce((a, b) => a + b, 0) / xs.length;
    return xs.reduce((a, b) => a + (b - m) ** 2, 0) / (xs.length - 1);
  };
  const itemVar = Array.from({ length: k }, (_, j) => variance(rows.map((r) => r[j]))).reduce((a, b) => a + b, 0);
  const totalVar = variance(rows.map((r) => r.reduce((a, b) => a + b, 0)));
  return (k / (k - 1)) * (1 - itemVar / totalVar);
}

export function empatheticReply(a: Analysis) {
  const open = a.label === "negative" ? "We're truly sorry about your experience" : a.label === "neutral" ? "Thank you for the honest feedback" : "Thank you so much for the kind words";
  const body = a.label === "negative"
    ? a.aspect === "service" ? "— that's not the service we want anyone to receive. Our manager will reach out personally to make this right."
      : a.aspect === "ambience" ? "— we're reviewing our space so your next visit is far more comfortable."
      : "— we've shared this with our kitchen team and would love to make it up to you on your next order."
    : " — we've shared it with the team.";
  return `${open}${body}`;
}

export const SAMPLE_REVIEWS: Review[] = [
  ["Google", "Vashi", "Amazing biryani, very fresh and tasty!", 1],
  ["Zomato", "Vashi", "Food was cold and the delivery was late. Very disappointed.", 1],
  ["Instagram", "Nerul", "Loved the ambience and music, super nice vibe", 2],
  ["Swiggy", "Kharghar", "Oh great, waited 2 hours for cold food. Just what I needed.", 2],
  ["Facebook", "Belapur", "Average place, nothing special.", 3],
  ["X", "Vashi", "Staff was rude and the manager never came. Worst service.", 3],
  ["Google", "Nerul", "Excellent paneer, not overpriced at all", 4],
  ["Zomato", "Kharghar", "Bland curry and stale bread", 5],
  ["Google", "Kharghar", "Terrible, avoid!", 6], ["Google", "Kharghar", "Worst food ever", 6],
  ["Zomato", "Kharghar", "Horrible, everyone says it's bad", 6], ["X", "Kharghar", "Bad bad bad", 6],
  ["Facebook", "Kharghar", "Awful experience, dirty tables", 6], ["Swiggy", "Kharghar", "Terrible delivery, late again", 6],
  ["Instagram", "Belapur", "Clean seating, friendly waiter, great coffee", 7],
  ["Google", "Vashi", "Really good dosa, fast service", 8],
].map(([platform, zone, text, day], id) => ({ id, platform, zone, text, day } as Review));
