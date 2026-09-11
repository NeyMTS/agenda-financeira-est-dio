import { createServerFn } from "@tanstack/react-start";

const MAX_ATTEMPTS = 5;
const LOCK_MINUTES = 15;

function normalizeEmail(input: unknown): string {
  const email = typeof input === "string" ? input.trim().toLowerCase() : "";
  if (!email || email.length > 320) {
    throw new Error("E-mail inválido.");
  }
  return email;
}

export type LoginLockStatus = {
  locked: boolean;
  minutesLeft: number;
  attemptsLeft: number;
};

function status(row: {
  failed_count: number;
  locked_until: string | null;
} | null): LoginLockStatus {
  const lockedUntil = row?.locked_until ? new Date(row.locked_until) : null;
  const locked = !!lockedUntil && lockedUntil.getTime() > Date.now();

  return {
    locked,
    minutesLeft: locked
      ? Math.max(
          1,
          Math.ceil((lockedUntil!.getTime() - Date.now()) / 60000),
        )
      : 0,
    attemptsLeft: locked
      ? 0
      : Math.max(0, MAX_ATTEMPTS - (row?.failed_count ?? 0)),
  };
}

/** Verifica se o e-mail está temporariamente bloqueado. */
export const checkLoginLock = createServerFn({ method: "POST" })
  .inputValidator((input: { email: string }) => ({
    email: normalizeEmail(input?.email),
  }))
  .handler(async ({ data }): Promise<LoginLockStatus> => {
    const { supabaseAdmin } = await import(
      "@/integrations/supabase/client.server"
    );

    const { data: row } = await supabaseAdmin
      .from("login_attempts")
      .select("failed_count, locked_until")
      .eq("email", data.email)
      .maybeSingle();

    return status(row ?? null);
  });

/** Registra uma tentativa incorreta e bloqueia após 5 falhas seguidas. */
export const registerLoginFailure = createServerFn({ method: "POST" })
  .inputValidator((input: { email: string }) => ({
    email: normalizeEmail(input?.email),
  }))
  .handler(async ({ data }): Promise<LoginLockStatus> => {
    const { supabaseAdmin } = await import(
      "@/integrations/supabase/client.server"
    );

    const { data: row } = await supabaseAdmin
      .from("login_attempts")
      .select("failed_count, locked_until")
      .eq("email", data.email)
      .maybeSingle();

    const current = status(row ?? null);
    if (current.locked) return current;

    const failed = (row?.failed_count ?? 0) + 1;
    const lockedUntil =
      failed >= MAX_ATTEMPTS
        ? new Date(Date.now() + LOCK_MINUTES * 60000).toISOString()
        : null;

    await supabaseAdmin.from("login_attempts").upsert(
      {
        email: data.email,
        failed_count: failed >= MAX_ATTEMPTS ? 0 : failed,
        locked_until: lockedUntil,
        last_failed_at: new Date().toISOString(),
      },
      { onConflict: "email" },
    );

    return status({
      failed_count: failed >= MAX_ATTEMPTS ? 0 : failed,
      locked_until: lockedUntil,
    });
  });

/** Zera o contador após login bem-sucedido. */
export const clearLoginAttempts = createServerFn({ method: "POST" })
  .inputValidator((input: { email: string }) => ({
    email: normalizeEmail(input?.email),
  }))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import(
      "@/integrations/supabase/client.server"
    );

    await supabaseAdmin
      .from("login_attempts")
      .delete()
      .eq("email", data.email);

    return { ok: true };
  });
