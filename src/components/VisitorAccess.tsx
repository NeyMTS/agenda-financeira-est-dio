import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import { useLocation, useNavigate } from "@tanstack/react-router";
import type { User } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const VISITOR_ACTION_KEY = "nuvie:visitor-pending-action";

type PendingVisitorAction = {
  path: string;
  kind?: string;
  draft?: unknown;
};

type VisitorAccessValue = {
  user: User | null;
  isVisitor: boolean;
  requestAuthentication: (action?: Omit<PendingVisitorAction, "path">) => boolean;
};

const VisitorAccessContext = createContext<VisitorAccessValue | null>(null);

export function VisitorAccessProvider({ user, children }: { user: User | null; children: ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [promptOpen, setPromptOpen] = useState(false);

  const value = useMemo<VisitorAccessValue>(() => ({
    user,
    isVisitor: !user,
    requestAuthentication: (action) => {
      if (user) return false;
      const pending: PendingVisitorAction = {
        path: location.pathname,
        ...action,
      };
      if (typeof window !== "undefined") {
        sessionStorage.setItem(VISITOR_ACTION_KEY, JSON.stringify(pending));
      }
      setPromptOpen(true);
      return true;
    },
  }), [location.pathname, user]);

  function goToAuth(createAccount: boolean) {
    setPromptOpen(false);
    navigate({
      to: "/auth",
      search: createAccount
        ? { criar: true, redirect: location.pathname }
        : { redirect: location.pathname },
    });
  }

  return (
    <VisitorAccessContext.Provider value={value}>
      {children}
      <Dialog open={promptOpen} onOpenChange={setPromptOpen}>
        <DialogContent className="max-w-xs rounded-2xl">
          <DialogHeader>
            <DialogTitle>Continue no Nuvie</DialogTitle>
            <DialogDescription>
              Crie sua conta grátis para salvar suas informações.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => goToAuth(false)}>Entrar</Button>
            <Button onClick={() => goToAuth(true)}>Criar conta</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </VisitorAccessContext.Provider>
  );
}

export function useVisitorAccess() {
  const context = useContext(VisitorAccessContext);
  if (!context) throw new Error("VisitorAccessProvider não encontrado.");
  return context;
}

export function takePendingVisitorAction<T = unknown>(kind: string): T | null {
  if (typeof window === "undefined") return null;
  const raw = sessionStorage.getItem(VISITOR_ACTION_KEY);
  if (!raw) return null;
  try {
    const pending = JSON.parse(raw) as PendingVisitorAction;
    if (pending.kind !== kind) return null;
    sessionStorage.removeItem(VISITOR_ACTION_KEY);
    return (pending.draft as T) ?? null;
  } catch {
    sessionStorage.removeItem(VISITOR_ACTION_KEY);
    return null;
  }
}