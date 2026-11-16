import { createFileRoute } from "@tanstack/react-router";
import OperationsPage from "@/components/gis/OperationsPage";

export const Route = createFileRoute("/assets")({
  head: () => ({ meta: [{ title: "Assets — GridGraph" }] }),
  component: AssetsPage,
});

function AssetsPage() {
  return <OperationsPage section="assets" />;
}
