import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { SubscriptionGate } from "@/components/SubscriptionGate";
import { PageTransition } from "@/components/PageTransition";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    /*
     * Usa a sessão já armazenada localmente: não há ida à rede
     * a cada troca de tela. A revalidação com o servidor continua
     * acontecendo em segundo plano pelo próprio cliente Supabase,
     * e as regras do banco seguem protegendo os dados.
     */
    const { data, error } = await supabase.auth.getSession();
    const user = data.session?.user ?? null;
    if (error || !user) throw redirect({ to: "/auth" });
    return { user };
  },
  pendingMs: 150,
  pendingMinMs: 200,
  pendingComponent: PageSkeleton,
  component: () => (
    <SubscriptionGate>
      <PageTransition>
        <Outlet />
      </PageTransition>
    </SubscriptionGate>
  ),
});
