import { Link, useNavigate, useParams } from "@tanstack/react-router";
import {
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Home,
  Plus,
  Search,
  Sparkles,
  TrendingDown,
  TrendingUp,
  UserRound,
  UsersRound,
  WalletCards,
  X,
} from "lucide-react";
import { useState, type CSSProperties } from "react";
import { BrandMark } from "@/components/BrandMark";
import { MoneyToggle } from "@/components/MoneyToggle";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { MONEY_MASK, useMoneyHidden } from "@/lib/money-privacy";

const DEMO_PRIMARY = "#B7838E";
const DEMO_ACTION_MESSAGE = "Crie sua conta grátis para salvar suas informações.";

const navItems = [
  { section: "inicio", label: "Início", icon: Home },
  { section: "agenda", label: "Agenda", icon: CalendarDays },
  { section: "clientes", label: "Clientes", icon: UsersRound },
  { section: "financeiro", label: "Financeiro", icon: WalletCards },
] as const;

const appointments = [
  { time: "09:00", client: "Mariana Costa", service: "Design de sobrancelhas", price: 65, status: "Confirmado" },
  { time: "11:30", client: "Camila Rocha", service: "Extensão de cílios", price: 180, status: "Confirmado" },
  { time: "14:00", client: "Ana Beatriz", service: "Manutenção de cílios", price: 120, status: "Pendente" },
  { time: "16:30", client: "Juliana Alves", service: "Brow lamination", price: 110, status: "Confirmado" },
];

const clients = [
  { name: "Ana Beatriz", phone: "(11) 98765-4321", detail: "Último atendimento há 8 dias" },
  { name: "Camila Rocha", phone: "(11) 97654-3210", detail: "Aniversário em 12 de outubro" },
  { name: "Juliana Alves", phone: "(11) 96543-2109", detail: "3 atendimentos realizados" },
  { name: "Mariana Costa", phone: "(11) 95432-1098", detail: "Cliente desde março" },
];

const services = [
  { name: "Design de sobrancelhas", duration: "45 min", price: 65 },
  { name: "Extensão de cílios", duration: "2h", price: 180 },
  { name: "Manutenção de cílios", duration: "1h 30min", price: 120 },
  { name: "Brow lamination", duration: "1h", price: 110 },
];

const transactions = [
  { label: "Extensão de cílios", detail: "Hoje, 11:30", amount: 180, type: "income" },
  { label: "Materiais descartáveis", detail: "Hoje, 08:15", amount: 48.9, type: "expense" },
  { label: "Design de sobrancelhas", detail: "Ontem, 16:00", amount: 65, type: "income" },
  { label: "Reposição de produtos", detail: "12 set", amount: 132.5, type: "expense" },
];

