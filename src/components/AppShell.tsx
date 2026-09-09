import type { ReactNode } from "react";
import { BottomNav } from "./BottomNav";
import { BrandMark } from "./BrandMark";
import { NuvieTheme } from "./NuvieTheme";
import { useBusinessSettings } from "@/hooks/use-business-settings";


export function AppShell({
  title,
  subtitle,
  action,
  topContent,
  children,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  topContent?: ReactNode;
  children: ReactNode;
}) {
  const settings = useBusinessSettings();

  const displayName =
    settings.businessName.trim() &&
    settings.businessName !== "Meu negócio"
      ? settings.businessName
      : "Nuvie";

  return (
    <div
      className="min-h-screen bg-[#faf9f8] text-[#211f20]"
      style={
        {
          "--nuvie-primary": settings.primaryColor,
        } as React.CSSProperties
      }
    >
      <div className="mx-auto min-h-screen w-full max-w-md px-5 pb-32 pt-5">
        {topContent ? (
          <div className="mb-5">{topContent}</div>
        ) : null}

        <header className="mb-6 flex items-center justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3">
            {settings.logoUrl ? (
              <img
                src={settings.logoUrl}
                alt={`Logo de ${displayName}`}
                className="size-10 shrink-0 rounded-xl bg-white object-contain"
              />
            ) : (
              <BrandMark className="size-10 shrink-0 rounded-xl" />
            )}


            <div className="min-w-0">
              <p
                className="mb-1 text-[9px] font-medium uppercase tracking-[0.24em]"
                style={{ color: settings.primaryColor }}
              >
                {displayName}
              </p>

              <h1 className="truncate text-[25px] font-semibold leading-tight tracking-[-0.02em] text-[#211f20]">
                {title}
              </h1>

              {subtitle ? (
                <p className="mt-1 text-xs text-[#817b7d]">
                  {subtitle}
                </p>
              ) : null}
            </div>
          </div>

          {action ? (
            <div className="shrink-0">{action}</div>
          ) : null}
        </header>

        <main className="pb-4">{children}</main>
      </div>

      <BottomNav />
    </div>
  );
}

export function EmptyState({
  text,
}: {
  text: string;
}) {
  return (
    <div className="rounded-2xl border border-black/[0.05] bg-white px-5 py-10 text-center text-sm text-[#817b7d] shadow-sm">
      {text}
    </div>
  );
}
