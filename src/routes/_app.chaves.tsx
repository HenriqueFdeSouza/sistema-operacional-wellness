import { createFileRoute } from "@tanstack/react-router";
import { ComingSoon } from "@/components/coming-soon";

export const Route = createFileRoute("/_app/chaves")({
  component: () => (
    <ComingSoon title="Controle de Chaves" description="Saída e retorno de chaves operacionais." />
  ),
});