import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { PLANS, type SubscriptionPlan } from "@/lib/subscription";

type CheckoutResult =
  | { configured: false; message: string }
  | { configured: true; checkoutUrl: string };

const ASAAS_BASE_URL = "https://api.asaas.com/v3";

/**
 * Cria (ou reaproveita) o cliente e a assinatura no Asaas.
 * A API Key nunca sai do servidor.
 */
export const createAsaasCheckout = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { plan: SubscriptionPlan }) => {
    if (input?.plan !== "monthly" && input?.plan !== "yearly") {
      throw new Error("Plano inválido.");
    }
    return { plan: input.plan };
  })
  .handler(async ({ data, context }): Promise<CheckoutResult> => {
    const apiKey = process.env["ASAAS_API_KEY"];
    if (!apiKey) {
      return {
        configured: false,
        message:
          "O pagamento ainda não está configurado. Falta cadastrar a credencial do Asaas no ambiente seguro.",
      };
    }

    const { supabase, userId, claims } = context;
    const plan = PLANS[data.plan];

    const { data: sub, error: subError } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();
    if (subError) throw subError;

    const asaas = async (path: string, init?: RequestInit) => {
      const res = await fetch(`${ASAAS_BASE_URL}${path}`, {
        ...init,
        headers: {
          "content-type": "application/json",
          access_token: apiKey,
          ...(init?.headers ?? {}),
        },
      });
      const body = await res.json().catch(() => null);
      if (!res.ok) {
        console.error("[Asaas] request failed", path, res.status, body);
        throw new Error("Não foi possível iniciar o pagamento agora.");
      }
      return body as Record<string, unknown>;
    };

    let customerId = sub?.asaas_customer_id ?? null;

    if (!customerId) {
      const email = typeof claims?.email === "string" ? claims.email : undefined;
      const created = await asaas("/customers", {
        method: "POST",
        body: JSON.stringify({
          name: email ?? "Assinante Nuvie",
          email,
          externalReference: userId,
        }),
      });
      customerId = String(created["id"]);
    }

    const nextDueDate = new Date().toISOString().slice(0, 10);

    const subscription = await asaas("/subscriptions", {
      method: "POST",
      body: JSON.stringify({
        customer: customerId,
        billingType: "UNDEFINED",
        value: plan.value,
        nextDueDate,
        cycle: plan.cycle,
        description: plan.description,
        externalReference: userId,
      }),
    });

    const subscriptionId = String(subscription["id"]);

    const { error: updateError } = await supabase
      .from("subscriptions")
      .update({
        plan: data.plan,
        asaas_customer_id: customerId,
        asaas_subscription_id: subscriptionId,
      })
      .eq("user_id", userId);
    if (updateError) throw updateError;

    // Primeira cobrança gerada pela assinatura -> link de pagamento.
    const payments = await asaas(`/subscriptions/${subscriptionId}/payments`);
    const first = (payments["data"] as Array<Record<string, unknown>> | undefined)?.[0];
    const checkoutUrl =
      (first?.["invoiceUrl"] as string | undefined) ??
      (first?.["bankSlipUrl"] as string | undefined);

    if (!checkoutUrl) {
      throw new Error("Não foi possível gerar o link de pagamento.");
    }

    return { configured: true, checkoutUrl };
  });
