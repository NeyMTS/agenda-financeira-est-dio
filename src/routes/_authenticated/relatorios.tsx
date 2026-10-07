import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowDownCircle,
  ArrowUpCircle,
  BarChart3,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  CircleDollarSign,
  Scissors,
  TrendingDown,
  TrendingUp,
  Users,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useMemo, useState } from "react";

import { AppShell } from "@/components/AppShell";
import { useHousehold } from "@/hooks/use-household";
import { useMoneyHidden, MONEY_MASK } from "@/lib/money-privacy";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute(
  "/_authenticated/relatorios"
)({
  component: RelatoriosPage,
});

type Transaction = {
  id: string;
  description: string;
  amount: number;
  type: "income" | "expense";
  date: string;
  status: string | null;
  category: string | null;
};

type Appointment = {
  id: string;
  client_id: string | null;
  service_id: string | null;
  total_amount: number | null;
  scheduled_date: string;
  status: string | null;
  studio_clients:
    | {
        name: string;
      }
    | null;
};

type Tab =
  | "overview"
  | "finance"
  | "appointments"
  | "services";

type MonthData = {
  key: string;
  label: string;
  shortLabel: string;
  revenue: number;
  expenses: number;
  balance: number;
  appointments: number;
};

type ServiceData = {
  name: string;
  count: number;
  revenue: number;
};

