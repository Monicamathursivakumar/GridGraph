import { createFileRoute } from "@tanstack/react-router";
import OperationsPage from "@/components/gis/OperationsPage";

export const Route = createFileRoute("/hazards")({
  head: () => ({ meta: [{ title: "Hazards — GridGraph" }] }),
  component: HazardsPage,
});

function HazardsPage() {
  return <OperationsPage section="hazards" />;
}
