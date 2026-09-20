import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import {
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Home,
  LogIn,
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
import { useMemo, useState, type CSSProperties } from "react";
import { BrandMark } from "@/components/BrandMark";
import { MoneyToggle } from "@/components/MoneyToggle";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { MONEY_MASK, useMoneyHidden } from "@/lib/money-privacy";

const VISITOR_PRIMARY = "#B7838E";
const ACCOUNT_MESSAGE = "Crie sua conta grátis para salvar suas informações.";

const navItems = [
  { to: "/inicio", label: "Início", icon: Home },
  { to: "/agenda", label: "Agenda", icon: CalendarDays },
  { to: "/clientes", label: "Clientes", icon: UsersRound },
  { to: "/movimentacoes", label: "Financeiro", icon: WalletCards },
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

type VisitorForm = "appointment" | "client" | "service" | "transaction";

function currency(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function sectionFromPath(pathname: string) {
  if (pathname.startsWith("/agenda")) return "agenda";
  if (pathname.startsWith("/clientes")) return "clientes";
  if (pathname.startsWith("/servicos")) return "servicos";
  if (pathname.startsWith("/movimentacoes")) return "financeiro";
  return "inicio";
}

export function VisitorApp() {
  const location = useLocation();
  const navigate = useNavigate();
  const section = sectionFromPath(location.pathname);
  const [accountPromptOpen, setAccountPromptOpen] = useState(false);
  const [quickOpen, setQuickOpen] = useState(false);
  const [form, setForm] = useState<VisitorForm | null>(null);
  const moneyHidden = useMoneyHidden();
  const displayMoney = (value: number) => moneyHidden ? MONEY_MASK : currency(value);

  function openForm(nextForm: VisitorForm) {
    setQuickOpen(false);
    setForm(nextForm);
  }

  function requestAccount() {
    setForm(null);
    setAccountPromptOpen(true);
  }

  return (
    <div
      className="min-h-screen bg-[#faf9f8] text-[#211f20]"
      style={{
        "--nuvie-primary": VISITOR_PRIMARY,
        "--nuvie-primary-soft": `color-mix(in srgb, ${VISITOR_PRIMARY} 14%, white)`,
        "--nuvie-primary-medium": `color-mix(in srgb, ${VISITOR_PRIMARY} 32%, white)`,
        "--nuvie-primary-strong": `color-mix(in srgb, ${VISITOR_PRIMARY} 82%, black)`,
        "--nuvie-primary-deep": `color-mix(in srgb, ${VISITOR_PRIMARY} 72%, black)`,
      } as CSSProperties}
    >
      <div className="mx-auto min-h-screen w-full max-w-md px-5 pb-32 pt-5">
        <header className="mb-6 flex items-center justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3">
            <BrandMark className="size-10 shrink-0 rounded-xl" />
            <div className="min-w-0">
              <p className="mb-1 text-[9px] font-medium uppercase tracking-[0.24em] text-[var(--nuvie-primary)]">Nuvie</p>
              <h1 className="truncate text-[25px] font-semibold leading-tight text-[#211f20]">{pageTitle(section)}</h1>
              <p className="mt-1 text-xs text-[#817b7d]">{pageSubtitle(section)}</p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <MoneyToggle />
            <Button variant="ghost" size="icon" asChild className="rounded-full" aria-label="Entrar">
              <Link to="/auth" search={{}}><LogIn className="size-4" /></Link>
            </Button>
          </div>
        </header>

        <main className="nuvie-page-enter pb-4">
          {section === "inicio" && <VisitorHome displayMoney={displayMoney} openForm={openForm} />}
          {section === "agenda" && <VisitorAgenda displayMoney={displayMoney} openForm={openForm} />}
          {section === "clientes" && <VisitorClients openForm={openForm} />}
          {section === "servicos" && <VisitorServices displayMoney={displayMoney} openForm={openForm} />}
          {section === "financeiro" && <VisitorFinance displayMoney={displayMoney} openForm={openForm} />}
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
              <Button variant="ghost" className="h-auto justify-start rounded-2xl bg-[#faf9f8] p-4" onClick={() => openForm("appointment")}>Agendamento</Button>
              <Button variant="ghost" className="h-auto justify-start rounded-2xl bg-[#faf9f8] p-4" onClick={() => openForm("client")}>Cliente</Button>
              <Button variant="ghost" className="h-auto justify-start rounded-2xl bg-[#faf9f8] p-4" onClick={() => openForm("service")}>Serviço</Button>
              <Button variant="ghost" className="h-auto justify-start rounded-2xl bg-[#faf9f8] p-4" onClick={() => openForm("transaction")}>Financeiro</Button>
            </div>
          </div>
        </div>
      )}

      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-black/[0.06] bg-white/95 backdrop-blur-xl">
        <div className="mx-auto max-w-md px-4 pb-[env(safe-area-inset-bottom)]">
          <div className="relative grid grid-cols-5 items-end">
            {navItems.slice(0, 2).map((item) => <VisitorNavItem key={item.to} {...item} active={location.pathname.startsWith(item.to)} />)}
            <div className="flex justify-center">
              <Button size="icon" onClick={() => setQuickOpen((value) => !value)} aria-label="Nova ação" className="size-12 rounded-full bg-[var(--nuvie-primary)] text-white shadow-lg ring-4 ring-white hover:bg-[var(--nuvie-primary-strong)]">
                <Plus className="size-5" />
              </Button>
            </div>
            {navItems.slice(2).map((item) => <VisitorNavItem key={item.to} {...item} active={location.pathname.startsWith(item.to)} />)}
          </div>
        </div>
      </nav>

      <VisitorFormDialog form={form} onClose={() => setForm(null)} onSave={requestAccount} />

      <Dialog open={accountPromptOpen} onOpenChange={setAccountPromptOpen}>
        <DialogContent className="max-w-xs rounded-2xl">
          <DialogHeader>
            <DialogTitle>Continue no Nuvie</DialogTitle>
            <DialogDescription>{ACCOUNT_MESSAGE}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAccountPromptOpen(false)}>Continuar explorando</Button>
            <Button onClick={() => navigate({ to: "/auth", search: { criar: true } })}>Criar conta</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function VisitorNavItem({ to, label, icon: Icon, active }: (typeof navItems)[number] & { active: boolean }) {
  return <Link to={to} className="flex min-w-0 flex-col items-center gap-1 px-1 py-3 text-[10px] font-medium" style={{ color: active ? VISITOR_PRIMARY : "#8a8587" }}><Icon className="size-[18px]" strokeWidth={1.7} /><span className="truncate">{label}</span></Link>;
}

function VisitorHome({ displayMoney, openForm }: VisitorMoneyProps) {
  return <div className="space-y-6">
    <section className="surface overflow-hidden p-5"><p className="text-xs text-muted-foreground">Resumo do mês</p><p className="mt-2 text-3xl font-semibold">{displayMoney(2845.6)}</p><div className="mt-5 grid grid-cols-2 gap-3"><Summary icon={TrendingUp} label="Receitas" value={displayMoney(4210)} positive /><Summary icon={TrendingDown} label="Despesas" value={displayMoney(1364.4)} /></div></section>
    <section><div className="mb-3 flex items-center justify-between"><h2 className="text-sm font-semibold">Próximos atendimentos</h2><Link to="/agenda" className="text-xs text-[var(--nuvie-primary-strong)]">Ver agenda</Link></div><div className="space-y-2">{appointments.slice(0, 2).map((item) => <AppointmentRow key={item.time} item={item} displayMoney={displayMoney} onClick={() => openForm("appointment")} />)}</div></section>
    <section><h2 className="mb-3 text-sm font-semibold">Acesso rápido</h2><div className="grid grid-cols-2 gap-3"><ActionTile icon={UsersRound} text="Nova cliente" onClick={() => openForm("client")} /><Link to="/servicos" className="surface flex h-20 items-center justify-start gap-2 px-4 text-sm font-medium"><Sparkles className="size-5 text-[var(--nuvie-primary-strong)]" /><span>Ver serviços</span></Link></div></section>
  </div>;
}

function VisitorAgenda({ displayMoney, openForm }: VisitorMoneyProps) {
  return <div className="space-y-5"><Button onClick={() => openForm("appointment")} className="w-full rounded-xl"><Plus /> Novo agendamento</Button><section className="surface p-4"><p className="text-xs font-medium text-[var(--nuvie-primary-strong)]">Hoje</p><div className="mt-4 space-y-2">{appointments.map((item) => <AppointmentRow key={item.time} item={item} displayMoney={displayMoney} onClick={() => openForm("appointment")} />)}</div></section></div>;
}

function VisitorClients({ openForm }: { openForm: (form: VisitorForm) => void }) {
  const [search, setSearch] = useState("");
  const visible = clients.filter((client) => client.name.toLowerCase().includes(search.toLowerCase()));
  return <div className="space-y-5"><div className="flex gap-2"><div className="relative flex-1"><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar cliente" className="pl-10" /></div><Button size="icon" onClick={() => openForm("client")} aria-label="Nova cliente"><Plus /></Button></div><div className="space-y-2">{visible.map((client) => <Button variant="ghost" key={client.name} type="button" onClick={() => openForm("client")} className="surface h-auto w-full justify-start gap-3 p-4 text-left"><div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[var(--nuvie-primary-soft)] text-[var(--nuvie-primary-strong)]"><UserRound className="size-4" /></div><div className="min-w-0 flex-1"><p className="text-sm font-medium">{client.name}</p><p className="mt-0.5 text-xs text-muted-foreground">{client.phone}</p><p className="mt-1 text-[10px] text-muted-foreground">{client.detail}</p></div><ChevronRight className="size-4 text-muted-foreground" /></Button>)}</div></div>;
}

