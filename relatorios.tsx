import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  BarChart3,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  CircleDollarSign,
  Clock3,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
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
import { useVisitorAccess } from "@/components/VisitorAccess";
import { supabase } from "@/integrations/supabase/client";
import { useMoneyHidden } from "@/lib/money-privacy";

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
  service_name: string;
  total_amount: number;
  scheduled_date: string;
  scheduled_time: string | null;
  status: string;
};

type Tab =
  | "overview"
  | "finance"
  | "appointments"
  | "services";

const MONTH_NAMES = [
  "Jan",
  "Fev",
  "Mar",
  "Abr",
  "Mai",
  "Jun",
  "Jul",
  "Ago",
  "Set",
  "Out",
  "Nov",
  "Dez",
];

function getMonthStart(date: Date) {
  return new Date(
    date.getFullYear(),
    date.getMonth(),
    1
  );
}

function getDateString(date: Date) {
  return `${date.getFullYear()}-${String(
    date.getMonth() + 1
  ).padStart(2, "0")}-${String(
    date.getDate()
  ).padStart(2, "0")}`;
}

function formatMoney(value: number, hidden: boolean) {
  if (hidden) {
    return "••••••";
  }

  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
  });
}

function formatMonthLabel(date: Date) {
  return date.toLocaleDateString("pt-BR", {
    month: "long",
    year: "numeric",
  });
}

function formatPercent(value: number) {
  const rounded = Math.round(value);

  return `${rounded > 0 ? "+" : ""}${rounded}%`;
}

function getMonthDifference(
  current: Date,
  previous: Date
) {
  if (previous.getTime() === 0) {
    return 0;
  }

  return (
    ((current.getTime() - previous.getTime()) /
      Math.abs(previous.getTime())) *
    100
  );
}

