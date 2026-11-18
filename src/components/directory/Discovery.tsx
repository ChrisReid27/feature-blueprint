import { useRef, useState } from "react";
import {
  Search,
  MapPin,
  Camera,
  Coffee,
  ShoppingBag,
  Palette,
  HeartPulse,
  Wrench,
  Utensils,
  SlidersHorizontal,
  Grid2X2,
  Map,
  ArrowRight,
  BadgeCheck,
  X,
  Heart,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "@tanstack/react-router";
import { BusinessCard } from "./BusinessCard";
import { useDirectory } from "./DirectoryContext";
import { NeighborhoodMap } from "./NeighborhoodMap";
import { filterListings } from "@/lib/rtm/directory";
import hero from "@/assets/dc-neighborhood.jpg";
import { aHash, hamming, type Img } from "@/lib/rtm/vision";
import { PHOTOS } from "./BusinessCard";
const categories = [
  ["All places", Grid2X2],
  ["Food & Drink", Coffee],
  ["Shopping", ShoppingBag],
  ["Arts & Culture", Palette],
  ["Health & Wellness", HeartPulse],
  ["Home & Services", Wrench],
  ["Restaurants", Utensils],
] as const;
export function Discovery() {
  const { listings, saved } = useDirectory();
  const [q, setQ] = useState("");
  const [category, setCategory] = useState("All places");
  const [ownership, setOwnership] = useState<string[]>([]);
  const [verified, setVerified] = useState(false);
  const [view, setView] = useState("grid");
  const [sort, setSort] = useState("recommended");
  const [savedOnly, setSavedOnly] = useState(false);
  const [photoIds, setPhotoIds] = useState<string[] | null>(null);
  const [photoName, setPhotoName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const file = useRef<HTMLInputElement>(null);
  let results = filterListings(listings, q, category, ownership, verified).filter(
    (b) => (!savedOnly || saved.includes(b.id)) && (!photoIds || photoIds.includes(b.id)),
  );
  if (sort === "rating") results = [...results].sort((a, b) => b.rating - a.rating);
  const photoSearch = async (f: File) => {
    setBusy(true);
    setError("");
    try {
      const toHash = async (src: string) => {
        const img = new Image();
        img.src = src;
        await img.decode();
        const c = document.createElement("canvas");
        c.width = 64;
        c.height = 64;
        const ctx = c.getContext("2d");
        if (!ctx) throw new Error("Photo unavailable");
        ctx.drawImage(img, 0, 0, 64, 64);
        return aHash({ w: 64, h: 64, d: ctx.getImageData(0, 0, 64, 64).data } as Img);
      };
      const url = URL.createObjectURL(f);
      let hash: number[];
      try {
        hash = await toHash(url);
      } finally {
        URL.revokeObjectURL(url);
      }
      const ranked = await Promise.all(
        Object.entries(PHOTOS).map(async ([key, src]) => ({
          key,
          d: hamming(hash, await toHash(src)),
        })),
      );
      ranked.sort((a, b) => a.d - b.d);
      const best = ranked[0];
      if (best) {
        setPhotoIds(listings.filter((b) => b.photo === best.key).map((b) => b.id));
        setPhotoName(f.name);
        setQ("");
        setCategory("All places");
        setOwnership([]);
        setVerified(false);
      }
    } catch {
      setError("That photo could not be opened. Please try a JPG or PNG.");
    } finally {
      setBusy(false);
    }
  };
  return (
    <>
      <section className="discovery-hero relative">
        <img
          src={hero}
          width={1920}
          height={768}
          alt="Independent shops on a sunny neighborhood street"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="hero-shade absolute inset-0" />
        <div className="page-width relative py-12 md:py-14">
          <p className="mb-3 flex items-center gap-2 text-xs font-medium uppercase tracking-[0.16em] text-hero-foreground">
            <span className="h-px w-6 bg-hero-foreground" />
            Big heart. Local roots.
          </p>
          <h1 className="font-display text-4xl leading-[1.1] text-hero-foreground md:text-5xl">
            Neighborly.
            <br />
            Find your next local favorite.
          </h1>
          <p className="mt-4 max-w-lg text-sm leading-6 text-hero-foreground/90">
            The best of your neighborhood, brought together.
            <br />
            Discover small businesses. Meet the people behind them.
          </p>
          <form
            className="search-box mt-6 flex max-w-3xl items-center rounded-lg bg-card p-2 shadow-sm"
            onSubmit={(e) => {
              e.preventDefault();
              document.getElementById("discover")?.scrollIntoView({ behavior: "smooth" });
            }}
          >
            <Search size={20} className="ml-3 shrink-0 text-muted-foreground" />
            <input
              aria-label="Search businesses"
              placeholder="Coffee, flowers, a new favorite…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="h-10 min-w-0 flex-1 bg-transparent px-3 text-sm outline-none"
            />
            <span className="hidden items-center gap-2 border-l px-4 text-xs text-muted-foreground sm:flex">
              <MapPin size={16} />
              Washington, D.C.
            </span>
            <Button
              type="button"
              size="icon"
              variant="ghost"
              title="Search by photo"
              aria-label="Search by photo"
              onClick={() => file.current?.click()}
              disabled={busy}
            >
              <Camera />
            </Button>
            <Button className="ml-2 h-11 px-5" type="submit">
              {busy ? "Searching…" : "Search"}
              <ArrowRight />
            </Button>
          </form>
          <input
            ref={file}
            type="file"
            accept="image/*"
            className="hidden"
            aria-label="Upload search photo"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void photoSearch(f);
              e.target.value = "";
            }}
          />
          <div className="mt-4 flex flex-wrap items-center gap-4 text-[11px] text-hero-foreground/90">
            <span className="flex items-center gap-1.5">
              <BadgeCheck size={15} />
              Local businesses. Real connection.
            </span>
            <span>Made for a more connected neighborhood.</span>
          </div>
        </div>
      </section>
      <div className="border-b bg-card">
        <div className="page-width flex gap-7 overflow-x-auto py-4">
          {categories.map(([name, Icon]) => (
            <Button
              key={name}
              variant="ghost"
              className={`category-button h-auto shrink-0 flex-col gap-2 rounded-none px-2 py-2 text-xs ${category === name ? "text-primary" : "text-muted-foreground"}`}
              onClick={() => setCategory(name)}
              aria-pressed={category === name}
            >
              <Icon size={22} />
              {name}
            </Button>
          ))}
        </div>
      </div>
      <section id="discover" className="page-width py-7">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.14em] text-primary">
              Around the corner
            </p>
            <h2 className="font-display text-3xl">Small businesses. Big discoveries.</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Find a place you love. Support a story that matters.
            </p>
          </div>
          <Button
            variant="ghost"
            className="text-primary"
            onClick={() => setSavedOnly(!savedOnly)}
            aria-pressed={savedOnly}
          >
            <Heart size={16} />
            {savedOnly ? "All places" : `Saved places${saved.length ? ` (${saved.length})` : ""}`}
          </Button>
        </div>
        <div className="my-5 flex flex-wrap items-center gap-2">
          <span className="mr-1 text-xs font-medium">Support local</span>
          {["Black-owned", "Women-owned", "Veteran-owned", "LGBTQ+-owned"].map((o) => (
            <Button
              key={o}
              size="sm"
              variant={ownership.includes(o) ? "default" : "outline"}
              className="rounded-full"
              aria-pressed={ownership.includes(o)}
              onClick={() =>
                setOwnership((v) => (v.includes(o) ? v.filter((x) => x !== o) : [...v, o]))
              }
            >
              {o}
            </Button>
          ))}
          <label className="ml-auto flex cursor-pointer items-center gap-2 text-xs">
            <input
              type="checkbox"
              checked={verified}
              onChange={(e) => setVerified(e.target.checked)}
              className="accent-primary"
            />
            <BadgeCheck size={14} className="text-primary" />
            Verified only
          </label>
        </div>
        {photoIds && (
          <div className="mb-4 flex items-center gap-2 rounded bg-accent p-3 text-sm">
            <Camera size={16} />
            Visually similar places · {photoName}
            <Button
              variant="ghost"
              size="icon"
              aria-label="Clear photo search"
              onClick={() => {
                setPhotoIds(null);
                setPhotoName("");
              }}
            >
              <X />
            </Button>
          </div>
        )}
        {error && (
          <p role="alert" className="mb-4 text-sm text-destructive">
            {error}
          </p>
        )}
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-t pt-4">
          <p className="text-xs text-muted-foreground">
            <b className="text-foreground">{results.length} places</b> to discover in Washington,
            D.C.
          </p>
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-1 text-xs text-muted-foreground">
              <SlidersHorizontal size={13} />
              <select
                aria-label="Sort places"
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className="bg-transparent"
              >
                <option value="recommended">Recommended</option>
                <option value="rating">Top rated</option>
              </select>
            </label>
            <div className="flex rounded-md border bg-card p-0.5">
              <Button
                size="sm"
                variant={view === "grid" ? "secondary" : "ghost"}
                aria-pressed={view === "grid"}
                onClick={() => setView("grid")}
              >
                <Grid2X2 />
                Grid
              </Button>
              <Button
                size="sm"
                variant={view === "map" ? "secondary" : "ghost"}
                aria-pressed={view === "map"}
                onClick={() => setView("map")}
              >
                <Map />
                Map
              </Button>
            </div>
          </div>
        </div>
        {!results.length ? (
          <div className="py-16 text-center">
            <Search className="mx-auto mb-3 text-muted-foreground" />
            <h3 className="text-lg font-semibold">No places found</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Try a different search or fewer filters.
            </p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => {
                setQ("");
                setCategory("All places");
                setOwnership([]);
                setVerified(false);
                setSavedOnly(false);
                setPhotoIds(null);
              }}
            >
              Clear filters
            </Button>
          </div>
        ) : view === "map" ? (
          <NeighborhoodMap listings={results} />
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {results.map((b) => (
              <BusinessCard key={b.id} business={b} />
            ))}
          </div>
        )}
        <div className="mt-10 flex flex-wrap items-center justify-between gap-4 border-t py-7">
          <div>
            <h3 className="font-display text-2xl">Your business belongs here.</h3>
            <p className="mt-1 text-sm text-muted-foreground">A local story worth discovering.</p>
          </div>
          <Button asChild variant="outline">
            <Link to="/owner">
              Claim your business
              <ArrowRight />
            </Link>
          </Button>
        </div>
      </section>
    </>
  );
}
