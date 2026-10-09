import type { QueryClient, QueryKey } from "@tanstack/react-query";
import { offlineMonths } from "./studio-queries";
import type { Subscription } from "./subscription";

export type OfflineEntry = { key: QueryKey; data: unknown; updatedAt: number };
export type OfflineSnapshot = { userId: string; entries: OfflineEntry[] };
const DB_NAME = "nuvie-offline-v1";

async function database() {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => request.result.createObjectStore("snapshots");
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function operation<T>(mode: IDBTransactionMode, run: (store: IDBObjectStore) => IDBRequest<T>) {
  const db = await database();
  try {
    return await new Promise<T>((resolve, reject) => {
      const transaction = db.transaction("snapshots", mode);
      const request = run(transaction.objectStore("snapshots"));
      transaction.oncomplete = () => resolve(request.result);
      transaction.onerror = () => reject(transaction.error);
      transaction.onabort = () => reject(transaction.error);
    });
  } finally { db.close(); }
}

export async function readOfflineSnapshot(userId: string): Promise<OfflineSnapshot | undefined> {
  const snapshot = await operation("readonly", (store) => store.get("current")) as OfflineSnapshot | undefined;
  return snapshot?.userId === userId ? snapshot : undefined;
}
export function clearOfflineSnapshot() {
  return operation("readwrite", (store) => store.clear());
}
export function saveOfflineSnapshot(snapshot: OfflineSnapshot) {
  return operation("readwrite", (store) => store.put(snapshot, "current"));
}

export function collectOfflineEntries(client: QueryClient): OfflineEntry[] {
  const household = client.getQueryData<{ id: string }>(["household", "current-user"]);
  if (!household) return [];
  const months = offlineMonths();
  return client.getQueryCache().getAll().flatMap((query) => {
    const key = query.queryKey;
    const name = key[0];
    const permitted = (name === "household" || name === "subscription" || name === "business-settings") ||
      ((name === "studio-clients" || name === "studio-services") && key[1] === household.id) ||
      (name === "studio-appointments" && key[1] === household.id && months.some(([start, end]) => key[2] === start && key[3] === end));
    if (!permitted || query.state.data === undefined || !query.state.dataUpdatedAt) return [];
    let data = query.state.data;
    if (name === "business-settings" && data && typeof data === "object") {
      // Signed storage URLs may carry tokens: never persist them.
      data = { ...data, logo: "", logoUrl: "" };
    }
    return [{ key, data, updatedAt: query.state.dataUpdatedAt }];
  });
}

/** Offline reads never extend access or grant an admin-role bypass. */
export function offlineAccessValid(sub: Subscription | null | undefined, now = Date.now()) {
  if (!sub) return false;
  if (sub.admin_access_permanent) return true;
  const future = (date: string | null | undefined) => Boolean(date && new Date(date).getTime() > now);
  if (future(sub.admin_access_expires_at)) return true;
  if (sub.status === "trialing") return future(sub.trial_end);
  return sub.status === "active" && future(sub.access_expires_at ?? sub.subscription_end);
}