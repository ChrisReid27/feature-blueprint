import { createFileRoute } from "@tanstack/react-router";
import { BusinessDetail } from "@/components/directory/BusinessDetail";
import { LISTINGS } from "@/lib/rtm/directory";
export const Route = createFileRoute("/business/$id")({
  head: ({ params }) => {
    const b = LISTINGS.find((x) => x.id === params.id);
    const title = `${b?.name || "Business"} · Neighborly`;
    const description = b?.description || "Discover a local Washington, D.C. business.";
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary_large_image" },
      ],
    };
  },
  component: Page,
});
function Page() {
  const { id } = Route.useParams();
  return <BusinessDetail id={id} />;
}
