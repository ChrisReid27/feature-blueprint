import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { BadgeCheck, MapPin, Star, Heart, ArrowLeft } from "lucide-react";
import { useDirectory } from "./DirectoryContext";
import { PHOTOS } from "./BusinessCard";
import { Button } from "@/components/ui/button";
import { analyze } from "@/lib/rtm/sentiment";
export function BusinessDetail({ id }: { id: string }) {
  const { listings, reviews, addReview, saved, toggleSaved, claim, claims } = useDirectory();
  const b = listings.find((x) => x.id === id);
  const [text, setText] = useState("");
  const [name, setName] = useState("");
  const [stars, setStars] = useState(5);
  const [sent, setSent] = useState(false);
  if (!b)
    return (
      <div className="py-20 text-center">
        <h1 className="text-2xl">This place is not listed</h1>
        <Link to="/" className="text-primary">
          Back to discovery
        </Link>
      </div>
    );
  const own = reviews.filter((r) => r.business === id);
  return (
    <div className="mx-auto max-w-5xl">
      <Link to="/" className="mb-5 flex items-center gap-2 text-sm text-primary">
        <ArrowLeft size={16} />
        Back to discovery
      </Link>
      <img
        src={PHOTOS[b.photo]}
        alt={b.name}
        width={1024}
        height={768}
        className="max-h-96 w-full rounded-lg object-cover"
      />
      <div className="mt-7 flex flex-wrap justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-display text-4xl">{b.name}</h1>
            {b.verified && <BadgeCheck className="text-primary" />}
          </div>
          <p className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin size={15} />
            {b.neighborhood}, Washington, D.C. · {b.category}
          </p>
          <div className="mt-3 flex items-center gap-2 text-sm">
            <Star size={16} className="fill-rating text-rating" />
            <b>
              {(
                (b.rating * b.reviews + own.reduce((s, r) => s + r.stars, 0)) /
                (b.reviews + own.length)
              ).toFixed(1)}
            </b>
            <span className="text-muted-foreground">{b.reviews + own.length} reviews</span>
            {b.verified && <span className="text-primary">· Verified business</span>}
          </div>
        </div>
        <Button variant="outline" onClick={() => toggleSaved(id)}>
          <Heart className={saved.includes(id) ? "fill-primary text-primary" : ""} />
          {saved.includes(id) ? "Saved" : "Save place"}
        </Button>
      </div>
      <div className="mt-4 flex gap-2">
        {b.ownership.map((o) => (
          <span className="ownership-tag" key={o}>
            {o}
          </span>
        ))}
      </div>
      <div className="mt-8 grid gap-10 md:grid-cols-[1.3fr_1fr]">
        <section>
          <h2 className="font-display text-2xl">A little about us</h2>
          <p className="mt-3 text-sm leading-7 text-muted-foreground">{b.description}</p>
          <h2 className="mt-8 border-t pt-6 font-display text-2xl">Neighborhood voices</h2>
          {[
            {
              name: "Alex M.",
              stars: 5,
              text: "Such a lovely neighborhood find. Friendly people and a wonderful atmosphere.",
            },
            ...own,
          ].map((r, i) => (
            <article key={i} className="border-b py-5">
              <div className="flex justify-between text-sm">
                <b>{r.name}</b>
                <span className="text-rating">
                  {"★".repeat(r.stars)}
                  {"☆".repeat(5 - r.stars)}
                </span>
              </div>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{r.text}</p>
            </article>
          ))}
        </section>
        <section className="border-t pt-5">
          <h2 className="font-display text-2xl">Share your experience</h2>
          <form
            className="mt-4 space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              if (!name.trim() || !text.trim()) return;
              analyze({
                id: reviews.length,
                platform: "Google",
                zone: b.neighborhood,
                text,
                day: 8,
              });
              addReview({ business: id, name: name.trim(), text: text.trim(), stars });
              setSent(true);
              setText("");
            }}
          >
            <label className="block text-xs font-medium">
              Your name
              <input
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-2 h-10 w-full rounded border bg-card px-3"
              />
            </label>
            <fieldset>
              <legend className="text-xs font-medium">Your rating</legend>
              <div className="mt-2 flex gap-1">
                {[1, 2, 3, 4, 5].map((n) => (
                  <Button
                    key={n}
                    type="button"
                    size="icon"
                    variant="ghost"
                    aria-label={`${n} stars`}
                    aria-pressed={stars === n}
                    onClick={() => setStars(n)}
                  >
                    <Star
                      className={n <= stars ? "fill-rating text-rating" : "text-muted-foreground"}
                    />
                  </Button>
                ))}
              </div>
            </fieldset>
            <label className="block text-xs font-medium">
              Your review
              <textarea
                required
                value={text}
                onChange={(e) => setText(e.target.value)}
                rows={4}
                className="mt-2 w-full rounded border bg-card p-3"
              />
            </label>
            <Button type="submit">Post review</Button>
            {sent && (
              <p role="status" className="text-sm text-success">
                Thanks! Your review is now on this listing.
              </p>
            )}
          </form>
          <div className="mt-8 border-t pt-5">
            <h3 className="font-semibold">Is this your business?</h3>
            <Button
              variant="outline"
              className="mt-3"
              disabled={claims.includes(id)}
              onClick={() => claim(id)}
            >
              {claims.includes(id) ? "Claim submitted" : "Claim this listing"}
            </Button>
            <p className="mt-2 text-xs text-muted-foreground">
              Claim requests are reviewed before ownership is confirmed.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
