import { useEffect, useState } from "react";
import { X, Share, PlusSquare, Smartphone } from "lucide-react";

const DISMISS_KEY = "nuvie:install-banner-dismissed";
const OPEN_EVENT = "nuvie:open-install";

type BIPEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

let deferred: BIPEvent | null = null;

function isStandalone() {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia?.("(display-mode: standalone)").matches ||
    (navigator as unknown as { standalone?: boolean }).standalone === true
  );
}

function isIOS() {
  const ua = navigator.userAgent;
  return (
    /iphone|ipad|ipod/i.test(ua) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
  );
}

export function openInstallNuvie() {
  window.dispatchEvent(new Event(OPEN_EVENT));
}

export function InstallPrompt() {
  const [showBanner, setShowBanner] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    if (isStandalone()) {
      setInstalled(true);
      return;
    }
    const dismissed = localStorage.getItem(DISMISS_KEY) === "1";
    const ios = isIOS();
    if (!dismissed && ios) setShowBanner(true);

    const onBIP = (e: Event) => {
      e.preventDefault();
      deferred = e as BIPEvent;
      if (localStorage.getItem(DISMISS_KEY) !== "1") setShowBanner(true);
    };
    const onInstalled = () => {
      deferred = null;
      setInstalled(true);
      setShowBanner(false);
      localStorage.setItem(DISMISS_KEY, "1");
    };
    const onOpen = () => void install();

    window.addEventListener("beforeinstallprompt", onBIP);
    window.addEventListener("appinstalled", onInstalled);
    window.addEventListener(OPEN_EVENT, onOpen);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBIP);
      window.removeEventListener("appinstalled", onInstalled);
      window.removeEventListener(OPEN_EVENT, onOpen);
    };
  }, []);

  async function install() {
    if (deferred) {
      await deferred.prompt();
      const choice = await deferred.userChoice;
      deferred = null;
      if (choice.outcome === "accepted") {
        setShowBanner(false);
        localStorage.setItem(DISMISS_KEY, "1");
      }
      return;
    }
    setShowTutorial(true);
  }

  function dismiss() {
    localStorage.setItem(DISMISS_KEY, "1");
    setShowBanner(false);
  }

  return (
    <>
      {showBanner && !installed ? (
        <div className="fixed inset-x-0 bottom-[calc(76px+env(safe-area-inset-bottom))] z-20 px-4">
          <div className="mx-auto flex max-w-md items-center gap-3 rounded-2xl border border-black/[0.06] bg-white/95 p-3 shadow-lg backdrop-blur-xl">
            <span
              className="flex size-9 shrink-0 items-center justify-center rounded-xl"
              style={{
                backgroundColor: "var(--nuvie-primary-soft, #f3e9eb)",
                color: "var(--nuvie-primary, #B7838E)",
              }}
            >
              <Smartphone className="size-[18px]" strokeWidth={1.7} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-semibold text-[#211f20]">
                Instale o Nuvie
              </p>
              <p className="truncate text-[11px] text-[#817b7d]">
                Tenha sua agenda sempre à mão.
              </p>
            </div>
            <button
              type="button"
              onClick={() => void install()}
              className="shrink-0 rounded-xl px-3.5 py-2 text-xs font-semibold text-white"
              style={{ backgroundColor: "var(--nuvie-primary, #B7838E)" }}
            >
              Instalar
            </button>
            <button
              type="button"
              aria-label="Fechar"
              onClick={dismiss}
              className="shrink-0 rounded-full p-1 text-[#aaa5a6]"
            >
              <X className="size-4" />
            </button>
          </div>
        </div>
      ) : null}

      {showTutorial ? (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/25 p-4"
          onClick={() => setShowTutorial(false)}
        >
          <div
            className="w-full max-w-md rounded-3xl bg-white p-5 pb-[calc(20px+env(safe-area-inset-bottom))] shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <div className="flex min-w-0 items-center gap-3">
                <span
                  className="flex size-9 shrink-0 items-center justify-center rounded-xl"
                  style={{
                    backgroundColor: "var(--nuvie-primary-soft, #f3e9eb)",
                    color: "var(--nuvie-primary, #B7838E)",
                  }}
                >
                  <Smartphone className="size-[18px]" strokeWidth={1.7} />
                </span>
                <h2 className="text-base font-semibold text-[#211f20]">
                  {installed
                    ? "O Nuvie já está instalado"
                    : isIOS()
                      ? "Instale o Nuvie no seu iPhone"
                      : "Instale o Nuvie"}
                </h2>
              </div>
              <button
                type="button"
                aria-label="Fechar"
                onClick={() => setShowTutorial(false)}
                className="rounded-full p-1 text-[#aaa5a6]"
              >
                <X className="size-4" />
              </button>
            </div>
            {installed ? (
              <p className="text-sm text-[#625d5f]">
                Você já está usando o Nuvie como aplicativo.
              </p>
            ) : isIOS() ? (
              <ol className="space-y-3 text-sm text-[#625d5f]">
                <li className="flex items-center gap-3">
                  <span className="flex size-7 items-center justify-center rounded-full bg-[var(--nuvie-primary-soft,#f3e9eb)] text-xs font-semibold">1</span>
                  <span className="flex items-center gap-1">Toque em Compartilhar <Share className="size-4" /> no Safari.</span>
                </li>
                <li className="flex items-center gap-3">
                  <span className="flex size-7 items-center justify-center rounded-full bg-[var(--nuvie-primary-soft,#f3e9eb)] text-xs font-semibold">2</span>
                  <span className="flex items-center gap-1">Toque em "Adicionar à Tela de Início" <PlusSquare className="size-4" />.</span>
                </li>
                <li className="flex items-center gap-3">
                  <span className="flex size-7 items-center justify-center rounded-full bg-[var(--nuvie-primary-soft,#f3e9eb)] text-xs font-semibold">3</span>
                  <span>Toque em "Adicionar".</span>
                </li>
              </ol>
            ) : (
              <p className="text-sm leading-6 text-[#625d5f]">
                Abra o menu do navegador (⋮) e toque em "Instalar aplicativo"
                ou "Adicionar à tela inicial".
              </p>
            )}
          </div>
        </div>
      ) : null}
    </>
  );
}
