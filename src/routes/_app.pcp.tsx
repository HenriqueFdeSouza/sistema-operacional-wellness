import { createFileRoute } from "@tanstack/react-router";
import { ComingSoon } from "@/components/coming-soon";

export const Route = createFileRoute("/_app/pcp")({
  component: () => <ComingSoon title="PCP — Retirada de Produtos" description="Histórico de retiradas." />,
});