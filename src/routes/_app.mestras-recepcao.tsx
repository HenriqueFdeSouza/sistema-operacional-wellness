import { createFileRoute } from "@tanstack/react-router";
import { ComingSoon } from "@/components/coming-soon";

export const Route = createFileRoute("/_app/mestras-recepcao")({
  component: () => (
    <ComingSoon title="Chaves Mestras • Recepção" description="Chaves mestras da recepção e mensageiros." />
  ),
});