function VisitorServices({ displayMoney, openForm }: VisitorMoneyProps) {
  return <div className="space-y-5"><Button onClick={() => openForm("service")} className="w-full rounded-xl"><Plus /> Novo serviço</Button><div className="space-y-2">{services.map((service) => <Button variant="ghost" key={service.name} onClick={() => openForm("service")} className="surface h-auto w-full justify-start gap-3 p-4 text-left"><div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[var(--nuvie-primary-soft)] text-[var(--nuvie-primary-strong)]"><Sparkles className="size-4" /></div><div className="min-w-0 flex-1"><p className="text-sm font-medium">{service.name}</p><p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground"><Clock3 className="size-3" /> {service.duration}</p></div><p className="text-sm font-semibold">{displayMoney(service.price)}</p></Button>)}</div></div>;
}

function VisitorFinance({ displayMoney, openForm }: VisitorMoneyProps) {
  const totals = useMemo(() => ({ income: 4210, expense: 1364.4 }), []);
  return <div className="space-y-6"><section className="surface p-5"><p className="text-xs text-muted-foreground">Saldo do mês</p><p className="mt-2 text-3xl font-semibold">{displayMoney(totals.income - totals.expense)}</p><div className="mt-5 grid grid-cols-2 gap-3"><Summary icon={TrendingUp} label="Entradas" value={displayMoney(totals.income)} positive /><Summary icon={TrendingDown} label="Saídas" value={displayMoney(totals.expense)} /></div></section><Button onClick={() => openForm("transaction")} className="w-full rounded-xl"><Plus /> Nova movimentação</Button><section><h2 className="mb-3 text-sm font-semibold">Movimentações recentes</h2><div className="space-y-2">{transactions.map((item) => <Button variant="ghost" key={`${item.label}-${item.detail}`} onClick={() => openForm("transaction")} className="surface h-auto w-full justify-between gap-3 p-4 text-left"><div><p className="text-sm font-medium">{item.label}</p><p className="mt-1 text-xs text-muted-foreground">{item.detail}</p></div><p className={item.type === "income" ? "text-sm font-semibold text-emerald-600" : "text-sm font-semibold text-rose-600"}>{item.type === "income" ? "+ " : "− "}{displayMoney(item.amount)}</p></Button>)}</div></section></div>;
}

