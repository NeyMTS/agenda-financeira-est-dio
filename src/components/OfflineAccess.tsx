import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { useQueryClient, onlineManager } from "@tanstack/react-query";
import { useLocation } from "@tanstack/react-router";
import { WifiOff } from "lucide-react";
import { clearOfflineSnapshot, collectOfflineEntries, readOfflineSnapshot, saveOfflineSnapshot, offlineAccessValid } from "@/lib/offline-store";
import { appointmentOptions, clientOptions, offlineMonths, serviceOptions } from "@/lib/studio-queries";
import type { Subscription } from "@/lib/subscription";

const OfflineContext = createContext({ online: true });
export const useOfflineAccess = () => useContext(OfflineContext);
let storageQueue: Promise<unknown> = Promise.resolve();
export function purgeOfflineData() {
  storageQueue = storageQueue.catch(() => {}).then(() => clearOfflineSnapshot());
  return storageQueue;
}

export function OfflineAccess({ userId, children }: { userId?: string; children: ReactNode }) {
  const client = useQueryClient();
  const location = useLocation();
  const [online, setOnline] = useState(true);
  const [ready, setReady] = useState(false);
  const [revision, setRevision] = useState(0);
  const [storageFailed, setStorageFailed] = useState(false);

  useEffect(() => {
    const sync = () => { setOnline(navigator.onLine); onlineManager.setOnline(navigator.onLine); };
    sync();
    window.addEventListener("online", sync);
    window.addEventListener("offline", sync);
    return () => { window.removeEventListener("online", sync); window.removeEventListener("offline", sync); };
  }, []);

  useEffect(() => {
    let active = true;
    let timer: ReturnType<typeof setTimeout> | undefined;
    setReady(false);
    async function initialize() {
      try {
        await storageQueue.catch(() => {});
        const saved = userId ? await readOfflineSnapshot(userId) : undefined;
        if (!active) return;
        if (saved) {
          for (const entry of saved.entries) {
            if (entry.updatedAt > (client.getQueryState(entry.key)?.dataUpdatedAt ?? 0)) {
              client.setQueryData(entry.key, entry.data, { updatedAt: entry.updatedAt });
            }
          }
        } else { await purgeOfflineData(); }
      } catch { if (active) setStorageFailed(true); }
      finally { if (active) setReady(true); }
    }
    void initialize();
    const unsubscribe = client.getQueryCache().subscribe((event) => {
      if (!active || event.type !== "updated" || event.action.type !== "success") return;
      setRevision((value) => value + 1);
      if (!userId) return;
      clearTimeout(timer);
      timer = setTimeout(() => {
        if (!active) return;
        const entries = collectOfflineEntries(client);
        if (!entries.length) return;
        storageQueue = storageQueue.catch(() => {}).then(() => {
          if (active) return saveOfflineSnapshot({ userId, entries });
        }).catch(() => { if (active) setStorageFailed(true); });
      }, 150);
    });
    return () => { active = false; clearTimeout(timer); unsubscribe(); };
  }, [client, userId]);

  useEffect(() => {
    if (!ready || !online || !userId) return;
    const household = client.getQueryData<{ id: string }>(["household", "current-user"]);
    const sub = client.getQueryData<Subscription>(["subscription", "current-user"]);
    if (!household || !offlineAccessValid(sub)) return;
    // Fetch in the background, sharing the same keys as the visible screens.
    void client.prefetchQuery(clientOptions(household.id));
    void client.prefetchQuery(serviceOptions(household.id));
    for (const [start, end] of offlineMonths()) {
      void client.prefetchQuery(appointmentOptions(household.id, start, end));
    }
  }, [client, online, ready, userId, revision]);

  const allowed = ["/", "/inicio", "/agenda", "/clientes", "/servicos"].includes(location.pathname);
  const sub = client.getQueryData<Subscription>(["subscription", "current-user"]);
  const valid = offlineAccessValid(sub);
  const entries = collectOfflineEntries(client).filter((entry) => {
    const name = entry.key[0];
    return location.pathname === "/clientes" ? name === "studio-clients" :
      location.pathname === "/servicos" ? name === "studio-services" : name === "studio-appointments";
  });
  const updatedAt = entries.length ? Math.min(...entries.map((entry) => entry.updatedAt)) : 0;
  const blocked = !online && (!allowed || (Boolean(userId) && !valid));

  return (
    <OfflineContext.Provider value={{ online }}>
      {!online && <div role="status" className="border-b border-border bg-muted px-5 py-2 text-center text-xs text-muted-foreground">
        <WifiOff className="mr-2 inline size-3.5" />
        Sem internet{updatedAt && valid ? ` — última atualização: ${new Date(updatedAt).toLocaleString("pt-BR")}` : " — dados não disponíveis neste aparelho"}
      </div>}
      {storageFailed && online && <p role="status" className="bg-muted px-5 py-2 text-center text-xs text-muted-foreground">Não foi possível preparar a consulta offline neste aparelho.</p>}
      {!ready ? <div className="min-h-screen bg-background" /> : blocked ?
        <p role="status" className="mx-auto max-w-md px-5 py-12 text-center text-sm text-muted-foreground">
          {allowed ? "Conecte-se à internet para confirmar seu acesso." : "Esta área precisa de conexão com a internet."}
        </p> : children}
    </OfflineContext.Provider>
  );
}