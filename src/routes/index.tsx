import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { authService } from "@/services/auth";

export const Route = createFileRoute("/")({
  component: IndexRedirect,
});

function IndexRedirect() {
  const navigate = useNavigate();

  useEffect(() => {
    const session = authService.current();
    navigate({ to: session ? "/radios" : "/login", replace: true });
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-muted-foreground text-sm">Carregando...</div>
    </div>
  );
}
