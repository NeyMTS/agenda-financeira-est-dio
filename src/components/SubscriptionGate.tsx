import type { ReactNode } from "react";
import { Navigate, useLocation } from "@tanstack/react-router";
import { useSubscription } from "@/hooks/use-subscription";
import { hasAccess } from "@/lib/subscription";
import { useAdminRole } from "@/hooks/use-admin-role";
import { useOfflineAccess } from "./OfflineAccess";

/** Rotas sempre liberadas, mesmo sem assinatura ativa. */
const ALWAYS_ALLOWED = ["/planos", "/configuracoes", "/admin"];

export function SubscriptionGate({ children }: { children: ReactNode }) {
  const location = useLocation();
  const { data, isLoading, isError } = useSubscription();
  const { data: isAdmin, isLoading: isLoadingRole } = useAdminRole();
  const { online } = useOfflineAccess();
  // OfflineAccess already validates last-confirmed validity before rendering.
  if (!online) return <>{children}</>;

  // Nunca bloqueia enquanto carrega ou se houver falha na consulta.
  if (isLoading || isLoadingRole || isError) return <>{children}</>;

  if (isAdmin) return <>{children}</>;

  if (ALWAYS_ALLOWED.some((path) => location.pathname.startsWith(path))) {
    return <>{children}</>;
  }

  if (!hasAccess(data)) {
    return <Navigate to="/planos" replace />;
  }

  return <>{children}</>;
}
