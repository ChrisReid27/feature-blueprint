import { describe, it, expect } from "vitest";
import { filterListings, LISTINGS } from "@/lib/rtm/directory";
describe("Directory discovery rules", () => {
  it("Black-owned filter includes only Black-owned businesses", () => {
    const rows = filterListings(LISTINGS, "", "All places", ["Black-owned"], false);
    expect(rows.map((b) => b.id)).toEqual(["juniper", "little", "wild"]);
  });
  it("Women-owned filter includes Women-owned businesses", () => {
    expect(
      filterListings(LISTINGS, "", "All places", ["Women-owned"], false).map((b) => b.id),
    ).toEqual(["juniper", "bloom", "wild", "paper"]);
  });
  it("Veteran-owned filter includes Veteran-owned businesses", () => {
    expect(
      filterListings(LISTINGS, "", "All places", ["Veteran-owned"], false).map((b) => b.id),
    ).toEqual(["chapter"]);
  });
  it("Verified only excludes unverified listings", () => {
    expect(filterListings(LISTINGS, "", "All places", [], true).map((b) => b.id)).toEqual([
      "juniper",
      "bloom",
      "chapter",
      "wild",
    ]);
  });
  it("Search and category combine with ownership", () => {
    expect(
      filterListings(LISTINGS, "juniper", "Food & Drink", ["Black-owned"], true).map((b) => b.id),
    ).toEqual(["juniper"]);
    expect(filterListings(LISTINGS, "juniper", "Shopping", ["Black-owned"], true)).toEqual([]);
  });
});