function currency(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function DemoApp() {
  const { section } = useParams({ from: "/demo/$section" });
  const navigate = useNavigate();
  const [promptOpen, setPromptOpen] = useState(false);
  const [quickOpen, setQuickOpen] = useState(false);
  const moneyHidden = useMoneyHidden();
  const displayMoney = (value: number) => moneyHidden ? MONEY_MASK : currency(value);
  const activeSection = ["inicio", "agenda", "clientes", "servicos", "financeiro"].includes(section)
    ? section
    : "inicio";

  const requestAccount = () => {
    setQuickOpen(false);
    setPromptOpen(true);
  };

  return (
    <div
      className="min-h-screen bg-[#faf9f8] text-[#211f20]"
      style={{
        "--nuvie-primary": DEMO_PRIMARY,
        "--nuvie-primary-soft": `color-mix(in srgb, ${DEMO_PRIMARY} 14%, white)`,
        "--nuvie-primary-medium": `color-mix(in srgb, ${DEMO_PRIMARY} 32%, white)`,
        "--nuvie-primary-strong": `color-mix(in srgb, ${DEMO_PRIMARY} 82%, black)`,
        "--nuvie-primary-deep": `color-mix(in srgb, ${DEMO_PRIMARY} 72%, black)`,
      } as CSSProperties}
    >
      <div className="mx-auto min-h-screen w-full max-w-md px-5 pb-32 pt-5">
        <div className="mb-5 flex items-center justify-between rounded-xl border border-black/[0.05] bg-white px-3 py-2 shadow-sm">
          <div>
            <p className="text-[10px] font-semibold uppercase text-[var(--nuvie-primary-strong)]">Modo demonstração</p>
            <p className="mt-0.5 text-[11px] text-[#817b7d]">Dados fictícios · nada será salvo</p>
          </div>
          <Button variant="ghost" size="sm" asChild className="text-[var(--nuvie-primary-strong)]">
            <Link to="/auth" search={{ criar: true }}>Criar conta</Link>
          </Button>
        </div>

        <header className="mb-6 flex items-center justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3">
            <BrandMark className="size-10 shrink-0 rounded-xl" />
            <div className="min-w-0">
              <p className="mb-1 text-[9px] font-medium uppercase tracking-[0.24em] text-[var(--nuvie-primary)]">Studio Aurora</p>
              <h1 className="truncate text-[25px] font-semibold leading-tight text-[#211f20]">{pageTitle(activeSection)}</h1>
              <p className="mt-1 text-xs text-[#817b7d]">{pageSubtitle(activeSection)}</p>
            </div>
          </div>
          <MoneyToggle />
        </header>

        <main className="nuvie-page-enter pb-4">
          {activeSection === "inicio" && <DemoHome displayMoney={displayMoney} onAction={requestAccount} />}
          {activeSection === "agenda" && <DemoAgenda displayMoney={displayMoney} onAction={requestAccount} />}
          {activeSection === "clientes" && <DemoClients onAction={requestAccount} />}
          {activeSection === "servicos" && <DemoServices displayMoney={displayMoney} onAction={requestAccount} />}
          {activeSection === "financeiro" && <DemoFinance displayMoney={displayMoney} onAction={requestAccount} />}
        </main>
      </div>

      {quickOpen && (
        <div className="fixed inset-0 z-40 bg-black/20" onClick={() => setQuickOpen(false)}>
          <div className="absolute bottom-24 left-1/2 w-[calc(100%-40px)] max-w-md -translate-x-1/2 rounded-3xl bg-white p-4 shadow-2xl" onClick={(event) => event.stopPropagation()}>
            <div className="mb-3 flex items-center justify-between">
              <div><p className="text-sm font-semibold">Ação rápida</p><p className="mt-1 text-xs text-[#817b7d]">O que você deseja adicionar?</p></div>
              <Button variant="ghost" size="icon" aria-label="Fechar" onClick={() => setQuickOpen(false)}><X className="size-4" /></Button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {["Agendamento", "Cliente", "Serviço", "Financeiro"].map((label) => (
                <Button key={label} variant="ghost" className="h-auto justify-start rounded-2xl bg-[#faf9f8] p-4" onClick={requestAccount}>{label}</Button>
              ))}
            </div>
          </div>
        </div>
      )}

      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-black/[0.06] bg-white/95 backdrop-blur-xl">
        <div className="mx-auto max-w-md px-4 pb-[env(safe-area-inset-bottom)]">
          <div className="relative grid grid-cols-5 items-end">
            {navItems.slice(0, 2).map(({ section: itemSection, label, icon: Icon }) => (
              <DemoNavItem key={itemSection} section={itemSection} label={label} Icon={Icon} active={activeSection === itemSection} />
            ))}
            <div className="flex justify-center">
              <Button size="icon" onClick={() => setQuickOpen((value) => !value)} aria-label="Nova ação" className="size-12 rounded-full bg-[var(--nuvie-primary)] text-white shadow-lg ring-4 ring-white hover:bg-[var(--nuvie-primary-strong)]">
                <Plus className="size-5" />
              </Button>
            </div>
            {navItems.slice(2).map(({ section: itemSection, label, icon: Icon }) => (
              <DemoNavItem key={itemSection} section={itemSection} label={label} Icon={Icon} active={activeSection === itemSection} />
            ))}
          </div>
        </div>
      </nav>

      <Dialog open={promptOpen} onOpenChange={setPromptOpen}>
        <DialogContent className="max-w-xs rounded-2xl">
          <DialogHeader>
            <DialogTitle>Continue no Nuvie</DialogTitle>
            <DialogDescription>{DEMO_ACTION_MESSAGE}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPromptOpen(false)}>Continuar explorando</Button>
            <Button onClick={() => navigate({ to: "/auth", search: { criar: true } })}>Criar conta</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function DemoNavItem({ section, label, Icon, active }: { section: string; label: string; Icon: typeof Home; active: boolean }) {
  return (
    <Link to="/demo/$section" params={{ section }} className="flex min-w-0 flex-col items-center gap-1 px-1 py-3 text-[10px] font-medium" style={{ color: active ? DEMO_PRIMARY : "#8a8587" }}>
      <Icon className="size-[18px]" strokeWidth={1.7} /><span className="truncate">{label}</span>
    </Link>
  );
}

function DemoHome({ displayMoney, onAction }: DemoMoneyProps) {
  return <div className="space-y-6">
    <section className="surface overflow-hidden p-5">
      <p className="text-xs text-muted-foreground">Resumo de setembro</p>
      <p className="mt-2 text-3xl font-semibold">{displayMoney(2845.6)}</p>
      <div className="mt-5 grid grid-cols-2 gap-3">
        <Summary icon={TrendingUp} label="Receitas" value={displayMoney(4210)} positive />
        <Summary icon={TrendingDown} label="Despesas" value={displayMoney(1364.4)} />
      </div>
    </section>
    <section><div className="mb-3 flex items-center justify-between"><h2 className="text-sm font-semibold">Próximos atendimentos</h2><Link to="/demo/$section" params={{ section: "agenda" }} className="text-xs text-[var(--nuvie-primary-strong)]">Ver agenda</Link></div>
      <div className="space-y-2">{appointments.slice(0, 2).map((item) => <AppointmentRow key={item.time} item={item} displayMoney={displayMoney} onAction={onAction} />)}</div>
    </section>
    <section><h2 className="mb-3 text-sm font-semibold">Acesso rápido</h2><div className="grid grid-cols-2 gap-3">
      <ActionTile icon={UsersRound} text="Nova cliente" onClick={onAction} />
      <Link to="/demo/$section" params={{ section: "servicos" }} className="surface flex h-20 items-center justify-start gap-2 px-4 text-sm font-medium">
        <Sparkles className="size-5 text-[var(--nuvie-primary-strong)]" /><span>Ver serviços</span>
      </Link>
    </div></section>
  </div>;
}

function DemoAgenda({ displayMoney, onAction }: DemoMoneyProps) {
  return <div className="space-y-5">
    <Button onClick={onAction} className="w-full rounded-xl"><Plus /> Novo agendamento</Button>
    <section className="surface p-4"><p className="text-xs font-medium text-[var(--nuvie-primary-strong)]">Hoje · 18 de setembro</p><div className="mt-4 space-y-2">{appointments.map((item) => <AppointmentRow key={item.time} item={item} displayMoney={displayMoney} onAction={onAction} />)}</div></section>
  </div>;
}

function DemoClients({ onAction }: { onAction: () => void }) {
  const [search, setSearch] = useState("");
  const visible = clients.filter((client) => client.name.toLowerCase().includes(search.toLowerCase()));
  return <div className="space-y-5">
    <div className="flex gap-2"><div className="relative flex-1"><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar cliente" className="h-10 w-full rounded-xl border border-black/[0.08] bg-white pl-10 pr-3 text-sm outline-none" /></div><Button size="icon" onClick={onAction} aria-label="Nova cliente"><Plus /></Button></div>
    <div className="space-y-2">{visible.map((client) => <button key={client.name} type="button" onClick={onAction} className="surface flex w-full items-center gap-3 p-4 text-left"><div className="flex size-10 items-center justify-center rounded-full bg-[var(--nuvie-primary-soft)] text-[var(--nuvie-primary-strong)]"><UserRound className="size-4" /></div><div className="min-w-0 flex-1"><p className="text-sm font-medium">{client.name}</p><p className="mt-0.5 text-xs text-muted-foreground">{client.phone}</p><p className="mt-1 text-[10px] text-muted-foreground">{client.detail}</p></div><ChevronRight className="size-4 text-muted-foreground" /></button>)}</div>
  </div>;
}

function DemoServices({ displayMoney, onAction }: DemoMoneyProps) {
  return <div className="space-y-5"><Button onClick={onAction} className="w-full rounded-xl"><Plus /> Novo serviço</Button><div className="space-y-2">{services.map((service) => <button type="button" key={service.name} onClick={onAction} className="surface flex w-full items-center gap-3 p-4 text-left"><div className="flex size-10 items-center justify-center rounded-xl bg-[var(--nuvie-primary-soft)] text-[var(--nuvie-primary-strong)]"><Sparkles className="size-4" /></div><div className="min-w-0 flex-1"><p className="text-sm font-medium">{service.name}</p><p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground"><Clock3 className="size-3" /> {service.duration}</p></div><p className="text-sm font-semibold">{displayMoney(service.price)}</p></button>)}</div></div>;
}

function DemoFinance({ displayMoney, onAction }: DemoMoneyProps) {
  return <div className="space-y-6"><section className="surface p-5"><p className="text-xs text-muted-foreground">Saldo do mês</p><p className="mt-2 text-3xl font-semibold">{displayMoney(2845.6)}</p><div className="mt-5 grid grid-cols-2 gap-3"><Summary icon={TrendingUp} label="Entradas" value={displayMoney(4210)} positive /><Summary icon={TrendingDown} label="Saídas" value={displayMoney(1364.4)} /></div></section><Button onClick={onAction} className="w-full rounded-xl"><Plus /> Nova movimentação</Button><section><h2 className="mb-3 text-sm font-semibold">Movimentações recentes</h2><div className="space-y-2">{transactions.map((item) => <button type="button" key={`${item.label}-${item.detail}`} onClick={onAction} className="surface flex w-full items-center justify-between gap-3 p-4 text-left"><div><p className="text-sm font-medium">{item.label}</p><p className="mt-1 text-xs text-muted-foreground">{item.detail}</p></div><p className={item.type === "income" ? "text-sm font-semibold text-emerald-600" : "text-sm font-semibold text-rose-600"}>{item.type === "income" ? "+ " : "− "}{displayMoney(item.amount)}</p></button>)}</div></section></div>;
}

type DemoMoneyProps = { displayMoney: (value: number) => string; onAction: () => void };

function AppointmentRow({ item, displayMoney, onAction }: { item: typeof appointments[number]; displayMoney: (value: number) => string; onAction: () => void }) {
  return <button type="button" onClick={onAction} className="flex w-full items-center gap-3 rounded-xl border border-black/[0.05] bg-white p-3 text-left"><div className="w-12 text-center text-xs font-semibold text-[var(--nuvie-primary-strong)]">{item.time}</div><div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{item.client}</p><p className="mt-0.5 truncate text-xs text-muted-foreground">{item.service}</p></div><div className="text-right"><p className="text-xs font-semibold">{displayMoney(item.price)}</p><p className="mt-1 flex items-center justify-end gap-1 text-[9px] text-muted-foreground"><CheckCircle2 className="size-3" />{item.status}</p></div></button>;
}

function Summary({ icon: Icon, label, value, positive = false }: { icon: typeof TrendingUp; label: string; value: string; positive?: boolean }) {
  return <div className="rounded-xl bg-[#faf9f8] p-3"><div className={`flex items-center gap-1 text-[10px] ${positive ? "text-emerald-600" : "text-rose-600"}`}><Icon className="size-3" />{label}</div><p className="mt-1 text-sm font-semibold">{value}</p></div>;
}

function ActionTile({ icon: Icon, text, onClick }: { icon: typeof UsersRound; text: string; onClick: () => void }) {
  return <Button variant="ghost" onClick={onClick} className="surface h-20 justify-start px-4"><Icon className="size-5 text-[var(--nuvie-primary-strong)]" /><span>{text}</span></Button>;
}

function pageTitle(section: string) {
  return ({ inicio: "Início", agenda: "Agenda", clientes: "Clientes", servicos: "Serviços", financeiro: "Financeiro" } as Record<string, string>)[section] ?? "Início";
}

function pageSubtitle(section: string) {
  return ({ inicio: "Seu negócio em um só lugar", agenda: "Organize seus atendimentos", clientes: "4 clientes de demonstração", servicos: "Seu catálogo de procedimentos", financeiro: "Acompanhe entradas e saídas" } as Record<string, string>)[section] ?? "Seu negócio em um só lugar";
}
