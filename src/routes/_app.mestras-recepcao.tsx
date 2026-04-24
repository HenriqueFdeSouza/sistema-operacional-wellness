import { createFileRoute } from "@tanstack/react-router";
import { MestrasPage } from "@/components/mestras-page";
import { mestrasRecepService, SETORES_RECEP } from "@/services/mestras";

export const Route = createFileRoute("/_app/mestras-recepcao")({
  head: () => ({ meta: [{ title: "Mestras Recepção — Wellness Control Hub" }] }),
  component: () => (
    <MestrasPage
      title="Chaves Mestras • Recepção"
      description="Saída e retorno das chaves mestras da recepção e mensageiros."
      service={mestrasRecepService}
      setores={SETORES_RECEP}
    />
  ),
});