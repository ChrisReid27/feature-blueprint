import { Link } from "@tanstack/react-router";
import {
  BadgeCheck,
  Search,
  Sparkles,
  HandCoins,
  MessageCircle,
  Camera,
  ArrowUpRight,
} from "lucide-react";
import { useState } from "react";
import { useDirectory } from "./DirectoryContext";
import { Button } from "@/components/ui/button";
import { PHOTOS } from "./BusinessCard";
export function OwnerPortal() {
  const { listings, claims, claim, reviews } = useDirectory();
  const [q, setQ] = useState("");
  return (
    <>
      <p className="text-xs font-semibold uppercase tracking-widest text-primary">
        For the people behind the places
      </p>
      <h1 className="mt-2 font-display text-4xl">Grow your local story.</h1>
      <p className="mt-3 text-sm text-muted-foreground">
        Make connections, get discovered, and build a stronger business.
      </p>
      <section className="mt-8 border-y py-6">
        <h2 className="font-display text-2xl">Find and claim your business</h2>
        <div className="mt-4 flex max-w-lg items-center rounded border bg-card px-3">
          <Search size={17} className="text-muted-foreground" />
          <input
            aria-label="Find your listing"
            placeholder="Search your business name…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="h-11 min-w-0 flex-1 bg-transparent px-3 text-sm outline-none"
          />
        </div>
        <div className="mt-5 grid gap-4 md:grid-cols-3">
          {listings
            .filter((b) => b.name.toLowerCase().includes(q.toLowerCase()))
            .slice(0, 3)
            .map((b) => (
              <article key={b.id} className="flex items-center gap-3 rounded-lg border bg-card p-3">
                <img
                  src={PHOTOS[b.photo]}
                  alt={b.name}
                  width={72}
                  height={72}
                  className="h-16 w-16 rounded object-cover"
                />
                <div className="min-w-0">
                  <h3 className="text-sm font-semibold">{b.name}</h3>
                  <p className="mt-1 text-xs text-muted-foreground">{b.neighborhood}</p>
                  <Button
                    size="sm"
                    variant="link"
                    className="h-7 px-0"
                    disabled={claims.includes(b.id)}
                    onClick={() => claim(b.id)}
                  >
                    {claims.includes(b.id) ? "Claim submitted" : "Claim listing"}
                    <ArrowUpRight size={12} />
                  </Button>
                </div>
              </article>
            ))}
        </div>
        {!listings.some((b) => b.name.toLowerCase().includes(q.toLowerCase())) && (
          <p className="mt-4 text-sm text-muted-foreground">
            No matching listing. Try another name.
          </p>
        )}
      </section>
      <section className="py-8">
        <h2 className="font-display text-2xl">Your next chapter starts here</h2>
        <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              to: "/seo",
              Icon: Sparkles,
              title: "Get discovered",
              text: "Polish your business description and answer the questions customers ask.",
            },
            {
              to: "/equity",
              Icon: HandCoins,
              title: "Funding & contracts",
              text: "Find procurement opportunities, lending resources, and practical support.",
            },
            {
              to: "/sentiment",
              Icon: MessageCircle,
              title: "Customer voices",
              text: `Listen to feedback and respond thoughtfully. ${reviews.length} new community reviews.`,
            },
            {
              to: "/vision",
              Icon: Camera,
              title: "Photo & shop tools",
              text: "Create shoppable photos, read documents, and check your inventory.",
            },
          ].map(({ to, Icon, title, text }) => (
            <Link
              to={to}
              key={to}
              className="rounded-lg border bg-card p-5 transition-colors hover:border-primary"
            >
              <Icon className="mb-5 text-primary" />
              <h3 className="font-semibold">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{text}</p>
              <ArrowUpRight className="mt-4 text-primary" size={18} />
            </Link>
          ))}
        </div>
      </section>
      <section className="border-t py-6">
        <h2 className="flex items-center gap-2 font-display text-2xl">
          <BadgeCheck className="text-primary" />
          Your listing requests
        </h2>
        {claims.length ? (
          claims.map((id) => (
            <p key={id} className="mt-4 text-sm">
              {listings.find((b) => b.id === id)?.name}{" "}
              <span className="ml-3 text-warning">Awaiting ownership review</span>
            </p>
          ))
        ) : (
          <p className="mt-3 text-sm text-muted-foreground">No claims submitted yet.</p>
        )}
      </section>
    </>
  );
}
