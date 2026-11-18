import { BadgeCheck, ShieldAlert } from "lucide-react";
import { useDirectory } from "./DirectoryContext";
import { Button } from "@/components/ui/button";
import { PHOTOS } from "./BusinessCard";
import { useState } from "react";
export function VerificationQueue() {
  const { listings, setVerified } = useDirectory();
  const [inspected, setInspected] = useState<string>();
  return (
    <section className="border-t py-5">
      <h2 className="font-display text-2xl">Listing verification</h2>
      <p className="mt-2 text-sm text-muted-foreground">
        Review listing details before approving or revoking a badge. These are sample review cases.
      </p>
      <div className="mt-5 grid gap-4 md:grid-cols-3">
        {listings.map((b) => (
          <article key={b.id} className="rounded-lg border bg-card p-4">
            <div className="flex items-center gap-3">
              <img
                src={PHOTOS[b.photo]}
                width={64}
                height={64}
                alt={b.name}
                className="h-14 w-14 rounded object-cover"
              />
              <div>
                <h3 className="text-sm font-semibold">{b.name}</h3>
                <span
                  className={`mt-1 flex items-center gap-1 text-xs ${b.verified ? "text-success" : "text-warning"}`}
                >
                  {b.verified ? <BadgeCheck size={13} /> : <ShieldAlert size={13} />}{" "}
                  {b.verified ? "Verified" : "Awaiting verification"}
                </span>
              </div>
            </div>
            <Button
              variant="link"
              className="mt-2 h-7 px-0 text-xs"
              onClick={() => setInspected(inspected === b.id ? undefined : b.id)}
            >
              Inspect listing
            </Button>
            {inspected === b.id && (
              <div className="my-3 text-xs leading-6 text-muted-foreground">
                <p>{b.description}</p>
                <p>
                  {b.neighborhood} · {b.ownership.join(", ")}
                </p>
                <p>Ownership documentation: sample case, not verified evidence.</p>
              </div>
            )}
            <Button
              size="sm"
              variant={b.verified ? "outline" : "default"}
              className="mt-2 w-full"
              onClick={() => setVerified(b.id, !b.verified)}
            >
              {b.verified ? "Revoke verification" : "Approve verification"}
            </Button>
          </article>
        ))}
      </div>
    </section>
  );
}
