import { createFileRoute } from "@tanstack/react-router";

type AsaasEvent = {
  event?: string;
  payment?: { subscription?: string; customer?: string; externalReference?: string };
  subscription?: {
    id?: string;
    customer?: string;
    status?: string;
    cycle?: string;
    externalReference?: string;
  };
  checkout?: {
    id?: string;
    customer?: string;
    subscription?: string | { id?: string };
    externalReference?: string;
  };
};

function addDays(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString();
}

function addCycle(cycle: string | null | undefined): string {
  const d = new Date();
  if (cycle === "YEARLY") d.setFullYear(d.getFullYear() + 1);
  else d.setMonth(d.getMonth() + 1);
  return d.toISOString();
}

export const Route = createFileRoute("/api/public/asaas-webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const expected = process.env["ASAAS_WEBHOOK_TOKEN"];
        if (!expected) {
          console.error("[Asaas webhook] ASAAS_WEBHOOK_TOKEN não configurado");
          return new Response("Not configured", { status: 503 });
        }

        const token =
          request.headers.get("asaas-access-token") ??
          request.headers.get("x-webhook-token");

        if (!token || token !== expected) {
          return new Response("Invalid token", { status: 401 });
        }

        let body: AsaasEvent;
        try {
          body = (await request.json()) as AsaasEvent;
        } catch {
          return new Response("Invalid payload", { status: 400 });
        }

        const event = body.event ?? "";
        const checkoutSubscription =
          typeof body.checkout?.subscription === "string"
            ? body.checkout.subscription
            : (body.checkout?.subscription?.id ?? null);
        const asaasSubscriptionId =
          body.subscription?.id ?? body.payment?.subscription ?? checkoutSubscription ?? null;
        const asaasCustomerId =
          body.subscription?.customer ??
          body.payment?.customer ??
          body.checkout?.customer ??
          null;
        const asaasCheckoutId = body.checkout?.id ?? null;
        const externalReference =
          body.checkout?.externalReference ??
          body.subscription?.externalReference ??
          body.payment?.externalReference ??
          null;

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

        // Localiza a assinatura pelo identificador mais confiável disponível.
        const findBy = async (column: string, value: string) =>
          await supabaseAdmin
            .from("subscriptions")
            .select("*")
            .eq(column, value)
            .maybeSingle();

        const candidates: Array<[string, string | null]> = [
          ["user_id", externalReference],
          ["asaas_checkout_id", asaasCheckoutId],
          ["asaas_subscription_id", asaasSubscriptionId],
          ["asaas_customer_id", asaasCustomerId],
        ];

        let row: Record<string, unknown> | null = null;
        for (const [column, value] of candidates) {
          if (!value) continue;
          const { data, error } = await findBy(column, value);
          if (error) {
            console.error("[Asaas webhook] lookup failed", column, error.message);
            return new Response("Error", { status: 500 });
          }
          if (data) {
            row = data as unknown as Record<string, unknown>;
            break;
          }
        }

        if (!row) {
          console.warn("[Asaas webhook] assinatura não encontrada para o evento", event);
          return new Response("ok");
        }

        type SubUpdate = {
          status?: string;
          subscription_start?: string;
          subscription_end?: string;
          access_expires_at?: string;
          asaas_subscription_id?: string;
          asaas_customer_id?: string;
        };
        const update: SubUpdate = {};
        const rowPlan = typeof row["plan"] === "string" ? row["plan"] : null;
        const rowMethod = typeof row["payment_method"] === "string" ? row["payment_method"] : null;
        const rowStart =
          typeof row["subscription_start"] === "string" ? row["subscription_start"] : null;

        const activate = () => {
          const isPix = rowMethod === "pix";
          const end = isPix
            ? addDays(rowPlan === "yearly" ? 365 : 30)
            : addCycle(rowPlan === "yearly" ? "YEARLY" : "MONTHLY");
          update.status = "active";
          // No PIX cada pagamento inicia um novo período de acesso.
          update.subscription_start = isPix
            ? new Date().toISOString()
            : (rowStart ?? new Date().toISOString());
          update.subscription_end = end;
          update.access_expires_at = end;
          if (asaasSubscriptionId) update.asaas_subscription_id = asaasSubscriptionId;
          if (asaasCustomerId) update.asaas_customer_id = asaasCustomerId;
        };

        switch (event) {
          case "PAYMENT_CONFIRMED":
          case "PAYMENT_RECEIVED":
          case "CHECKOUT_PAID":
            activate();
            break;
          case "CHECKOUT_CANCELED":
          case "CHECKOUT_EXPIRED":
            // O checkout não virou pagamento; nada muda no acesso.
            return new Response("ok");
          case "PAYMENT_OVERDUE":
            update.status = "past_due";
            break;
          case "PAYMENT_REFUNDED":
          case "PAYMENT_DELETED":
          case "PAYMENT_CHARGEBACK_REQUESTED":
            update.status = "canceled";
            break;
          case "SUBSCRIPTION_CREATED":
          case "SUBSCRIPTION_UPDATED":
            if (asaasSubscriptionId) update.asaas_subscription_id = asaasSubscriptionId;
            if (body.subscription?.status === "INACTIVE") update.status = "canceled";
            break;
          case "SUBSCRIPTION_DELETED":
          case "SUBSCRIPTION_INACTIVATED":
            update.status = "canceled";
            break;
          default:
            return new Response("ok");
        }

        if (Object.keys(update).length > 0) {
          const { error: updateError } = await supabaseAdmin
            .from("subscriptions")
            .update(update)
            .eq("id", String(row["id"]));
          if (updateError) {
            console.error("[Asaas webhook] update failed", updateError.message);
            return new Response("Error", { status: 500 });
          }
        }

        return new Response("ok");
      },
    },
  },
});
