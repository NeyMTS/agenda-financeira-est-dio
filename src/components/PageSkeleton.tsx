/** Placeholder discreto exibido enquanto uma tela carrega. */
export function PageSkeleton() {
  return (
    <div className="mx-auto w-full max-w-md animate-pulse px-5 pt-5">
      <div className="mb-6 flex items-center gap-3">
        <div className="size-10 rounded-xl bg-black/[0.06]" />

        <div className="flex-1 space-y-2">
          <div className="h-2 w-24 rounded-full bg-black/[0.06]" />
          <div className="h-4 w-40 rounded-full bg-black/[0.06]" />
        </div>
      </div>

      <div className="h-32 rounded-[26px] bg-black/[0.05]" />

      <div className="mt-3 grid grid-cols-2 gap-3">
        <div className="h-24 rounded-2xl bg-black/[0.05]" />
        <div className="h-24 rounded-2xl bg-black/[0.05]" />
      </div>
    </div>
  );
}
