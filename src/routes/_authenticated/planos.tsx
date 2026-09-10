import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import {
  ArrowLeft,
  CalendarDays,
  Check,
  Heart,
  LockKeyhole,
  UsersRound,
  WalletCards,
} from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { createAsaasCheckout } from "@/lib/asaas.functions";
import { useSubscription } from "@/hooks/use-subscription";
import { effectiveStatus, trialDaysLeft, type SubscriptionPlan } from "@/lib/subscription";

export const Route = createFileRoute("/_authenticated/planos")({
  component: PlanosPage,
});

const benefits = [
  {
    icon: CalendarDays,
    title: "Agenda completa",
    description: "Organize seus atendimentos e horários.",
  },
  {
    icon: UsersRound,
    title: "Clientes organizadas",
    description: "Tenha seus clientes sempre à mão.",
  },
  {
    icon: WalletCards,
    title: "Financeiro",
    description: "Acompanhe entradas, gastos e recebimentos.",
  },
  {
    icon: Heart,
    title: "Mais tempo para você",
    description: "Menos organização manual, mais foco no seu negócio.",
  },
];

function PlanosPage() {
  const navigate = useNavigate();

  return (
    <AppShell
      title="Planos"
      subtitle="Escolha o ideal para você"
      action={
        <button
          type="button"
          onClick={() => navigate({ to: "/inicio" })}
          className="flex size-10 items-center justify-center rounded-full border border-black/[0.06] bg-white text-[#625d5f] shadow-sm"
          aria-label="Voltar"
        >
          <ArrowLeft className="size-5" strokeWidth={1.7} />
        </button>
      }
    >
      <div className="space-y-5">
        <section className="pt-2 text-center">
          <div className="mx-auto mb-4 inline-flex rounded-full bg-[#f8eef0] px-5 py-2">
            <span className="text-[10px] font-medium tracking-[0.32em] text-[#9d6875]">
              N U V I E
            </span>
          </div>

          <h2 className="text-[30px] font-semibold leading-[1.08] tracking-[-0.03em] text-[#211f20]">
            Mais organização
            <br />
            para o seu sucesso
          </h2>

          <p className="mx-auto mt-3 max-w-[320px] text-sm leading-6 text-[#817b7d]">
            Agenda, clientes e financeiro em um só lugar.
            <br />
            Simples para cuidar do seu negócio.
          </p>
        </section>

        <div className="grid gap-4">
          <PlanCard
            title="Mensal"
            price="29,90"
            period="/mês"
            description="Acesso completo"
            buttonText="Começar agora"
            featured={false}
          />

          <PlanCard
            title="Anual"
            price="299"
            period="/ano"
            description="Tudo incluso"
            featured
            buttonText="Escolher anual"
          />
        </div>

        <section className="rounded-3xl bg-[#faf4f5] px-5 py-4">
          <div className="flex items-center gap-4">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-white text-[#9d6875]">
              <Check className="size-5" strokeWidth={2} />
            </div>

            <div>
              <p className="text-base font-semibold text-[#211f20]">
                14 dias grátis
              </p>

              <p className="mt-0.5 text-xs leading-5 text-[#817b7d]">
                Experimente todos os recursos sem compromisso.
              </p>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-2 gap-3">
          {benefits.map((benefit) => {
            const Icon = benefit.icon;

            return (
              <div
                key={benefit.title}
                className="rounded-3xl bg-white px-4 py-5 text-center shadow-sm ring-1 ring-black/[0.04]"
              >
                <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-[#f8eef0] text-[#9d6875]">
                  <Icon className="size-5" strokeWidth={1.6} />
                </div>

                <p className="mt-3 text-sm font-semibold text-[#211f20]">
                  {benefit.title}
                </p>

                <p className="mt-1 text-[11px] leading-4 text-[#817b7d]">
                  {benefit.description}
                </p>
              </div>
            );
          })}
        </section>

        <div className="flex flex-col items-center gap-2 pb-4 text-center">
          <div className="flex items-center gap-2 text-[#817b7d]">
            <LockKeyhole className="size-4" strokeWidth={1.7} />

            <span className="text-xs">
              Pagamento seguro
            </span>
          </div>

          <p className="text-[11px] text-[#aaa5a6]">
            Cancele quando quiser. Sem burocracia.
          </p>
        </div>
      </div>
    </AppShell>
  );
}

function PlanCard({
  title,
  price,
  period,
  description,
  buttonText,
  featured,
}: {
  title: string;
  price: string;
  period: string;
  description: string;
  buttonText: string;
  featured: boolean;
}) {
  return (
    <section
      className={`relative rounded-3xl p-5 shadow-sm ${
        featured
          ? "border-2 border-[#b7838e] bg-[#fffafb]"
          : "border border-black/[0.06] bg-white"
      }`}
    >
      {featured && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-[#b7838e] px-4 py-1.5">
          <span className="text-[10px] font-semibold uppercase tracking-wide text-white">
            Melhor escolha
          </span>
        </div>
      )}

      <div className="pt-1">
        <h3 className="text-lg font-semibold text-[#211f20]">
          {title}
        </h3>

        <p className="mt-1 text-sm text-[#817b7d]">
          {description}
        </p>

        <div className="mt-5 flex items-baseline">
          <span className="text-sm font-medium text-[#211f20]">
            R$
          </span>

          <span className="ml-1 text-[38px] font-semibold leading-none tracking-[-0.03em] text-[#211f20]">
            {price}
          </span>

          <span className="ml-1 text-sm text-[#817b7d]">
            {period}
          </span>
        </div>

        {featured && (
          <div className="mt-4 rounded-2xl bg-[#f8eef0] px-4 py-3">
            <p className="text-sm font-semibold text-[#9d6875]">
              Economize R$ 60
            </p>

            <p className="mt-0.5 text-xs text-[#817b7d]">
              Equivale a apenas R$ 24,92/mês
            </p>
          </div>
        )}

        <div className="mt-5 space-y-3">
          {[
            "Todos os recursos",
            "Sem fidelidade",
            "Cancele quando quiser",
            "Atualizações incluídas",
          ].map((item) => (
            <div
              key={item}
              className="flex items-center gap-3"
            >
              <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-[#f8eef0] text-[#9d6875]">
                <Check className="size-3.5" strokeWidth={2.5} />
              </span>

              <span className="text-sm text-[#625d5f]">
                {item}
              </span>
            </div>
          ))}
        </div>

        <button
          type="button"
          className={`mt-6 h-12 w-full rounded-2xl text-sm font-semibold transition ${
            featured
              ? "bg-[#b7838e] text-white"
              : "border border-[#b7838e] bg-white text-[#9d6875]"
          }`}
        >
          {buttonText}
        </button>
      </div>
    </section>
  );
      }
