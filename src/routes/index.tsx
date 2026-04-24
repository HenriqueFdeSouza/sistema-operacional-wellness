import { createFileRoute, redirect } from "@tanstack/react-router";
import { authService } from "@/services/auth";

export const Route = createFileRoute("/")({
  beforeLoad: () => {
    if (typeof window === "undefined") return;
    const session = authService.current();
    if (session) {
      throw redirect({ to: "/radios" });
    }
    throw redirect({ to: "/login" });
  },
  component: () => null,
});
