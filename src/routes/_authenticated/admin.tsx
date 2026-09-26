import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { ArrowLeft, CheckCircle2, Clock3, ShieldCheck, UserRoundCheck, UsersRound } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  checkAdminAccess,
  listAdminUsers,
  manageAdminAccess,
  type AdminAccessPeriod,
  type AdminUser,
} from "@/lib/admin.functions";

export const Route = createFileRoute("/_authenticated/admin")({
  beforeLoad: async () => {
    try {
      await checkAdminAccess();
    } catch {
      throw redirect({ to: "/inicio" });
    }
  },
  head: () => ({
    meta: [
      { title: "Administração — Nuvie" },
      { name: "description", content: "Painel administrativo seguro do Nuvie." },
      { property: "og:title", content: "Administração — Nuvie" },
      { property: "og:description", content: "Painel administrativo seguro do Nuvie." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AdminPage,
});

const accessOptions: Array<{ value: AdminAccessPeriod; label: string }> = [
  { value: "7_days", label: "7 dias" },
  { value: "14_days", label: "14 dias" },
  { value: "30_days", label: "30 dias" },
  { value: "90_days", label: "90 dias" },
  { value: "6_months", label: "6 meses" },
  { value: "1_year", label: "1 ano" },
  { value: "permanent", label: "Permanente" },
  { value: "remove", label: "Remover acesso gratuito" },
];

function formatDate(value: string | null, withTime = false) {
  if (!value) return "—";
  return new Date(value).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    ...(withTime ? { hour: "2-digit", minute: "2-digit" } : {}),
  });
}

function AdminPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const listUsers = useServerFn(listAdminUsers);
  const manageAccess = useServerFn(manageAdminAccess);
  const [periods, setPeriods] = useState<Record<string, AdminAccessPeriod>>({});

  const usersQuery = useQuery({
    queryKey: ["admin-users"],
    queryFn: () => listUsers(),
    staleTime: 30_000,
  });

  const mutation = useMutation({
    mutationFn: ({ userId, period }: { userId: string; period: AdminAccessPeriod }) =>
      manageAccess({ data: { userId, period } }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      toast.success("Acesso atualizado.");
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "Não foi possível atualizar."),
  });

  const data = usersQuery.data;

  return (
    <AppShell
      title="Administração"
      subtitle="Usuários e acessos"
      action={
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={() => navigate({ to: "/inicio" })}
          className="size-10 rounded-full bg-white text-[#625d5f]"
          aria-label="Voltar"
        >
          <ArrowLeft className="size-5" strokeWidth={1.7} />
        </Button>
      }
    >
      <section className="grid grid-cols-2 gap-3">
        <SummaryCard icon={UsersRound} label="Usuários" value={data?.totals.total ?? 0} />
        <SummaryCard icon={UserRoundCheck} label="Ativos" value={data?.totals.active ?? 0} />
        <SummaryCard icon={Clock3} label="Inativos" value={data?.totals.inactive ?? 0} />
        <SummaryCard icon={ShieldCheck} label="PRO" value={data?.totals.pro ?? 0} detail={`${data?.totals.free ?? 0} grátis`} />
      </section>

      <section className="mt-7">
        <div className="mb-3">
          <h2 className="text-sm font-semibold text-[#211f20]">Usuários cadastrados</h2>
          <p className="mt-1 text-xs text-[#817b7d]">Acesso, plano e atividade recente</p>
        </div>

        {usersQuery.isLoading ? (
          <div className="rounded-2xl bg-white px-4 py-8 text-center text-sm text-[#817b7d]">Carregando...</div>
        ) : usersQuery.isError ? (
          <div className="rounded-2xl bg-white px-4 py-8 text-center text-sm text-[#817b7d]">Não foi possível carregar os usuários.</div>
        ) : (
          <div className="space-y-3">
            {(data?.users ?? []).map((user) => (
              <UserCard
                key={user.id}
                user={user}
                period={periods[user.id] ?? "30_days"}
                setPeriod={(period) => setPeriods((current) => ({ ...current, [user.id]: period }))}
                saving={mutation.isPending && mutation.variables?.userId === user.id}
                save={() => mutation.mutate({ userId: user.id, period: periods[user.id] ?? "30_days" })}
              />
            ))}
          </div>
        )}
      </section>
    </AppShell>
  );
}

function SummaryCard({ icon: Icon, label, value, detail }: { icon: typeof UsersRound; label: string; value: number; detail?: string }) {
  return (
    <div className="rounded-2xl border border-black/[0.05] bg-white p-4 shadow-sm">
      <Icon className="size-4 text-[var(--nuvie-primary-strong)]" strokeWidth={1.7} />
      <p className="mt-3 text-xl font-semibold text-[#211f20]">{value}</p>
      <p className="mt-1 text-[10px] text-[#817b7d]">{label}{detail ? ` • ${detail}` : ""}</p>
    </div>
  );
}

function UserCard({ user, period, setPeriod, saving, save }: { user: AdminUser; period: AdminAccessPeriod; setPeriod: (period: AdminAccessPeriod) => void; saving: boolean; save: () => void }) {
  const planLabel = user.hasAdminAccess
    ? "Gratuito administrativo"
    : user.plan === "yearly"
      ? "Anual"
      : user.plan === "monthly"
        ? "Mensal"
        : user.isPro
          ? "PRO"
          : "Grátis";

  return (
    <article className="rounded-2xl border border-black/[0.05] bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate text-sm font-semibold text-[#211f20]">{user.name}</h3>
          <p className="mt-1 truncate text-xs text-[#817b7d]">{user.email}</p>
        </div>
        <span className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-medium ${user.isActive ? "bg-[var(--nuvie-primary-soft)] text-[var(--nuvie-primary-strong)]" : "bg-[#f3f1f1] text-[#817b7d]"}`}>
          {user.status}
        </span>
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-x-3 gap-y-3 text-xs">
        <Info label="Cadastro" value={formatDate(user.createdAt)} />
        <Info label="Plano" value={planLabel} />
        <Info label="Vencimento" value={user.adminAccessPermanent ? "Permanente" : formatDate(user.expiresAt)} />
        <Info label="Último acesso" value={formatDate(user.lastAccessAt, true)} />
      </dl>

      <div className="mt-4 border-t border-black/[0.05] pt-4">
        <p className="mb-2 text-xs font-semibold text-[#211f20]">Gerenciar acesso</p>
        <div className="flex items-center gap-2">
          <Select value={period} onValueChange={(value) => setPeriod(value as AdminAccessPeriod)}>
            <SelectTrigger className="h-10 min-w-0 flex-1 rounded-xl bg-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {accessOptions.map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button type="button" onClick={save} disabled={saving} className="h-10 rounded-xl bg-[var(--nuvie-primary)] px-4 text-white hover:bg-[var(--nuvie-primary-strong)]">
            <CheckCircle2 className="size-4" />
            {saving ? "Salvando" : "Aplicar"}
          </Button>
        </div>
      </div>
    </article>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return <div><dt className="text-[10px] text-[#aaa5a6]">{label}</dt><dd className="mt-0.5 break-words font-medium text-[#625d5f]">{value}</dd></div>;
}