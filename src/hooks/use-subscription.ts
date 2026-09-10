import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Subscription } from "@/lib/subscription";

/**
 * Carrega (e cria, se necessário) a assinatura da usuária autenticada.
 * O trial de 14 dias fica no banco, ligado ao user_id — nunca ao dispositivo.
 */
export function useSubscription() {
  return useQuery({
    queryKey: ["subscription", "current-user"],
    staleTime: 30_000,
    queryFn: async (): Promise<Subscription | null> => {
      const { data, error } = await supabase.rpc("ensure_subscription");
      if (error) throw error;
      return (data as unknown as Subscription) ?? null;
    },
  });
}
