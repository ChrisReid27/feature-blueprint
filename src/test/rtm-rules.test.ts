import { describe, expect, it } from "vitest";
import { iatBucket, runBirdnest, syntheticRatings } from "@/lib/rtm/birdnest";
import { analyze, cronbachAlpha, LOSS_AVERSION } from "@/lib/rtm/sentiment";
import { answerBlocks, cwv, eeatGate, parseSections } from "@/lib/rtm/seo";
import { PAYROLL_BENCHMARK, capitalGap, equitySplit, BUSINESSES } from "@/lib/rtm/equity";
import { REQUIREMENTS } from "@/lib/rtm/requirements";

describe("RTM rules", () => {
  it("traces all 50 requirements", () => expect(REQUIREMENTS).toHaveLength(50));
  it("R14 buckets span 20 log buckets", () => {
    expect(iatBucket(1)).toBe(0);
    expect(iatBucket(60 * 60 * 24 * 365 * 10)).toBe(19);
  });
  it("R12 BIRDNEST ranks injected attackers first", () => {
    const top = runBirdnest(syntheticRatings()).slice(0, 10);
    expect(top.filter((s) => !s.user.startsWith("user_")).length).toBe(10);
  });
  it("R43 sarcasm flips positive words to negative", () => {
    const a = analyze({ id: 0, platform: "Google", zone: "x", text: "Oh great, waited 2 hours for cold food.", day: 1 });
    expect(a.sarcasm).toBe(true);
    expect(a.label).toBe("negative");
  });
  it("R44 loss aversion coefficient is 2.25", () => expect(LOSS_AVERSION).toBe(2.25));
  it("R50 Cronbach alpha matches known value", () => {
    expect(cronbachAlpha([[1, 1], [2, 2], [3, 3]])).toBeCloseTo(1);
  });
  it("R1 answer blocks require 50–75 words", () => {
    const short = answerBlocks(parseSections("## Q?\nToo short."))[0];
    expect(short.ok).toBe(false);
  });
  it("R8 CWV thresholds", () => expect(cwv(2.5, 200, 0.1)).toEqual({ lcp: true, inp: true, cls: true }));
  it("R10 publishing blocked without two citations", () =>
    expect(eeatGate({ author: "a", credentials: "b", citations: 1, reviewer: "c" }).pass).toBe(false));
  it("R26 home equity excluded from business equity", () => {
    const b = BUSINESSES[0];
    expect(equitySplit(b).businessEquity).toBe(b.assets - b.debt);
  });
  it("R30 flags debt/equity above 2", () => expect(capitalGap({ ...BUSINESSES[0], assets: 300, debt: 250, revenue: 0 }).flagged).toBe(true));
  it("R27 payroll benchmarks", () => expect(PAYROLL_BENCHMARK).toEqual({ minority: 38204, nonMinority: 56702 }));
});
