import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { SubscriptionPlan } from "@/lib/subscription";

type CheckoutResult =
  | { configured: false; message: string }
  | { configured: true; checkoutUrl: string };

/**
 * Devolve o link oficial de checkout da Kiwify para o plano escolhido.
 * Os links ficam apenas no ambiente seguro (Secrets) — nada é criado aqui.
 */
export const getKiwifyCheckoutUrl = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { plan: SubscriptionPlan }) => {
    if (input?.plan !== "monthly" && input?.plan !== "yearly") {
      throw new Error("Plano inválido.");
    }
    return { plan: input.plan };
  })
  .handler(async ({ data, context }): Promise<CheckoutResult> => {
    const secretName =
      data.plan === "monthly"
        ? "KIWIFY_MONTHLY_CHECKOUT_URL"
        : "KIWIFY_YEARLY_CHECKOUT_URL";
    const base = process.env[secretName];

    if (!base) {
      return {
        configured: false,
        message:
          "O pagamento ainda não está configurado. Falta cadastrar o link do checkout no ambiente seguro.",
      };
    }

    const { supabase, userId, claims } = context;

    // Registra o plano escolhido; o acesso só é liberado pelo webhook.
    const { error } = await supabase
      .from("subscriptions")
      .update({ plan: data.plan })
      .eq("user_id", userId);
    if (error) throw error;

    let url: URL;
    try {
      url = new URL(base);
    } catch {
      throw new Error("O link do checkout cadastrado é inválido.");
    }

    // Identificação da compradora para o webhook conseguir ligar ao usuário.
    url.searchParams.set("s1", userId);
    // Identifica a oferta comprada no webhook (mesmo produto, dois links).
    url.searchParams.set("s2", data.plan);
    const email = (claims as { email?: string } | null)?.email;
    if (email) url.searchParams.set("email", email);

    return { configured: true, checkoutUrl: url.toString() };
  });
