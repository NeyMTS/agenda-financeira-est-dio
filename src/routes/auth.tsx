import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Eye, EyeOff } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BrandMark } from "@/components/BrandMark";
import {
  checkLoginLock,
  clearLoginAttempts,
  registerLoginFailure,
} from "@/lib/login-guard.functions";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Nuvie — Gestão para profissionais da beleza" },
      {
        name: "description",
        content:
          "Gestão de clientes, agenda, serviços e financeiro em um só lugar.",
      },
      {
        property: "og:title",
        content: "Nuvie — Gestão para profissionais da beleza",
      },
      {
        property: "og:description",
        content:
          "Organize sua agenda, clientes, serviços e financeiro em um só lugar.",
      },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();

  const [mode, setMode] = useState<"login" | "signup">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);

    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin,
            data: {
              display_name: name,
            },
          },
        });

        if (error) throw error;

        if (!data.session) {
          toast.success(
            "Cadastro criado. Confira seu email para confirmar a conta."
          );
          setMode("login");
          return;
        }

        await supabase.from("profiles").upsert({
          id: data.session.user.id,
          display_name: name,
        });

        navigate({ to: "/inicio" });
      } else {
        const lock = await checkLoginLock({ data: { email } });

        if (lock.locked) {
          toast.error(
            `Acesso temporariamente bloqueado por muitas tentativas. Tente novamente em ${lock.minutesLeft} minuto(s).`
          );
          return;
        }

        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          const after = await registerLoginFailure({ data: { email } });

          if (after.locked) {
            toast.error(
              `Acesso temporariamente bloqueado por ${after.minutesLeft} minuto(s) após 5 tentativas incorretas.`
            );
          } else {
            toast.error(
              `Email ou senha incorretos. Tentativas restantes: ${after.attemptsLeft}.`
            );
          }

          return;
        }

        await clearLoginAttempts({ data: { email } });

        navigate({ to: "/inicio" });
      }
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Não foi possível continuar."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#faf9f8] px-5 py-10">
      <div className="w-full max-w-sm">
        {/* MARCA */}
        <div className="flex flex-col items-center text-center">
          <BrandMark className="size-16" />

          <h1 className="mt-4 text-[26px] font-semibold tracking-[-0.03em] text-[#211f20]">
            Nuvie
          </h1>

          <p className="mt-2 text-[10px] uppercase tracking-[0.22em] text-[#aaa5a6]">
            Gestão para profissionais da beleza
          </p>
        </div>

        {/* TÍTULO */}
        <div className="mt-10 text-center">
          <h2 className="text-2xl font-semibold tracking-tight text-[#211f20]">
            {mode === "login" ? "Bem-vinda de volta" : "Crie sua conta"}
          </h2>

          <p className="mx-auto mt-2 max-w-xs text-sm leading-6 text-[#817b7d]">
            {mode === "login"
              ? "Acesse sua agenda, clientes e financeiro."
              : "Tenha sua agenda, clientes e financeiro organizados em um só lugar."}
          </p>
        </div>

        {/* FORMULÁRIO */}
        <form
          onSubmit={handleSubmit}
          className="mt-8 rounded-3xl border border-black/[0.05] bg-white p-5 shadow-sm"
        >
          {mode === "signup" && (
            <div className="space-y-2">
              <Label
                htmlFor="name"
                className="text-xs font-medium text-[#625d5f]"
              >
                Seu nome
              </Label>

              <Input
                id="name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Seu nome"
                required
                className="h-11 rounded-xl border-black/[0.08] bg-[#faf9f8] text-sm focus-visible:ring-[var(--nuvie-primary)]"
              />
            </div>
          )}

          <div
            className={
              mode === "signup" ? "mt-4 space-y-2" : "space-y-2"
            }
          >
            <Label
              htmlFor="email"
              className="text-xs font-medium text-[#625d5f]"
            >
              Email
            </Label>

            <Input
              id="email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="voce@email.com"
              required
              className="h-11 rounded-xl border-black/[0.08] bg-[#faf9f8] text-sm focus-visible:ring-[var(--nuvie-primary)]"
            />
          </div>

          <div className="mt-4 space-y-2">
            <Label
              htmlFor="password"
              className="text-xs font-medium text-[#625d5f]"
            >
              Senha
            </Label>

            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                minLength={6}
                required
                placeholder="••••••••"
                className="h-11 rounded-xl border-black/[0.08] bg-[#faf9f8] pr-11 text-sm focus-visible:ring-[var(--nuvie-primary)]"
              />

              <button
                type="button"
                onClick={() => setShowPassword((value) => !value)}
                aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-[#817b7d]"
              >
                {showPassword ? (
                  <EyeOff className="size-4" strokeWidth={1.7} />
                ) : (
                  <Eye className="size-4" strokeWidth={1.7} />
                )}
              </button>
            </div>
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="mt-5 h-11 w-full rounded-xl bg-[var(--nuvie-primary)] text-sm font-semibold text-white hover:bg-[#a97480]"
          >
            {loading
              ? "Aguarde..."
              : mode === "login"
                ? "Entrar"
                : "Criar minha conta"}
          </Button>
        </form>

        {/* ALTERNAR LOGIN/CADASTRO */}
        <button
          type="button"
          onClick={() =>
            setMode(mode === "login" ? "signup" : "login")
          }
          className="mt-5 w-full text-center text-sm text-[#817b7d]"
        >
          {mode === "login" ? (
            <>
              Ainda não possui conta?{" "}
              <span className="font-medium text-[var(--nuvie-primary-strong)]">
                Criar conta
              </span>
            </>
          ) : (
            <>
              Já possui uma conta?{" "}
              <span className="font-medium text-[var(--nuvie-primary-strong)]">
                Entrar
              </span>
            </>
          )}
        </button>

        <p className="mt-8 text-center text-[10px] uppercase tracking-[0.16em] text-[#aaa5a6]">
          Organização para grandes resultados
        </p>
      </div>
    </main>
  );
}