function VisitorFormDialog({ form, onClose, onSave }: { form: VisitorForm | null; onClose: () => void; onSave: () => void }) {
  const titles: Record<VisitorForm, string> = { appointment: "Novo agendamento", client: "Nova cliente", service: "Novo serviço", transaction: "Nova movimentação" };
  return <Dialog open={Boolean(form)} onOpenChange={(open) => !open && onClose()}><DialogContent className="max-w-sm rounded-2xl"><DialogHeader><DialogTitle>{form ? titles[form] : "Adicionar"}</DialogTitle></DialogHeader><div className="space-y-4">{form === "appointment" && <><Field id="visitor-client" label="Cliente" placeholder="Nome da cliente" /><Field id="visitor-service" label="Serviço" placeholder="Serviço" /><div className="grid grid-cols-2 gap-3"><Field id="visitor-date" label="Data" type="date" /><Field id="visitor-time" label="Horário" type="time" /></div></>}{form === "client" && <><Field id="visitor-name" label="Nome" placeholder="Nome da cliente" /><Field id="visitor-phone" label="WhatsApp" placeholder="(00) 00000-0000" /><Field id="visitor-birthday" label="Aniversário" type="date" /></>}{form === "service" && <><Field id="visitor-service-name" label="Nome" placeholder="Nome do serviço" /><Field id="visitor-price" label="Valor" placeholder="R$ 0,00" /><Field id="visitor-duration" label="Duração" placeholder="60 minutos" /></>}{form === "transaction" && <><Field id="visitor-description" label="Descrição" placeholder="Descrição da movimentação" /><Field id="visitor-amount" label="Valor" placeholder="R$ 0,00" /><Field id="visitor-transaction-date" label="Data" type="date" /></>}</div><DialogFooter><Button variant="outline" onClick={onClose}>Cancelar</Button><Button onClick={onSave}>Salvar</Button></DialogFooter></DialogContent></Dialog>;
}

