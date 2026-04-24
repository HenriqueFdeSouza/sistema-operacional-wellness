import { TopBar } from "./top-bar";
import { Sparkles } from "lucide-react";

export function ComingSoon({ title, description }: { title: string; description?: string }) {
  return (
    <>
      <TopBar title={title} description={description} />
      <main className="flex-1 p-6 overflow-y-auto">
        <div className="bg-card border border-dashed border-border rounded-xl p-12 flex flex-col items-center justify-center text-center">
          <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-primary-foreground shadow-lg mb-4">
            <Sparkles className="h-6 w-6" />
          </div>
          <h2 className="font-display text-xl font-bold text-foreground">Módulo em construção</h2>
          <p className="text-sm text-muted-foreground mt-2 max-w-md">
            Este módulo será habilitado na próxima etapa, após a aprovação do estilo e funcionamento
            do Módulo de Rádios.
          </p>
        </div>
      </main>
    </>
  );
}