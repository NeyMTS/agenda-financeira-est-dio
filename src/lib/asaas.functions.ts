import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { PLANS, type SubscriptionPlan } from "@/lib/subscription";

type CheckoutResult =
  | { configured: false; message: string }
  | { configured: true; checkoutUrl: string };

const ASAAS_BASE_URL = "https://api.asaas.com/v3";
const APP_URL = "https://nuvieagenda.lovable.app";

/**
 * Cria um Checkout hospedado pelo Asaas (POST /v3/checkouts).
 * A cliente preenche os próprios dados na página oficial do Asaas.
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

    const { supabase, userId } = context;
    const plan = PLANS[data.plan];

    const nextDueDate = new Date(Date.now() + 86_400_000).toISOString().slice(0, 10);

    const payload = {
      billingTypes: ["CREDIT_CARD"],
      chargeTypes: ["RECURRENT"],
      minutesToExpire: 60,
      externalReference: userId,
      callback: {
        successUrl: `${APP_URL}/planos`,
        cancelUrl: `${APP_URL}/planos`,
        expiredUrl: `${APP_URL}/planos`,
      },
      items: [
        {
          name: plan.description,
          description: plan.description,
          quantity: 1,
          value: plan.value,
        },
      ],
      subscription: {
        cycle: plan.cycle,
        nextDueDate,
      },
    };

    const res = await fetch(`${ASAAS_BASE_URL}/checkouts`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        accept: "application/json",
        // O Asaas exige User-Agent em todas as requisições.
        "User-Agent": "Nuvie/1.0 (https://nuvieagenda.lovable.app)",
        access_token: apiKey,
      },
      body: JSON.stringify(payload),
    });

    const body = (await res.json().catch(() => null)) as Record<string, unknown> | null;

    if (!res.ok) {
      console.error(
        "[Asaas] POST /checkouts falhou",
        res.status,
        JSON.stringify(body),
      );
      const description = (
        body as { errors?: Array<{ description?: string }> } | null
      )?.errors?.[0]?.description;
      throw new Error(description ?? `Asaas retornou o status ${res.status}.`);
    }

    const checkoutId = body?.["id"] ? String(body["id"]) : null;
    const checkoutUrl = typeof body?.["link"] === "string" ? body["link"] : null;

    if (!checkoutId || !checkoutUrl) {
      console.error("[Asaas] resposta sem link de checkout", JSON.stringify(body));
      throw new Error("O Asaas não retornou o link do checkout.");
    }

    const { error: updateError } = await supabase
      .from("subscriptions")
      .update({ plan: data.plan, asaas_checkout_id: checkoutId })
      .eq("user_id", userId);
    if (updateError) throw updateError;

    return { configured: true, checkoutUrl };
  });
