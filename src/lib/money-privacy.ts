import { useSyncExternalStore } from "react";

/**
 * Privacidade dos valores financeiros.
 * Apenas visual: nenhum dado é alterado.
 * Estado inicial: valores ocultos.
 */
let hidden = true;
const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot() {
  return hidden;
}

export function toggleMoneyHidden() {
  hidden = !hidden;
  listeners.forEach((listener) => listener());
}

export function useMoneyHidden(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

/** Placeholder usado no lugar do número quando os valores estão ocultos. */
export const MONEY_MASK = "••••";

/** Devolve o texto do valor ou a máscara, conforme o estado atual. */
export function maskMoney(hiddenNow: boolean, text: string): string {
  return hiddenNow ? MONEY_MASK : text;
}
