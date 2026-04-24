import { createFileRoute } from "@tanstack/react-router";
import { ComingSoon } from "@/components/coming-soon";

export const Route = createFileRoute("/_app/ccr")({
  component: () => <ComingSoon title="CCR" description="Conformidade com a rotina de segurança." />,
});