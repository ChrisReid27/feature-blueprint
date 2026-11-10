export type Business = { id: string; name: string; naics: string; certs: string[]; capacity: number; zone: string;
  revenue: number; employees: number; payroll: number; assets: number; debt: number; homeEquity: number };
export type Opportunity = { id: string; buyer: string; type: "Public" | "Corporate"; naics: string; value: number; track: "race-conscious" | "race-neutral"; goalPct?: number };

/** R27 benchmarks from the specification. */
export const PAYROLL_BENCHMARK = { minority: 38204, nonMinority: 56702 };

/** R23: score 0–100 on industry match, certification and capacity fit. */
export function matchScore(b: Business, o: Opportunity) {
  let s = 0;
  if (b.naics === o.naics) s += 50; else if (b.naics.slice(0, 2) === o.naics.slice(0, 2)) s += 25;
  if (o.track === "race-conscious" ? b.certs.includes("MBE") : b.certs.length > 0) s += 25;
  s += 25 * Math.min(1, b.capacity / o.value);
  return Math.round(s);
}

/** R26: business equity excludes residential home equity. */
export function equitySplit(b: Business) {
  const businessEquity = b.assets - b.debt;
  return { businessEquity, homeEquity: b.homeEquity, combined: businessEquity + b.homeEquity, homeShare: b.homeEquity / Math.max(1, businessEquity + b.homeEquity) };
}

/** R30: capital gap when debt-to-equity exceeds 2.0 or business equity < 25% of revenue. */
export function capitalGap(b: Business) {
  const { businessEquity } = equitySplit(b);
  const de = businessEquity > 0 ? b.debt / businessEquity : Infinity;
  const target = b.revenue * 0.25;
  const gap = Math.max(0, target - businessEquity);
  return { debtToEquity: de, gap, flagged: de > 2 || gap > 0 };
}

export const BUSINESSES: Business[] = [
  { id: "b1", name: "Peachtree Build Co.", naics: "236220", certs: ["MBE", "DBE"], capacity: 900000, zone: "West End", revenue: 2_400_000, employees: 18, payroll: 690_000, assets: 1_100_000, debt: 820_000, homeEquity: 240_000 },
  { id: "b2", name: "Sweet Auburn Catering", naics: "722320", certs: ["MBE"], capacity: 120000, zone: "Sweet Auburn", revenue: 480_000, employees: 9, payroll: 318_000, assets: 160_000, debt: 140_000, homeEquity: 190_000 },
  { id: "b3", name: "Cascade IT Partners", naics: "541512", certs: ["MBE", "WBE"], capacity: 600000, zone: "Cascade", revenue: 1_300_000, employees: 11, payroll: 610_000, assets: 520_000, debt: 150_000, homeEquity: 80_000 },
  { id: "b4", name: "Ponce Freight LLC", naics: "484110", certs: ["SBE"], capacity: 300000, zone: "Old Fourth Ward", revenue: 750_000, employees: 7, payroll: 270_000, assets: 310_000, debt: 290_000, homeEquity: 150_000 },
];

export const OPPORTUNITIES: Opportunity[] = [
  { id: "o1", buyer: "City of Atlanta – Airport", type: "Public", naics: "236220", value: 750000, track: "race-conscious", goalPct: 35 },
  { id: "o2", buyer: "Fulton County Schools", type: "Public", naics: "722320", value: 95000, track: "race-neutral" },
  { id: "o3", buyer: "Delta Supplier Diversity", type: "Corporate", naics: "541511", value: 420000, track: "race-conscious", goalPct: 20 },
  { id: "o4", buyer: "GA DOT", type: "Public", naics: "484110", value: 260000, track: "race-neutral" },
];

export const FUNDING_SOURCES = [
  { name: "Kiva US (0% P2P)", kind: "P2P microloan", max: 15000 },
  { name: "Mainvest", kind: "Revenue-share crowdfunding", max: 5_000_000 },
  { name: "iFundWomen", kind: "Rewards crowdfunding + grants", max: 100_000 },
  { name: "Community Revolving Loan Fund", kind: "CDFI revolving loan", max: 50_000 },
];

export const TOOLKIT = [
  { title: "Bonding & surety readiness", level: "Procurement" },
  { title: "Reading a municipal RFP", level: "Procurement" },
  { title: "Cash-flow forecasting 101", level: "Financial literacy" },
  { title: "Separating personal & business credit", level: "Financial literacy" },
  { title: "Getting MBE/DBE certified", level: "Certification" },
];
