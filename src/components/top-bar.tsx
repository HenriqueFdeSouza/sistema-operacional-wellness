import { useEffect, useState } from "react";
import { Clock } from "lucide-react";

interface TopBarProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
}

function formatDate(d: Date) {
  return d.toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function formatTime(d: Date) {
  return d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

export function TopBar({ title, description, actions }: TopBarProps) {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(id);
  }, []);

  return (
    <header className="bg-card border-b border-border px-6 py-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground">{title}</h1>
        {description && <p className="text-sm text-muted-foreground mt-0.5">{description}</p>}
      </div>
      <div className="flex items-center gap-4">
        {actions}
        <div className="hidden sm:flex items-center gap-2 text-sm text-muted-foreground bg-muted px-3 py-2 rounded-lg">
          <Clock className="h-4 w-4 text-secondary" />
          <div className="leading-tight">
            <div className="font-medium text-foreground capitalize">{formatDate(now)}</div>
            <div className="text-xs tabular-nums">{formatTime(now)}</div>
          </div>
        </div>
      </div>
    </header>
  );
}