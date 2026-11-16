import { createFileRoute } from "@tanstack/react-router";
import OperationsPage from "@/components/gis/OperationsPage";

export const Route = createFileRoute("/network")({
  head: () => ({ meta: [{ title: "Network — GridGraph" }] }),
  component: NetworkPage,
});

function NetworkPage() {
  return <OperationsPage section="network" />;
}
