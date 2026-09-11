import type { ReactNode } from "react";
import { useRouterState } from "@tanstack/react-router";

/**
 * Transição curta de entrada a cada troca de tela.
 * Puramente visual — respeita prefers-reduced-motion via CSS.
 */
export function PageTransition({ children }: { children: ReactNode }) {
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  });

  return (
    <div key={pathname} className="nuvie-page-enter">
      {children}
    </div>
  );
}
