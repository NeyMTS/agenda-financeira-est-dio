import { createFileRoute, Outlet, useLocation } from "@tanstack/react-router";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SubscriptionGate } from "@/components/SubscriptionGate";
import { PageTransition } from "@/components/PageTransition";
import { PageSkeleton } from "@/components/PageSkeleton";
import { VisitorAccessProvider } from "@/components/VisitorAccess";

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
    return { user: error ? null : user };
  },
  pendingMs: 150,
  pendingMinMs: 200,
  pendingComponent: PageSkeleton,
  component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
  const { user } = Route.useRouteContext();
  const location = useLocation();

  useEffect(() => {
    if (!user) return;
    void supabase.rpc("touch_last_access");
  }, [location.pathname, user]);

  return (
    <VisitorAccessProvider user={user}>
      {user ? (
        <SubscriptionGate>
          <PageTransition><Outlet /></PageTransition>
        </SubscriptionGate>
      ) : (
        <PageTransition><Outlet /></PageTransition>
      )}
    </VisitorAccessProvider>
  );
}
