import { createFileRoute } from "@tanstack/react-router";
import { ComingSoon } from "@/components/coming-soon";

export const Route = createFileRoute("/_app/armarios")({
  component: () => <ComingSoon title="Controle de Armários" description="Mapa de armários masculinos e femininos." />,
});