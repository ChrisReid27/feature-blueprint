import { createFileRoute } from "@tanstack/react-router";
import { Discovery } from "@/components/directory/Discovery";
export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Neighborly · Discover your local favorites" },
      {
        name: "description",
        content:
          "Discover independent Washington, D.C. businesses, support diverse owners and find your next neighborhood favorite.",
      },
      { property: "og:title", content: "Neighborly · Your neighborhood, together" },
      {
        property: "og:description",
        content: "Discover local favorites and the people behind them.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Discovery,
});
