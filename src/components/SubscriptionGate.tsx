import type { ReactNode } from "react";
import { Navigate, useLocation } from "@tanstack/react-router";
import { useSubscription } from "@/hooks/use-subscription";
import { hasAccess } from "@/lib/subscription";

/** Rotas sempre liberadas, mesmo sem assinatura ativa. */
const ALWAYS_ALLOWED = ["/planos", "/configuracoes"];

export function SubscriptionGate({ children }: { children: ReactNode }) {
  const location = useLocation();
  const { data, isLoading, isError } = useSubscription();

  // Nunca bloqueia enquanto carrega ou se houver falha na consulta.
  if (isLoading || isError) return <>{children}</>;

  if (ALWAYS_ALLOWED.some((path) => location.pathname.startsWith(path))) {
    return <>{children}</>;
  }

  if (!hasAccess(data)) {
    return <Navigate to="/planos" replace />;
  }

  return <>{children}</>;
}
