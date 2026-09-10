import { Eye, EyeOff } from "lucide-react";
import { toggleMoneyHidden, useMoneyHidden } from "@/lib/money-privacy";

/** Botão de olho para ocultar/mostrar os valores financeiros. */
export function MoneyToggle() {
  const hidden = useMoneyHidden();

  return (
    <button
      type="button"
      onClick={toggleMoneyHidden}
      className="flex size-10 items-center justify-center rounded-full border border-black/[0.06] bg-white text-[#817b7d]"
      aria-label={hidden ? "Mostrar valores" : "Ocultar valores"}
      aria-pressed={!hidden}
    >
      {hidden ? (
        <EyeOff className="size-4" strokeWidth={1.7} />
      ) : (
        <Eye className="size-4" strokeWidth={1.7} />
      )}
    </button>
  );
}
