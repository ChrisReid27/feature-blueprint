import { createFileRoute } from "@tanstack/react-router";
import { OwnerPortal } from "@/components/directory/OwnerPortal";
export const Route = createFileRoute("/owner")({
  head: () => ({
    meta: [
      { title: "Business owner portal · Neighborly" },
      {
        name: "description",
        content:
          "Claim your local business, improve your listing, and explore funding and customer feedback.",
      },
      { property: "og:title", content: "Grow your local story · Neighborly" },
      {
        property: "og:description",
        content: "Tools and resources for independent business owners.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: OwnerPortal,
});