function formatCurrency(
  value: number,
  hidden: boolean
) {
  if (hidden) {
    return MONEY_MASK;
  }

  return value.toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function getMonthKey(date: Date) {
  return `${date.getFullYear()}-${String(
    date.getMonth() + 1
  ).padStart(2, "0")}`;
}

function getMonthLabel(date: Date) {
  return date.toLocaleDateString("pt-BR", {
    month: "long",
    year: "numeric",
  });
}

function getShortMonthLabel(date: Date) {
  return date.toLocaleDateString("pt-BR", {
    month: "short",
  }).replace(".", "");
}

function getMonthStart(date: Date) {
  return new Date(
    date.getFullYear(),
    date.getMonth(),
    1
  );
}

function getMonthEnd(date: Date) {
  return new Date(
    date.getFullYear(),
    date.getMonth() + 1,
    0
  );
}

function getMonthDifference(
  current: number,
  previous: number
) {
  if (previous === 0) {
    return 0;
  }

  return (
    ((current - previous) /
      Math.abs(previous)) *
    100
  );
}

function MetricCard({
  label,
  value,
  icon,
  variation,
  variationLabel,
  positiveWhenUp = true,
  hidden,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  variation?: number;
  variationLabel?: string;
  positiveWhenUp?: boolean;
  hidden?: boolean;
}) {
  const hasVariation =
    variation !== undefined &&
    Number.isFinite(variation) &&
    variation !== 0;

  const isPositive =
    positiveWhenUp
      ? variation! > 0
      : variation! < 0;

  return (
    <div className="rounded-2xl border border-black/[0.05] bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs text-[#817b7d]">
            {label}
          </p>

          <p className="mt-1 truncate text-lg font-semibold text-[#211f20]">
            {hidden ? MONEY_MASK : value}
          </p>
        </div>

        <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-[var(--nuvie-primary-soft)] text-[var(--nuvie-primary-strong)]">
          {icon}
        </div>
      </div>

      {hasVariation && !hidden ? (
        <div
          className={`mt-3 flex items-center gap-1 text-[11px] font-medium ${
            isPositive
              ? "text-emerald-600"
              : "text-rose-600"
          }`}
        >
          {isPositive ? (
            <TrendingUp className="size-3.5" />
          ) : (
            <TrendingDown className="size-3.5" />
          )}

          <span>
            {Math.abs(variation!).toFixed(1)}%
          </span>

          <span className="font-normal text-[#9a9395]">
            {variationLabel ??
              "vs. mês anterior"}
          </span>
        </div>
      ) : null}
    </div>
  );
}

function EmptyChart({
  title,
  text,
}: {
  title: string;
  text: string;
}) {
  return (
    <div className="flex min-h-48 flex-col items-center justify-center rounded-2xl border border-dashed border-black/[0.08] bg-[#fcfafb] px-6 text-center">
      <BarChart3 className="size-8 text-[#c2b5b9]" />

      <p className="mt-3 text-sm font-semibold text-[#4b4547]">
        {title}
      </p>

      <p className="mt-1 max-w-xs text-xs leading-5 text-[#91898b]">
        {text}
      </p>
    </div>
  );
}

function RelatoriosPage() {
  const { data: household } =
    useHousehold();

  const moneyHidden = useMoneyHidden();

  const [selectedMonth, setSelectedMonth] =
    useState(() =>
      getMonthStart(new Date())
    );

  const [activeTab, setActiveTab] =
    useState<Tab>("overview");

  const selectedMonthStart =
    getMonthStart(selectedMonth);

  const selectedMonthEnd =
    getMonthEnd(selectedMonth);

  const periodStart = new Date(
    selectedMonth.getFullYear(),
    selectedMonth.getMonth() - 11,
    1
  );

  const periodStartString =
    periodStart.toISOString().slice(0, 10);

  const periodEndString =
    selectedMonthEnd
      .toISOString()
      .slice(0, 10);

  const {
    data: transactions = [],
    isLoading: transactionsLoading,
  } = useQuery({
    queryKey: [
      "relatorios-transactions",
      household?.id,
      periodStartString,
      periodEndString,
    ],
    enabled: Boolean(household?.id),
    queryFn: async () => {
      const { data, error } =
        await supabase
          .from("transactions")
          .select(
            "id, description, amount, type, date, status, category"
          )
          .eq(
            "household_id",
            household!.id
          )
          .gte(
            "date",
            periodStartString
          )
          .lte(
            "date",
            periodEndString
          )
          .order("date", {
            ascending: true,
          });

      if (error) {
        throw error;
      }

      return (data ??
        []) as Transaction[];
    },
  });

  const {
    data: appointments = [],
    isLoading: appointmentsLoading,
  } = useQuery({
    queryKey: [
      "relatorios-appointments",
      household?.id,
      periodStartString,
      periodEndString,
    ],
    enabled: Boolean(household?.id),
    queryFn: async () => {
      const { data, error } =
        await supabase
          .from("studio_appointments")
          .select(
            `
              id,
              client_id,
              service_id,
              total_amount,
              scheduled_date,
              status,
              studio_clients (
                name
              )
            `
          )
          .eq(
            "household_id",
            household!.id
          )
          .gte(
            "scheduled_date",
            periodStartString
          )
          .lte(
            "scheduled_date",
            periodEndString
          )
          .order("scheduled_date", {
            ascending: true,
          });

      if (error) {
        throw error;
      }

      return (data ??
        []) as Appointment[];
    },
  });

  const isLoading =
    transactionsLoading ||
    appointmentsLoading;

  const monthlyData = useMemo(() => {
    const result: MonthData[] = [];

    for (let i = 11; i >= 0; i--) {
      const date = new Date(
        selectedMonth.getFullYear(),
        selectedMonth.getMonth() - i,
        1
      );

      const key = getMonthKey(date);

      const monthTransactions =
        transactions.filter(
          (item) =>
            item.date.slice(0, 7) === key
        );

      const monthAppointments =
        appointments.filter(
          (item) =>
            item.scheduled_date.slice(
              0,
              7
            ) === key &&
            item.status !== "cancelled"
        );

      const revenue =
        monthTransactions
          .filter(
            (item) =>
              item.type === "income" &&
              item.status !== "pending"
          )
          .reduce(
            (sum, item) =>
              sum + Number(item.amount),
            0
          );

      const expenses =
        monthTransactions
          .filter(
            (item) =>
              item.type === "expense" &&
              item.status !== "pending"
          )
          .reduce(
            (sum, item) =>
              sum + Number(item.amount),
            0
          );

      const appointmentRevenue =
        monthAppointments.reduce(
          (sum, item) =>
            sum +
            Number(
              item.total_amount ?? 0
            ),
          0
        );

      result.push({
        key,
        label: getMonthLabel(date),
        shortLabel:
          getShortMonthLabel(date),
        revenue:
          revenue || appointmentRevenue,
        expenses,
        balance:
          (revenue ||
            appointmentRevenue) -
          expenses,
        appointments:
          monthAppointments.length,
      });
    }

    return result;
  }, [
    appointments,
    selectedMonth,
    transactions,
  ]);

  const currentData =
    monthlyData[
      monthlyData.length - 1
    ] ?? {
      revenue: 0,
      expenses: 0,
      balance: 0,
      appointments: 0,
    };

  const previousData =
    monthlyData[
      monthlyData.length - 2
    ] ?? {
      revenue: 0,
      expenses: 0,
      balance: 0,
      appointments: 0,
    };

  const revenueGrowth =
    getMonthDifference(
      currentData.revenue,
      previousData.revenue
    );

  const expenseGrowth =
    getMonthDifference(
      currentData.expenses,
      previousData.expenses
    );

  const balanceGrowth =
    previousData.balance !== 0
      ? getMonthDifference(
          currentData.balance,
          previousData.balance
        )
      : 0;

  const appointmentGrowth =
    getMonthDifference(
      currentData.appointments,
      previousData.appointments
    );

  const serviceData =
    useMemo<ServiceData[]>(() => {
      const map = new Map<
        string,
        ServiceData
      >();

      appointments.forEach(
        (appointment) => {
          if (
            appointment.status ===
            "cancelled"
          ) {
            return;
          }

          const serviceName =
            appointment.service_id
              ? `Serviço ${appointment.service_id.slice(
                  0,
                  6
                )}`
              : "Serviço";

          const current =
            map.get(serviceName) ?? {
              name: serviceName,
              count: 0,
              revenue: 0,
            };

          current.count += 1;

          current.revenue += Number(
            appointment.total_amount ?? 0
          );

          map.set(
            serviceName,
            current
          );
        }
      );

      return Array.from(
        map.values()
      )
        .sort(
          (a, b) =>
            b.revenue - a.revenue
        )
        .slice(0, 6);
    }, [appointments]);

  const selectedMonthTransactions =
    useMemo(() => {
      const key = getMonthKey(
        selectedMonth
      );

      return transactions.filter(
        (item) =>
          item.date.slice(0, 7) === key
      );
    }, [
      selectedMonth,
      transactions,
    ]);

  const categoryData = useMemo(() => {
    const map = new Map<
      string,
      number
    >();

    selectedMonthTransactions
      .filter(
        (item) =>
          item.type === "expense" &&
          item.status !== "pending"
      )
      .forEach((item) => {
        const category =
          item.category?.trim() ||
          "Outros";

        map.set(
          category,
          (map.get(category) ?? 0) +
            Number(item.amount)
        );
      });

    return Array.from(
      map.entries()
    )
      .map(
        ([name, value]) => ({
          name,
          value,
        })
      )
      .sort(
        (a, b) =>
          b.value - a.value
      )
      .slice(0, 6);
  }, [
    selectedMonthTransactions,
  ]);

  const averageTicket =
    currentData.appointments > 0
      ? currentData.revenue /
        currentData.appointments
      : 0;

  function previousMonth() {
    setSelectedMonth(
      new Date(
        selectedMonth.getFullYear(),
        selectedMonth.getMonth() - 1,
        1
      )
    );
  }

  function nextMonth() {
    setSelectedMonth(
      new Date(
        selectedMonth.getFullYear(),
        selectedMonth.getMonth() + 1,
        1
      )
    );
  }

  const tabs = [
    {
      id: "overview" as Tab,
      label: "Visão geral",
    },
    {
      id: "finance" as Tab,
      label: "Financeiro",
    },
    {
      id: "appointments" as Tab,
      label: "Atendimentos",
    },
    {
      id: "services" as Tab,
      label: "Serviços",
    },
  ];

  return (
    <AppShell
      title="Relatórios"
      subtitle="Veja o desempenho do seu negócio"
    >
      <div className="mt-4">
        <div className="rounded-2xl border border-black/[0.05] bg-white p-1 shadow-sm">
          <div className="grid grid-cols-2 gap-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() =>
                  setActiveTab(tab.id)
                }
                className={`rounded-xl px-2 py-2.5 text-xs font-medium transition ${
                  activeTab === tab.id
                    ? "bg-[var(--nuvie-primary)] text-white"
                    : "text-[#817b7d]"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between rounded-2xl border border-black/[0.05] bg-white px-3 py-2 shadow-sm">
          <button
            type="button"
            onClick={previousMonth}
            className="flex size-9 items-center justify-center rounded-full text-[#817b7d]"
            aria-label="Mês anterior"
          >
            <ChevronLeft className="size-5" />
          </button>

          <div className="flex items-center gap-2">
            <CalendarDays className="size-4 text-[var(--nuvie-primary-strong)]" />

            <p className="text-sm font-semibold capitalize text-[#211f20]">
              {getMonthLabel(
                selectedMonth
              )}
            </p>
          </div>

          <button
            type="button"
            onClick={nextMonth}
            className="flex size-9 items-center justify-center rounded-full text-[#817b7d]"
            aria-label="Próximo mês"
          >
            <ChevronRight className="size-5" />
          </button>
        </div>

        {isLoading ? (
          <div className="mt-4 rounded-2xl border border-black/[0.05] bg-white px-4 py-10 text-center text-sm text-[#817b7d]">
            Carregando relatórios...
          </div>
        ) : (
          <>
            {activeTab ===
              "overview" && (
              <div className="mt-4 space-y-4">
                <div className="grid grid-cols-2 gap-2">
                  <MetricCard
                    label="Faturamento"
                    value={`R$ ${formatCurrency(
                      currentData.revenue,
                      moneyHidden
                    )}`}
                    variation={
                      revenueGrowth
                    }
                    icon={
                      <ArrowUpCircle className="size-5" />
                    }
                    hidden={
                      moneyHidden
                    }
                  />

                  <MetricCard
                    label="Despesas"
                    value={`R$ ${formatCurrency(
                      currentData.expenses,
                      moneyHidden
                    )}`}
                    variation={
                      expenseGrowth
                    }
                    positiveWhenUp={
                      false
                    }
                    icon={
                      <ArrowDownCircle className="size-5" />
                    }
                    hidden={
                      moneyHidden
                    }
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <MetricCard
                    label="Resultado"
                    value={`R$ ${formatCurrency(
                      currentData.balance,
                      moneyHidden
                    )}`}
                    variation={
                      balanceGrowth
                    }
                    icon={
                      <CircleDollarSign className="size-5" />
                    }
                    hidden={
                      moneyHidden
                    }
                  />

                  <MetricCard
                    label="Atendimentos"
                    value={String(
                      currentData.appointments
                    )}
                    variation={
                      appointmentGrowth
                    }
                    icon={
                      <Users className="size-5" />
                    }
                  />
                </div>

                <section>
                  <div className="mb-2 flex items-center justify-between">
                    <div>
                      <h2 className="text-sm font-semibold text-[#211f20]">
                        Evolução dos últimos 12 meses
                      </h2>

                      <p className="mt-1 text-xs text-[#91898b]">
                        Faturamento e despesas
                      </p>
                    </div>
                  </div>

                  {monthlyData.some(
                    (item) =>
                      item.revenue >
                        0 ||
                      item.expenses >
                        0
                  ) ? (
                    <div className="rounded-2xl border border-black/[0.05] bg-white p-3 shadow-sm">
                      <div className="h-56 w-full">
                        <ResponsiveContainer
                          width="100%"
                          height="100%"
                        >
                          <BarChart
                            data={
                              monthlyData
                            }
                            margin={{
                              top: 10,
                              right: 0,
                              left: -20,
                              bottom: 0,
                            }}
                          >
                            <CartesianGrid
                              vertical={false}
                              strokeDasharray="3 3"
                              stroke="#eee8ea"
                            />

                            <XAxis
                              dataKey="shortLabel"
                              tick={{
                                fontSize: 10,
                                fill: "#91898b",
                              }}
                              axisLine={false}
                              tickLine={false}
                            />

                            <YAxis
                              tick={{
                                fontSize: 9,
                                fill: "#91898b",
                              }}
                              axisLine={false}
                              tickLine={false}
                            />

                            <Tooltip
                              formatter={(
                                value
                              ) =>
                                `R$ ${Number(
                                  value
                                ).toLocaleString(
                                  "pt-BR",
                                  {
                                    minimumFractionDigits: 2,
                                  }
                                )}`
                              }
                              contentStyle={{
                                borderRadius: 12,
                                border:
                                  "1px solid #eee8ea",
                                fontSize: 11,
                              }}
                            />

                            <Bar
                              dataKey="revenue"
                              name="Faturamento"
                              fill="#b985a1"
                              radius={[
                                5,
                                5,
                                0,
                                0,
                              ]}
                              maxBarSize={18}
                            />

                            <Bar
                              dataKey="expenses"
                              name="Despesas"
                              fill="#d9ced1"
                              radius={[
                                5,
                                5,
                                0,
                                0,
                              ]}
                              maxBarSize={18}
                            />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  ) : (
                    <EmptyChart
                      title="Ainda não há dados suficientes"
                      text="Conforme você registrar movimentações e atendimentos, o gráfico será preenchido automaticamente."
                    />
                  )}
                </section>

                <section className="rounded-2xl border border-black/[0.05] bg-white p-4 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="flex size-10 items-center justify-center rounded-xl bg-[var(--nuvie-primary-soft)] text-[var(--nuvie-primary-strong)]">
                      <Scissors className="size-5" />
                    </div>

                    <div>
                      <p className="text-sm font-semibold text-[#211f20]">
                        Ticket médio
                      </p>

                      <p className="mt-1 text-xs text-[#91898b]">
                        Valor médio por atendimento
                      </p>
                    </div>
                  </div>

                  <p className="mt-4 text-2xl font-semibold text-[#211f20]">
                    {moneyHidden
                      ? MONEY_MASK
                      : `R$ ${formatCurrency(
                          averageTicket,
                          false
                        )}`}
                  </p>
                </section>
              </div>
            )}

            {activeTab ===
              "finance" && (
              <div className="mt-4 space-y-4">
                <div className="grid grid-cols-2 gap-2">
                  <MetricCard
                    label="Entradas"
                    value={`R$ ${formatCurrency(
                      currentData.revenue,
                      moneyHidden
                    )}`}
                    icon={
                      <ArrowUpCircle className="size-5" />
                    }
                    hidden={
                      moneyHidden
                    }
                  />

                  <MetricCard
                    label="Saídas"
                    value={`R$ ${formatCurrency(
                      currentData.expenses,
                      moneyHidden
                    )}`}
                    icon={
                      <ArrowDownCircle className="size-5" />
                    }
                    hidden={
                      moneyHidden
                    }
                  />
                </div>

                <div className="rounded-2xl border border-black/[0.05] bg-white p-4 shadow-sm">
                  <p className="text-xs text-[#817b7d]">
                    Resultado do mês
                  </p>

                  <p className="mt-1 text-2xl font-semibold text-[#211f20]">
                    {moneyHidden
                      ? MONEY_MASK
                      : `R$ ${formatCurrency(
                          currentData.balance,
                          false
                        )}`}
                  </p>

                  <div className="mt-4 h-2 overflow-hidden rounded-full bg-[#f0ebec]">
                    <div
                      className="h-full rounded-full bg-[var(--nuvie-primary)]"
                      style={{
                        width:
                          currentData.revenue >
                          0
                            ? `${Math.min(
                                100,
                                Math.max(
                                  0,
                                  (currentData.balance /
                                    currentData.revenue) *
                                    100
                                )
                              )}%`
                            : "0%",
                      }}
                    />
                  </div>
                </div>

                <section>
                  <h2 className="mb-2 text-sm font-semibold text-[#211f20]">
                    Distribuição dos gastos
                  </h2>

                  {categoryData.length >
                  0 ? (
                    <div className="rounded-2xl border border-black/[0.05] bg-white p-4 shadow-sm">
                      <div className="h-56">
                        <ResponsiveContainer
                          width="100%"
                          height="100%"
                        >
                          <PieChart>
                            <Pie
                              data={
                                categoryData
                              }
                              dataKey="value"
                              nameKey="name"
                              innerRadius={50}
                              outerRadius={78}
                              paddingAngle={3}
                            >
                              {categoryData.map(
                                (
                                  _entry,
                                  index
                                ) => (
                                  <Cell
                                    key={`cell-${index}`}
                                    fill={
                                      [
                                        "#b985a1",
                                        "#c99cad",
                                        "#d7b5c1",
                                        "#e1cbd2",
                                        "#eadde1",
                                        "#f0e7e9",
                                      ][
                                        index %
                                          6
                                      ]
                                    }
                                  />
                                )
                              )}
                            </Pie>

                            <Tooltip
                              formatter={(
                                value
                              ) =>
                                `R$ ${Number(
                                  value
                                ).toLocaleString(
                                  "pt-BR",
                                  {
                                    minimumFractionDigits: 2,
                                  }
                                )}`
                              }
                              contentStyle={{
                                borderRadius: 12,
                                border:
                                  "1px solid #eee8ea",
                                fontSize: 11,
                              }}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>

                      <div className="mt-2 space-y-2">
                        {categoryData.map(
                          (item) => (
                            <div
                              key={
                                item.name
                              }
                              className="flex items-center justify-between text-xs"
                            >
                              <span className="text-[#817b7d]">
                                {item.name}
                              </span>

                              <span className="font-medium text-[#211f20]">
                                {moneyHidden
                                  ? MONEY_MASK
                                  : `R$ ${formatCurrency(
                                      item.value,
                                      false
                                    )}`}
                              </span>
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  ) : (
                    <EmptyChart
                      title="Nenhum gasto registrado"
                      text="Quando você registrar despesas, a distribuição por categoria aparecerá aqui."
                    />
                  )}
                </section>
              </div>
            )}

            {activeTab ===
              "appointments" && (
              <div className="mt-4 space-y-4">
                <div className="grid grid-cols-2 gap-2">
                  <MetricCard
                    label="Atendimentos"
                    value={String(
                      currentData.appointments
                    )}
                    icon={
                      <Users className="size-5" />
                    }
                  />

                  <MetricCard
                    label="Ticket médio"
                    value={`R$ ${formatCurrency(
                      averageTicket,
                      moneyHidden
                    )}`}
                    icon={
                      <CircleDollarSign className="size-5" />
                    }
                    hidden={
                      moneyHidden
                    }
                  />
                </div>

                <section>
                  <h2 className="mb-2 text-sm font-semibold text-[#211f20]">
                    Atendimentos por mês
                  </h2>

                  {monthlyData.some(
                    (item) =>
                      item.appointments >
                      0
                  ) ? (
                    <div className="rounded-2xl border border-black/[0.05] bg-white p-3 shadow-sm">
                      <div className="h-56">
                        <ResponsiveContainer
                          width="100%"
                          height="100%"
                        >
                          <BarChart
                            data={
                              monthlyData
                            }
                            margin={{
                              top: 10,
                              right: 0,
                              left: -20,
                              bottom: 0,
                            }}
                          >
                            <CartesianGrid
                              vertical={false}
                              strokeDasharray="3 3"
                              stroke="#eee8ea"
                            />

                            <XAxis
                              dataKey="shortLabel"
                              tick={{
                                fontSize: 10,
                                fill: "#91898b",
                              }}
                              axisLine={false}
                              tickLine={false}
                            />

                            <YAxis
                              allowDecimals={
                                false
                              }
                              tick={{
                                fontSize: 9,
                                fill: "#91898b",
                              }}
                              axisLine={false}
                              tickLine={false}
                            />

                            <Tooltip
                              formatter={(
                                value
                              ) =>
                                `${value} atendimento(s)`
                              }
                              contentStyle={{
                                borderRadius: 12,
                                border:
                                  "1px solid #eee8ea",
                                fontSize: 11,
                              }}
                            />

                            <Bar
                              dataKey="appointments"
                              name="Atendimentos"
                              fill="#b985a1"
                              radius={[
                                5,
                                5,
                                0,
                                0,
                              ]}
                              maxBarSize={24}
                            />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  ) : (
                    <EmptyChart
                      title="Nenhum atendimento registrado"
                      text="Os indicadores serão preenchidos automaticamente conforme você usar o Nuvie."
                    />
                  )}
                </section>
              </div>
            )}

            {activeTab ===
              "services" && (
              <div className="mt-4 space-y-4">
                <section>
                  <div className="mb-3">
                    <h2 className="text-sm font-semibold text-[#211f20]">
                      Serviços mais realizados
                    </h2>

                    <p className="mt-1 text-xs text-[#91898b]">
                      Baseado nos atendimentos registrados
                    </p>
                  </div>

                  {serviceData.length >
                  0 ? (
                    <div className="space-y-2">
                      {serviceData.map(
                        (
                          service,
                          index
                        ) => (
                          <div
                            key={
                              service.name
                            }
                            className="rounded-2xl border border-black/[0.05] bg-white p-4 shadow-sm"
                          >
                            <div className="flex items-center gap-3">
                              <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-[var(--nuvie-primary-soft)] text-xs font-semibold text-[var(--nuvie-primary-strong)]">
                                {index +
                                  1}
                              </div>

                              <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-semibold text-[#211f20]">
                                  {
                                    service.name
                                  }
                                </p>

                                <p className="mt-1 text-xs text-[#91898b]">
                                  {
                                    service.count
                                  }{" "}
                                  atendimento
                                  {service.count !==
                                  1
                                    ? "s"
                                    : ""}
                                </p>
                              </div>

                              <p className="shrink-0 text-sm font-semibold text-[#211f20]">
                                {moneyHidden
                                  ? MONEY_MASK
                                  : `R$ ${formatCurrency(
                                      service.revenue,
                                      false
                                    )}`}
                              </p>
                            </div>

                            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[#f0ebec]">
                              <div
                                className="h-full rounded-full bg-[var(--nuvie-primary)]"
                                style={{
                                  width: `${Math.min(
                                    100,
                                    service.count *
                                      100 /
                                      Math.max(
                                        serviceData[0]
                                          ?.count ??
                                          1,
                                        1
                                      )
                                  )}%`,
                                }}
                              />
                            </div>
                          </div>
                        )
                      )}
                    </div>
                  ) : (
                    <EmptyChart
                      title="Nenhum atendimento registrado"
                      text="Os serviços começarão a aparecer aqui automaticamente conforme você registrar atendimentos."
                    />
                  )}
                </section>
              </div>
            )}
          </>
        )}
      </div>
    </AppShell>
  );
}
