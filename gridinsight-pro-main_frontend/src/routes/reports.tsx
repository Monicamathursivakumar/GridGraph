import { createFileRoute } from "@tanstack/react-router";
import OperationsPage from "@/components/gis/OperationsPage";

export const Route = createFileRoute("/reports")({
  head: () => ({ meta: [{ title: "Reports — GridGraph" }] }),
  component: ReportsPage,
});

function ReportsPage() {
  return <OperationsPage section="reports" />;
}
