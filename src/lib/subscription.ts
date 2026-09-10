export type SubscriptionStatus =
  | "trialing"
  | "active"
  | "past_due"
  | "canceled"
  | "expired";

export type SubscriptionPlan = "monthly" | "yearly";

export type Subscription = {
  id: string;
  user_id: string;
  plan: string | null;
  status: string;
  trial_start: string;
  trial_end: string;
  subscription_start: string | null;
  subscription_end: string | null;
  asaas_customer_id: string | null;
  asaas_subscription_id: string | null;
  created_at: string;
  updated_at: string;
};

export const PLANS: Record<
  SubscriptionPlan,
  { label: string; value: number; cycle: "MONTHLY" | "YEARLY"; description: string }
> = {
  monthly: {
    label: "Mensal",
    value: 29.9,
    cycle: "MONTHLY",
    description: "Nuvie - Plano Mensal",
  },
  yearly: {
    label: "Anual",
    value: 299,
    cycle: "YEARLY",
    description: "Nuvie - Plano Anual",
  },
};

/** Estado efetivo, considerando as datas (o banco guarda o último estado conhecido). */
export function effectiveStatus(sub: Subscription | null | undefined): SubscriptionStatus {
  if (!sub) return "expired";
  const now = Date.now();

  if (sub.status === "active") {
    if (sub.subscription_end && new Date(sub.subscription_end).getTime() < now) {
      return "past_due";
    }
    return "active";
  }

  if (sub.status === "trialing") {
    return new Date(sub.trial_end).getTime() >= now ? "trialing" : "expired";
  }

  if (
    sub.status === "past_due" ||
    sub.status === "canceled" ||
    sub.status === "expired"
  ) {
    return sub.status;
  }

  return "expired";
}

/** Função central de controle de acesso. */
export function hasAccess(sub: Subscription | null | undefined): boolean {
  const status = effectiveStatus(sub);
  return status === "trialing" || status === "active";
}

export function trialDaysLeft(sub: Subscription | null | undefined): number {
  if (!sub) return 0;
  const diff = new Date(sub.trial_end).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / 86_400_000));
}
