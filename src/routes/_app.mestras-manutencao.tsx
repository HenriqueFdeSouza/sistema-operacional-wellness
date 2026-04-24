import { createFileRoute } from "@tanstack/react-router";
import { ComingSoon } from "@/components/coming-soon";

export const Route = createFileRoute("/_app/mestras-manutencao")({
  component: () => (
    <ComingSoon title="Chaves Mestras • Manutenção" description="Chaves mestras da manutenção." />
  ),
});