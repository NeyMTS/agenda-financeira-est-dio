import { createFileRoute } from "@tanstack/react-router";
import { createHmac } from "crypto";

type KiwifyEvent = {
  webhook_event_type?: string;
  order_id?: string;
  order_ref?: string;
  order_status?: string;
  payment_method?: string;
  Product?: { product_id?: string; product_name?: string };
  Subscription?: { plan?: { id?: string } };
  Customer?: { email?: string };
  TrackingParameters?: Record<string, string | null>;
  Commissions?: {
    charge_amount?: string | number;
    product_base_price?: string | number;
  };
  [key: string]: unknown;
};

const APPROVED_EVENTS = new Set(["order_approved", "pix_created"]);

/** Valor pago em centavos, aceitando string/número em centavos ou reais. */
function toCents(value: string | number | null | undefined): number | null {
  if (value === null || value === undefined) return null;
  const raw = typeof value === "number" ? value : Number(String(value).replace(",", "."));
  if (!Number.isFinite(raw) || raw <= 0) return null;
  // Valores com casas decimais chegam em reais; inteiros chegam em centavos.
  return Number.isInteger(raw) ? raw : Math.round(raw * 100);
}

/** Mapeia a oferta comprada: 29,90 → 30 dias | 299,90 → 365 dias. */
function planFromAmount(cents: number | null): "monthly" | "yearly" | null {
  if (cents === null) return null;
  if (cents >= 2900 && cents <= 3100) return "monthly";
  if (cents >= 29000 && cents <= 31000) return "yearly";
  return null;
}

function timingSafeEqualHex(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export const Route = createFileRoute("/api/public/kiwify-webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const token = process.env["KIWIFY_WEBHOOK_TOKEN"];
        const monthlyProduct = process.env["KIWIFY_MONTHLY_PRODUCT_ID"];
        const yearlyProduct = process.env["KIWIFY_YEARLY_PRODUCT_ID"];

        if (!token) {
          console.error("[Kiwify] KIWIFY_WEBHOOK_TOKEN não configurado");
          return new Response("Not configured", { status: 503 });
        }

        const raw = await request.text();
        const url = new URL(request.url);
        const signature =
          url.searchParams.get("signature") ??
          request.headers.get("x-kiwify-signature") ??
          "";

        const expected = createHmac("sha1", token).update(raw).digest("hex");
        if (!signature || !timingSafeEqualHex(signature.toLowerCase(), expected)) {
          return new Response("Invalid signature", { status: 401 });
        }

        let body: KiwifyEvent;
        try {
          body = JSON.parse(raw) as KiwifyEvent;
        } catch {
          return new Response("Invalid payload", { status: 400 });
        }

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

        const event = body.webhook_event_type ?? "";
        const orderStatus = body.order_status ?? "";
        const orderId = body.order_id ?? body.order_ref ?? null;
        const productId = body.Product?.product_id ?? null;
        const paymentMethod = body.payment_method ?? null;
        const tracking = body.TrackingParameters ?? {};
        const trackedUserId =
          typeof tracking["s1"] === "string" && tracking["s1"] ? tracking["s1"] : null;
        const email = body.Customer?.email ?? null;

        const log = async (userId: string | null, handled: boolean, note: string) => {
          await supabaseAdmin.from("kiwify_webhook_events").insert({
            event,
            order_id: orderId,
            product_id: productId,
            order_status: orderStatus,
            payment_method: paymentMethod,
            user_id: userId,
            handled,
            note,
            payload: body as unknown as never,
          });
        };

        const approved =
          APPROVED_EVENTS.has(event) && orderStatus.toLowerCase() === "paid";

        if (!approved) {
          await log(null, false, "Evento sem pagamento aprovado.");
          return new Response("ok");
        }

        let plan: "monthly" | "yearly" | null = null;
        if (productId && monthlyProduct && productId === monthlyProduct) plan = "monthly";
        else if (productId && yearlyProduct && productId === yearlyProduct) plan = "yearly";

        if (!plan) {
          await log(null, false, "Produto desconhecido — acesso não liberado.");
          return new Response("ok");
        }

        // Localiza a assinatura pela usuária identificada no checkout ou pelo e-mail.
        let userId: string | null = trackedUserId;

        if (!userId && email) {
          const { data: users } = await supabaseAdmin.auth.admin.listUsers({
            page: 1,
            perPage: 1000,
          });
          const match = users?.users.find(
            (u) => (u.email ?? "").toLowerCase() === email.toLowerCase(),
          );
          userId = match?.id ?? null;
        }

        if (!userId) {
          await log(null, false, "Compradora não identificada — acesso não liberado.");
          return new Response("ok");
        }

        const { data: row, error: rowError } = await supabaseAdmin
          .from("subscriptions")
          .select("*")
          .eq("user_id", userId)
          .maybeSingle();

        if (rowError) {
          console.error("[Kiwify] lookup failed", rowError.message);
          return new Response("Error", { status: 500 });
        }

        if (!row) {
          await log(userId, false, "Assinatura não encontrada para a usuária.");
          return new Response("ok");
        }

        // Evita liberar duas vezes o mesmo pedido.
        if (orderId && row.kiwify_order_id === orderId) {
          await log(userId, true, "Pedido já processado.");
          return new Response("ok");
        }

        const days = plan === "yearly" ? 365 : 30;
        const now = Date.now();
        const currentEnd = row.access_expires_at
          ? new Date(row.access_expires_at).getTime()
          : row.subscription_end
            ? new Date(row.subscription_end).getTime()
            : 0;
        const base = currentEnd > now ? currentEnd : now;
        const end = new Date(base + days * 86_400_000).toISOString();

        const { error: updateError } = await supabaseAdmin
          .from("subscriptions")
          .update({
            plan,
            status: "active",
            subscription_start: new Date().toISOString(),
            subscription_end: end,
            access_expires_at: end,
            payment_method: paymentMethod,
            kiwify_order_id: orderId,
            kiwify_product_id: productId,
          })
          .eq("id", row.id);

        if (updateError) {
          console.error("[Kiwify] update failed", updateError.message);
          return new Response("Error", { status: 500 });
        }

        await log(userId, true, `Acesso liberado por ${days} dias.`);
        return new Response("ok");
      },
    },
  },
});
