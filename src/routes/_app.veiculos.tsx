import { createFileRoute } from "@tanstack/react-router";
import { ComingSoon } from "@/components/coming-soon";

export const Route = createFileRoute("/_app/veiculos")({
  component: () => <ComingSoon title="Controle de Veículos" description="Cadastro de veículos autorizados." />,
});