import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const accessPeriodSchema = z.enum([
  "7_days",
  "14_days",
  "30_days",
  "90_days",
  "6_months",
  "1_year",
  "permanent",
  "remove",
]);

export type AdminAccessPeriod = z.infer<typeof accessPeriodSchema>;

async function assertAdmin(
  supabase: {
    from: (table: "user_roles") => {
      select: (columns: "role") => {
        eq: (column: "user_id", value: string) => {
          eq: (column: "role", value: "admin") => {
            maybeSingle: () => PromiseLike<{
              data: { role: "admin" } | null;
              error: { message: string } | null;
            }>;
          };
        };
      };
    };
  },
  userId: string,
) {
  const { data, error } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle();

  if (error || data?.role !== "admin") throw new Error("Acesso não autorizado.");
}

export const checkAdminAccess = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.supabase, context.userId);
    return { isAdmin: true as const };
  });

export type AdminUser = {
  id: string;
  name: string;
  email: string;
  createdAt: string;
  lastAccessAt: string | null;
  plan: string | null;
  status: string;
  expiresAt: string | null;
  isActive: boolean;
  isPro: boolean;
  hasAdminAccess: boolean;
  adminAccessPermanent: boolean;
  adminAccessExpiresAt: string | null;
};

export const listAdminUsers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const [{ data: authData, error: authError }, profilesResult, subscriptionsResult] =
      await Promise.all([
        supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1000 }),
        supabaseAdmin.from("profiles").select("id, display_name, created_at, last_access_at"),
        supabaseAdmin
          .from("subscriptions")
          .select(
            "user_id, plan, status, trial_end, subscription_end, access_expires_at, admin_access_expires_at, admin_access_permanent",
          ),
      ]);

    if (authError) throw new Error("Não foi possível carregar os usuários.");
    if (profilesResult.error) throw new Error("Não foi possível carregar os perfis.");
    if (subscriptionsResult.error) throw new Error("Não foi possível carregar os acessos.");

    const profiles = new Map((profilesResult.data ?? []).map((item) => [item.id, item]));
    const subscriptions = new Map(
      (subscriptionsResult.data ?? []).map((item) => [item.user_id, item]),
    );
    const now = Date.now();

    const users: AdminUser[] = authData.users.map((user) => {
      const profile = profiles.get(user.id);
      const subscription = subscriptions.get(user.id);
      const adminAccessPermanent = subscription?.admin_access_permanent === true;
      const adminAccessExpiresAt = subscription?.admin_access_expires_at ?? null;
      const timedAdminAccess = adminAccessExpiresAt
        ? new Date(adminAccessExpiresAt).getTime() >= now
        : false;
      const hasAdminAccess = adminAccessPermanent || timedAdminAccess;
      const paidExpiresAt =
        subscription?.access_expires_at ?? subscription?.subscription_end ?? null;
      const paidActive =
        subscription?.status === "active" &&
        (!paidExpiresAt || new Date(paidExpiresAt).getTime() >= now);
      const trialActive =
        subscription?.status === "trialing" &&
        Boolean(subscription.trial_end) &&
        new Date(subscription.trial_end).getTime() >= now;
      const isPro = paidActive || hasAdminAccess;
      const isActive = isPro || trialActive;

      return {
        id: user.id,
        name: profile?.display_name?.trim() || "Sem nome",
        email: user.email ?? "Sem e-mail",
        createdAt: profile?.created_at ?? user.created_at,
        lastAccessAt: profile?.last_access_at ?? user.last_sign_in_at ?? null,
        plan: subscription?.plan ?? null,
        status: hasAdminAccess
          ? "Acesso gratuito"
          : paidActive
            ? "PRO ativo"
            : trialActive
              ? "Teste gratuito"
              : "Inativo",
        expiresAt: adminAccessPermanent
          ? null
          : hasAdminAccess
            ? adminAccessExpiresAt
            : paidExpiresAt ?? subscription?.trial_end ?? null,
        isActive,
        isPro,
        hasAdminAccess,
        adminAccessPermanent,
        adminAccessExpiresAt,
      };
    });

    users.sort((a, b) => b.createdAt.localeCompare(a.createdAt));

    return {
      users,
      totals: {
        total: users.length,
        active: users.filter((user) => user.isActive).length,
        inactive: users.filter((user) => !user.isActive).length,
        free: users.filter((user) => !user.isPro).length,
        pro: users.filter((user) => user.isPro).length,
      },
    };
  });

export const manageAdminAccess = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        userId: z.string().uuid(),
        period: accessPeriodSchema,
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    let permanent = false;
    let expiresAt: string | null = null;

    if (data.period === "permanent") {
      permanent = true;
    } else if (data.period !== "remove") {
      const expiry = new Date();
      if (data.period === "6_months") expiry.setUTCMonth(expiry.getUTCMonth() + 6);
      else if (data.period === "1_year") expiry.setUTCFullYear(expiry.getUTCFullYear() + 1);
      else {
        const days = {
          "7_days": 7,
          "14_days": 14,
          "30_days": 30,
          "90_days": 90,
        }[data.period];
        expiry.setUTCDate(expiry.getUTCDate() + days);
      }
      expiresAt = expiry.toISOString();
    }

    const { error } = await supabaseAdmin.from("subscriptions").upsert(
      {
        user_id: data.userId,
        admin_access_expires_at: expiresAt,
        admin_access_permanent: permanent,
      },
      { onConflict: "user_id" },
    );

    if (error) throw new Error("Não foi possível atualizar o acesso gratuito.");

    return { ok: true as const, expiresAt, permanent };
  });