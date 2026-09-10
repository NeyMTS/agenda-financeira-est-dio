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
        const asaasSubscriptionId =
          body.subscription?.id ?? body.payment?.subscription ?? null;
        const asaasCustomerId =
          body.subscription?.customer ?? body.payment?.customer ?? null;

        if (!asaasSubscriptionId && !asaasCustomerId) {
          return new Response("ok");
        }

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

        const query = supabaseAdmin.from("subscriptions").select("*");
        const { data: row, error } = asaasSubscriptionId
          ? await query.eq("asaas_subscription_id", asaasSubscriptionId).maybeSingle()
          : await query.eq("asaas_customer_id", asaasCustomerId!).maybeSingle();

        if (error) {
          console.error("[Asaas webhook] lookup failed", error.message);
          return new Response("Error", { status: 500 });
        }
        if (!row) return new Response("ok");

        type SubUpdate = {
          status?: string;
          subscription_start?: string;
          subscription_end?: string;
          asaas_subscription_id?: string;
        };
        const update: SubUpdate = {};

        switch (event) {
          case "PAYMENT_CONFIRMED":
          case "PAYMENT_RECEIVED":
            update.status = "active";
            update.subscription_start = row.subscription_start ?? new Date().toISOString();
            update.subscription_end = addCycle(
              row.plan === "yearly" ? "YEARLY" : "MONTHLY",
            );
            break;
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
            .eq("id", row.id);
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
