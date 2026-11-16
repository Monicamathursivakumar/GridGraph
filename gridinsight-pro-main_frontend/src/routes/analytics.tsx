import { createFileRoute } from "@tanstack/react-router";
import OperationsPage from "@/components/gis/OperationsPage";

export const Route = createFileRoute("/analytics")({
  head: () => ({ meta: [{ title: "Analytics — GridGraph" }] }),
  component: AnalyticsPage,
});

function AnalyticsPage() {
  return <OperationsPage section="analytics" />;
}