function RelatoriosPage() {
  const { isVisitor } = useVisitorAccess();
  const { data: household } = useHousehold();
  const moneyHidden = useMoneyHidden();

  const [selectedMonth, setSelectedMonth] = useState(
    getMonthStart(new Date())
  );

  const [activeTab, setActiveTab] =
    useState<Tab>("overview");

  const periodStart = useMemo(() => {
    return new Date(
      selectedMonth.getFullYear(),
      selectedMonth.getMonth() - 11,
      1
    );
  }, [selectedMonth]);

  const periodEnd = useMemo(() => {
    return new Date(
      selectedMonth.getFullYear(),
      selectedMonth.getMonth() + 1,
      0
    );
  }, [selectedMonth]);

  const startDate = getDateString(periodStart);
  const endDate = getDateString(periodEnd);

  const {
    data: transactions = [],
    isLoading: transactionsLoading,
  } = useQuery({
    queryKey: [
      "studio-report-transactions",
      household?.id,
      startDate,
      endDate,
    ],
    enabled:
      Boolean(household?.id) && !isVisitor,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("transactions")
        .select(
          "id, description, amount, type, date, status, category"
        )
        .eq(
          "household_id",
          household!.id
        )
        .gte("date", startDate)
        .lte("date", endDate)
        .order("date", {
          ascending: true,
        });

      if (error) {
        throw error;
      }

      return (data ?? []) as Transaction[];
    },
  });

  const {
    data: appointments = [],
    isLoading: appointmentsLoading,
  } = useQuery({
    queryKey: [
      "studio-report-appointments",
      household?.id,
      startDate,
      endDate,
    ],
    enabled:
      Boolean(household?.id) && !isVisitor,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("studio_appointments")
        .select(
          `
          id,
          service_name,
          total_amount,
          scheduled_date,
          scheduled_time,
          status
        `
        )
        .eq(
          "household_id",
          household!.id
        )
        .gte(
          "scheduled_date",
          startDate
        )
        .lte(
          "scheduled_date",
          endDate
        )
        .neq(
          "status",
          "cancelado"
        )
        .order(
          "scheduled_date",
          {
            ascending: true,
          }
        );

      if (error) {
        throw error;
      }

      return (data ?? []) as Appointment[];
    },
  });

  const currentMonthKey = `${selectedMonth.getFullYear()}-${String(
    selectedMonth.getMonth() + 1
  ).padStart(2, "0")}`;

  const previousMonth = useMemo(() => {
    return new Date(
      selectedMonth.getFullYear(),
      selectedMonth.getMonth() - 1,
      1
    );
  }, [selectedMonth]);

  const previousMonthKey = `${previousMonth.getFullYear()}-${String(
    previousMonth.getMonth() + 1
  ).padStart(2, "0")}`;

  const monthlyData = useMemo(() => {
    const rows: Array<{
      key: string;
      month: string;
      fullMonth: string;
      revenue: number;
      expenses: number;
      balance: number;
      appointments: number;
    }> = [];

    for (let index = 0; index < 12; index++) {
      const date = new Date(
        periodStart.getFullYear(),
        periodStart.getMonth() + index,
        1
      );

      const key = `${date.getFullYear()}-${String(
        date.getMonth() + 1
      ).padStart(2, "0")}`;

      const revenue = transactions
        .filter(
          (transaction) =>
            transaction.type === "income" &&
            transaction.status !== "pending" &&
            transaction.date.startsWith(key)
        )
        .reduce(
          (sum, transaction) =>
            sum + Number(transaction.amount),
          0
        );

      const expenses = transactions
        .filter(
          (transaction) =>
            transaction.type === "expense" &&
            transaction.status !== "pending" &&
            transaction.date.startsWith(key)
        )
        .reduce(
          (sum, transaction) =>
            sum + Number(transaction.amount),
          0
        );

      const appointmentCount =
        appointments.filter(
          (appointment) =>
            appointment.scheduled_date.startsWith(
              key
            )
        ).length;

      rows.push({
        key,
        month:
          MONTH_NAMES[date.getMonth()],
        fullMonth:
          date.toLocaleDateString(
            "pt-BR",
            {
              month: "long",
              year: "numeric",
            }
          ),
        revenue,
        expenses,
        balance:
          revenue - expenses,
        appointments:
          appointmentCount,
      });
    }

    return rows;
  }, [
    appointments,
    periodStart,
    transactions,
  ]);

  const currentData =
    monthlyData.find(
      (item) =>
        item.key === currentMonthKey
    ) ?? {
      key: currentMonthKey,
      month:
        MONTH_NAMES[
          selectedMonth.getMonth()
        ],
      fullMonth:
        formatMonthLabel(selectedMonth),
      revenue: 0,
      expenses: 0,
      balance: 0,
      appointments: 0,
    };

  const previousData =
    monthlyData.find(
      (item) =>
        item.key === previousMonthKey
    ) ?? {
      revenue: 0,
      expenses: 0,
      balance: 0,
      appointments: 0,
    };

  const revenueGrowth =
    previousData.revenue > 0
      ? getMonthDifference(
          currentData.revenue,
          previousData.revenue
        )
      : 0;

  const appointmentGrowth =
    previousData.appointments > 0
      ? getMonthDifference(
          currentData.appointments,
          previousData.appointments
        )
      : 0;

  const expenseGrowth =
    previousData.expenses > 0
      ? getMonthDifference(
          currentData.expenses,
          previousData.expenses
        )
      : 0;

  const serviceData = useMemo(() => {
    const selectedAppointments =
      appointments.filter(
        (appointment) =>
          appointment.scheduled_date.startsWith(
            currentMonthKey
          )
      );

    const map = new Map<
      string,
      {
        name: string;
        count: number;
        revenue: number;
      }
    >();

    selectedAppointments.forEach(
      (appointment) => {
        const name =
          appointment.service_name?.trim() ||
          "Outros";

        const existing =
          map.get(name);

        if (existing) {
          existing.count += 1;
          existing.revenue += Number(
            appointment.total_amount
          );
        } else {
          map.set(name, {
            name,
            count: 1,
            revenue: Number(
              appointment.total_amount
            ),
          });
        }
      }
    );

    return Array.from(map.values())
      .sort(
        (a, b) =>
          b.count - a.count
      )
      .slice(0, 6);
  }, [
    appointments,
    currentMonthKey,
  ]);

  const paidAppointments =
    appointments.filter(
      (appointment) =>
        appointment.scheduled_date.startsWith(
          currentMonthKey
        )
    );

  const averageTicket =
    currentData.appointments > 0
      ? currentData.revenue /
        currentData.appointments
      : 0;

  const isLoading =
    transactionsLoading ||
    appointmentsLoading;

  function previousMonthAction() {
    setSelectedMonth(
      new Date(
        selectedMonth.getFullYear(),
        selectedMonth.getMonth() - 1,
        1
      )
    );
  }

  function nextMonthAction() {
    setSelectedMonth(
      new Date(
        selectedMonth.getFullYear(),
        selectedMonth.getMonth() + 1,
        1
      )
    );
  }

  const tabs: Array<{
    id: Tab;
    label: string;
  }> = [
    {
      id: "overview",
      label: "Visão geral",
    },
    {
      id: "finance",
      label: "Financeiro",
    },
    {
      id: "appointments",
      label: "Atendimentos",
    },
    {
      id: "services",
      label: "Serviços",
    },
  ];

  return (
    <AppShell
      title="Relatórios"
      subtitle="Veja a evolução do seu negócio"
    >
      <div className="space-y-5">
        {/* SELETOR DE MÊS */}
        <div className="flex items-center justify-between rounded-2xl border border-black/[0.05] bg-white px-3 py-2 shadow-sm">
          <button
            type="button"
            onClick={
              previousMonthAction
            }
            className="flex size-9 items-center justify-center rounded-full text-[#817b7d] transition-colors hover:bg-[#f6f2f1]"
            aria-label="Mês anterior"
          >
            <ChevronLeft className="size-4" />
          </button>

          <p className="text-sm font-semibold capitalize text-[#211f20]">
            {formatMonthLabel(
              selectedMonth
            )}
          </p>

          <button
            type="button"
            onClick={
              nextMonthAction
            }
            className="flex size-9 items-center justify-center rounded-full text-[#817b7d] transition-colors hover:bg-[#f6f2f1]"
            aria-label="Próximo mês"
          >
            <ChevronRight className="size-4" />
          </button>
        </div>

        {/* ABAS */}
        <div className="flex gap-1 overflow-x-auto rounded-2xl bg-[#f3efee] p-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() =>
                setActiveTab(tab.id)
              }
              className={`shrink-0 rounded-xl px-3 py-2 text-[11px] font-medium transition-all ${
                activeTab === tab.id
                  ? "bg-white text-[#211f20] shadow-sm"
                  : "text-[#817b7d]"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="rounded-2xl bg-white px-5 py-12 text-center text-sm text-[#817b7d] shadow-sm">
            Gerando seu relatório...
          </div>
        ) : (
          <>
            {/* VISÃO GERAL */}
            {activeTab ===
              "overview" && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-2">
                  <MetricCard
                    icon={
                      <CalendarDays className="size-4" />
                    }
                    label="Atendimentos"
                    value={String(
                      currentData.appointments
                    )}
                    variation={
                      appointmentGrowth
                    }
                  />

                  <MetricCard
                    icon={
                      <CircleDollarSign className="size-4" />
                    }
                    label="Faturamento"
                    value={formatMoney(
                      currentData.revenue,
                      moneyHidden
                    )}
                    variation={
                      revenueGrowth
                    }
                    money
                  />

                  <MetricCard
                    icon={
                      <TrendingDown className="size-4" />
                    }
                    label="Despesas"
                    value={formatMoney(
                      currentData.expenses,
                      moneyHidden
                    )}
                    variation={
                      expenseGrowth
                    }
                    money
                    negative
                  />

                  <MetricCard
                    icon={
                      <BarChart3 className="size-4" />
                    }
                    label="Resultado"
                    value={formatMoney(
                      currentData.balance,
                      moneyHidden
                    )}
                    variation={
                      currentData.balance -
                        previousData.balance
                    }
                    money
                  />
                </div>

                <ReportCard title="Evolução do faturamento">
                  <div className="h-52 w-full">
                    <ResponsiveContainer
                      width="100%"
                      height="100%"
                    >
                      <LineChart
                        data={
                          monthlyData
                        }
                        margin={{
                          top: 10,
                          right: 4,
                          left: -22,
                          bottom: 0,
                        }}
                      >
                        <CartesianGrid
                          stroke="#eee8e6"
                          vertical={false}
                        />

                        <XAxis
                          dataKey="month"
                          tick={{
                            fontSize: 10,
                            fill: "#817b7d",
                          }}
                          axisLine={false}
                          tickLine={false}
                        />

                        <YAxis
                          tick={{
                            fontSize: 9,
                            fill: "#817b7d",
                          }}
                          axisLine={false}
                          tickLine={false}
                          tickFormatter={(value) =>
                            value >= 1000
                              ? `${Math.round(
                                  value /
                                    1000
                                )}k`
                              : value
                          }
                        />

                        <Tooltip
                          formatter={(
                            value
                          ) =>
                            formatMoney(
                              Number(
                                value
                              ),
                              moneyHidden
                            )
                          }
                          labelFormatter={(
                            label
                          ) =>
                            String(
                              label
                            )
                          }
                        />

                        <Line
                          type="monotone"
                          dataKey="revenue"
                          stroke="#96747b"
                          strokeWidth={2.5}
                          dot={{
                            r: 3,
                            fill: "#96747b",
                          }}
                          activeDot={{
                            r: 5,
                          }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </ReportCard>

                <ReportCard title="Entradas x saídas">
                  <div className="h-52 w-full">
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
                          right: 4,
                          left: -22,
                          bottom: 0,
                        }}
                      >
                        <CartesianGrid
                          stroke="#eee8e6"
                          vertical={false}
                        />

                        <XAxis
                          dataKey="month"
                          tick={{
                            fontSize: 10,
                            fill: "#817b7d",
                          }}
                          axisLine={false}
                          tickLine={false}
                        />

                        <YAxis
                          tick={{
                            fontSize: 9,
                            fill: "#817b7d",
                          }}
                          axisLine={false}
                          tickLine={false}
                        />

                        <Tooltip
                          formatter={(
                            value
                          ) =>
                            formatMoney(
                              Number(
                                value
                              ),
                              moneyHidden
                            )
                          }
                        />

                        <Bar
                          dataKey="revenue"
                          name="Entradas"
                          fill="#96747b"
                          radius={[
                            4,
                            4,
                            0,
                            0,
                          ]}
                        />

                        <Bar
                          dataKey="expenses"
                          name="Saídas"
                          fill="#d9cdca"
                          radius={[
                            4,
                            4,
                            0,
                            0,
                          ]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </ReportCard>

                <div className="rounded-2xl bg-[#f3e9ea] p-5">
                  <div className="flex items-start gap-3">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-white text-[#96747b]">
                      {revenueGrowth >=
                      0 ? (
                        <TrendingUp className="size-5" />
                      ) : (
                        <TrendingDown className="size-5" />
                      )}
                    </div>

                    <div>
                      <p className="text-sm font-semibold text-[#211f20]">
                        {revenueGrowth >=
                        0
                          ? `Seu estúdio cresceu ${Math.abs(
                              Math.round(
                                revenueGrowth
                              )
                            )}% este mês.`
                          : `Seu faturamento caiu ${Math.abs(
                              Math.round(
                                revenueGrowth
                              )
                            )}% este mês.`}
                      </p>

                      <p className="mt-1 text-xs leading-relaxed text-[#817b7d]">
                        Comparação automática
                        com o mês anterior,
                        baseada nos dados
                        registrados no Nuvie.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* FINANCEIRO */}
            {activeTab ===
              "finance" && (
              <div className="space-y-4">
                <ReportCard title="Faturamento mensal">
                  <div className="mb-4">
                    <p className="text-2xl font-semibold text-[#211f20]">
                      {formatMoney(
                        currentData.revenue,
                        moneyHidden
                      )}
                    </p>

                    <p className="mt-1 text-xs text-[#817b7d]">
                      {revenueGrowth >=
                      0
                        ? `${formatPercent(
                            revenueGrowth
                          )} em relação ao mês anterior`
                        : `${Math.round(
                            revenueGrowth
                          )}% em relação ao mês anterior`}
                    </p>
                  </div>

                  <div className="h-56">
                    <ResponsiveContainer
                      width="100%"
                      height="100%"
                    >
                      <LineChart
                        data={
                          monthlyData
                        }
                      >
                        <CartesianGrid
                          stroke="#eee8e6"
                          vertical={false}
                        />

                        <XAxis
                          dataKey="month"
                          tick={{
                            fontSize: 10,
                            fill: "#817b7d",
                          }}
                          axisLine={false}
                          tickLine={false}
                        />

                        <YAxis
                          tick={{
                            fontSize: 9,
                            fill: "#817b7d",
                          }}
                          axisLine={false}
                          tickLine={false}
                        />

                        <Tooltip />

                        <Line
                          type="monotone"
                          dataKey="revenue"
                          stroke="#96747b"
                          strokeWidth={2.5}
                          dot={{
                            r: 3,
                          }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </ReportCard>

                <ReportCard title="Resultado do mês">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-xl bg-[#f5f2f1] p-4">
                      <p className="text-[11px] text-[#817b7d]">
                        Entradas
                      </p>

                      <p className="mt-1 text-base font-semibold text-[#211f20]">
                        {formatMoney(
                          currentData.revenue,
                          moneyHidden
                        )}
                      </p>
                    </div>

                    <div className="rounded-xl bg-[#f5f2f1] p-4">
                      <p className="text-[11px] text-[#817b7d]">
                        Despesas
                      </p>

                      <p className="mt-1 text-base font-semibold text-[#211f20]">
                        {formatMoney(
                          currentData.expenses,
                          moneyHidden
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 rounded-xl bg-[#f3e9ea] p-4">
                    <p className="text-[11px] text-[#817b7d]">
                      Resultado
                    </p>

                    <p className="mt-1 text-xl font-semibold text-[#211f20]">
                      {formatMoney(
                        currentData.balance,
                        moneyHidden
                      )}
                    </p>
                  </div>
                </ReportCard>
              </div>
            )}

            {/* ATENDIMENTOS */}
            {activeTab ===
              "appointments" && (
              <div className="space-y-4">
                <ReportCard title="Atendimentos por mês">
                  <div className="mb-4 flex items-end justify-between">
                    <div>
                      <p className="text-3xl font-semibold text-[#211f20]">
                        {
                          currentData.appointments
                        }
                      </p>

                      <p className="mt-1 text-xs text-[#817b7d]">
                        atendimentos realizados
                      </p>
                    </div>

                    <div className="rounded-full bg-[#edf5ef] px-3 py-1 text-xs font-medium text-[#58705c]">
                      {formatPercent(
                        appointmentGrowth
                      )}
                    </div>
                  </div>

                  <div className="h-56">
                    <ResponsiveContainer
                      width="100%"
                      height="100%"
                    >
                      <LineChart
                        data={
                          monthlyData
                        }
                      >
                        <CartesianGrid
                          stroke="#eee8e6"
                          vertical={false}
                        />

                        <XAxis
                          dataKey="month"
                          tick={{
                            fontSize: 10,
                            fill: "#817b7d",
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
                            fill: "#817b7d",
                          }}
                          axisLine={false}
                          tickLine={false}
                        />

                        <Tooltip />

                        <Line
                          type="monotone"
                          dataKey="appointments"
                          stroke="#96747b"
                          strokeWidth={2.5}
                          dot={{
                            r: 3,
                          }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </ReportCard>

                <div className="grid grid-cols-2 gap-3">
                  <SmallMetric
                    icon={
                      <CalendarDays className="size-4" />
                    }
                    label="Atendimentos"
                    value={String(
                      currentData.appointments
                    )}
                  />

                  <SmallMetric
                    icon={
                      <CircleDollarSign className="size-4" />
                    }
                    label="Ticket médio"
                    value={formatMoney(
                      averageTicket,
                      moneyHidden
                    )}
                  />
                </div>

                <ReportCard title="Resumo">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-[#817b7d]">
                        Atendimentos
                      </span>

                      <strong className="text-sm text-[#211f20]">
                        {
                          paidAppointments.length
                        }
                      </strong>
                    </div>

                    <div className="h-px bg-[#eee8e6]" />

                    <div className="flex items-center justify-between">
                      <span className="text-xs text-[#817b7d]">
                        Faturamento médio por atendimento
                      </span>

                      <strong className="text-sm text-[#211f20]">
                        {formatMoney(
                          averageTicket,
                          moneyHidden
                        )}
                      </strong>
                    </div>
                  </div>
                </ReportCard>
              </div>
            )}

            {/* SERVIÇOS */}
            {activeTab ===
              "services" && (
              <div className="space-y-4">
                <ReportCard title="Serviços mais realizados">
                  {serviceData.length ===
                  0 ? (
                    <p className="py-8 text-center text-sm text-[#817b7d]">
                      Ainda não existem
                      atendimentos registrados
                      neste mês.
                    </p>
                  ) : (
                    <div className="space-y-4">
                      {serviceData.map(
                        (
                          service,
                          index
                        ) => {
                          const total =
                            currentData.appointments ||
                            1;

                          const percentage =
                            (service.count /
                              total) *
                            100;

                          return (
                            <div
                              key={
                                service.name
                              }
                            >
                              <div className="mb-1.5 flex items-center justify-between gap-3">
                                <p className="min-w-0 truncate text-xs font-medium text-[#211f20]">
                                  {
                                    service.name
                                  }
                                </p>

                                <div className="flex shrink-0 items-center gap-2">
                                  <span className="text-[10px] text-[#817b7d]">
                                    {service.count}
                                  </span>

                                  <span className="text-[10px] text-[#817b7d]">
                                    {Math.round(
                                      percentage
                                    )}
                                    %
                                  </span>
                                </div>
                              </div>

                              <div className="h-2 overflow-hidden rounded-full bg-[#eee8e6]">
                                <div
                                  className="h-full rounded-full bg-[#96747b]"
                                  style={{
                                    width: `${percentage}%`,
                                    opacity:
                                      Math.max(
                                        0.45,
                                        1 -
                                          index *
                                            0.08
                                      ),
                                  }}
                                />
                              </div>
                            </div>
                          );
                        }
                      )}
                    </div>
                  )}
                </ReportCard>

                {serviceData.length >
                  0 && (
                  <ReportCard title="Participação dos serviços">
                    <div className="h-60">
                      <ResponsiveContainer
                        width="100%"
                        height="100%"
                      >
                        <PieChart>
                          <Pie
                            data={
                              serviceData
                            }
                            dataKey="count"
                            nameKey="name"
                            innerRadius={55}
                            outerRadius={82}
                            paddingAngle={3}
                          >
                            {serviceData.map(
                              (
                                service,
                                index
                              ) => (
                                <Cell
                                  key={
                                    service.name
                                  }
                                  fill={
                                    [
                                      "#96747b",
                                      "#b49a9f",
                                      "#c9b5b8",
                                      "#d9cdca",
                                      "#e4dcd9",
                                      "#eee8e6",
                                    ][
                                      index %
                                        6
                                    ]
                                  }
                                />
                              )
                            )}
                          </Pie>

                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </ReportCard>
                )}

                <ReportCard title="Faturamento por serviço">
                  <div className="space-y-3">
                    {serviceData.map(
                      (service) => (
                        <div
                          key={
                            service.name
                          }
                          className="flex items-center justify-between gap-3"
                        >
                          <span className="min-w-0 truncate text-xs text-[#817b7d]">
                            {
                              service.name
                            }
                          </span>

                          <strong className="shrink-0 text-xs text-[#211f20]">
                            {formatMoney(
                              service.revenue,
                              moneyHidden
                            )}
                          </strong>
                        </div>
                      )
                    )}
                  </div>
                </ReportCard>
              </div>
            )}
          </>
        )}
      </div>
    </AppShell>
  );
}

function MetricCard({
  icon,
  label,
  value,
  variation,
  money = false,
  negative = false,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  variation: number;
  money?: boolean;
  negative?: boolean;
}) {
  const positive =
    negative
      ? variation <= 0
      : variation >= 0;

  return (
    <div className="rounded-2xl border border-black/[0.04] bg-white p-4 shadow-sm">
      <div className="flex size-8 items-center justify-center rounded-xl bg-[#f3e9ea] text-[#96747b]">
        {icon}
      </div>

      <p className="mt-3 text-[11px] text-[#817b7d]">
        {label}
      </p>

      <p
        className={`mt-1 truncate font-semibold text-[#211f20] ${
          money
            ? "text-[15px]"
            : "text-xl"
        }`}
      >
        {value}
      </p>

      {variation !== 0 && (
        <div
          className={`mt-2 inline-flex rounded-full px-2 py-0.5 text-[9px] font-medium ${
            positive
              ? "bg-[#edf5ef] text-[#58705c]"
              : "bg-[#f9eeee] text-[#9a6262]"
          }`}
        >
          {variation > 0
            ? "+"
            : ""}
          {Math.round(
            variation
          )}
          %
        </div>
      )}
    </div>
  );
}

function SmallMetric({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/[0.04]">
      <div className="flex size-8 items-center justify-center rounded-xl bg-[#f3e9ea] text-[#96747b]">
        {icon}
      </div>

      <p className="mt-3 text-[11px] text-[#817b7d]">
        {label}
      </p>

      <p className="mt-1 text-base font-semibold text-[#211f20]">
        {value}
      </p>
    </div>
  );
}

function ReportCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-black/[0.04] bg-white p-4 shadow-sm">
      <h2 className="mb-4 text-sm font-semibold text-[#211f20]">
        {title}
      </h2>

      {children}
    </section>
  );
}