function Field({ id, label, placeholder, type = "text" }: { id: string; label: string; placeholder?: string; type?: string }) {
  return <div className="space-y-2"><Label htmlFor={id}>{label}</Label><Input id={id} type={type} placeholder={placeholder} /></div>;
}

type VisitorMoneyProps = { displayMoney: (value: number) => string; openForm: (form: VisitorForm) => void };

function AppointmentRow({ item, displayMoney, onClick }: { item: (typeof appointments)[number]; displayMoney: (value: number) => string; onClick: () => void }) {
  return <Button variant="ghost" type="button" onClick={onClick} className="h-auto w-full justify-start gap-3 rounded-xl border border-black/[0.05] bg-white p-3 text-left"><div className="w-12 text-center text-xs font-semibold text-[var(--nuvie-primary-strong)]">{item.time}</div><div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{item.client}</p><p className="mt-0.5 truncate text-xs text-muted-foreground">{item.service}</p></div><div className="text-right"><p className="text-xs font-semibold">{displayMoney(item.price)}</p><p className="mt-1 flex items-center justify-end gap-1 text-[9px] text-muted-foreground"><CheckCircle2 className="size-3" />{item.status}</p></div></Button>;
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
  return ({ inicio: "Seu negócio em um só lugar", agenda: "Organize seus atendimentos", clientes: "Relacionamento com suas clientes", servicos: "Seu catálogo de procedimentos", financeiro: "Acompanhe entradas e saídas" } as Record<string, string>)[section] ?? "Seu negócio em um só lugar";
}