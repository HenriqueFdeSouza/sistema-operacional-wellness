import { createFileRoute } from "@tanstack/react-router";
import { MestrasPage } from "@/components/mestras-page";
import { mestrasManutService, SETORES_MANUT } from "@/services/mestras";

export const Route = createFileRoute("/_app/mestras-manutencao")({
  head: () => ({ meta: [{ title: "Mestras Manutenção — Wellness Control Hub" }] }),
  component: () => (
    <MestrasPage
      title="Chaves Mestras • Manutenção"
      description="Saída e retorno das chaves mestras da manutenção."
      service={mestrasManutService}
      setores={SETORES_MANUT}
    />
  ),
});