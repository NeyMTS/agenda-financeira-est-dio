import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, Check, ImagePlus, Instagram, MessageCircle } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

type BusinessSettings = {
  businessName: string;
  professionalName: string;
  whatsapp: string;
  instagram: string;
  logo: string;
  primaryColor: string;
};

const STORAGE_KEY = "nuvie-business-settings";

const defaultSettings: BusinessSettings = {
  businessName: "Meu negócio",
  professionalName: "",
  whatsapp: "",
  instagram: "",
  logo: "",
  primaryColor: "#B7838E",
};

const colorOptions = [
  { name: "Rosé", value: "#B7838E" },
  { name: "Terracota", value: "#C96F52" },
  { name: "Lavanda", value: "#8E7DBE" },
  { name: "Azul", value: "#6689A6" },
  { name: "Verde", value: "#759B83" },
  { name: "Caramelo", value: "#B08A68" },
];

export const Route = createFileRoute("/_authenticated/configuracoes")({
  component: ConfiguracoesPage,
});

function ConfiguracoesPage() {
  const navigate = useNavigate();

  const [settings, setSettings] =
    useState<BusinessSettings>(defaultSettings);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);

      if (saved) {
        setSettings({
          ...defaultSettings,
          ...JSON.parse(saved),
        });
      }
    } catch {
      // Mantém os valores padrão caso o armazenamento local esteja inválido.
    }
  }, []);

  function updateField<K extends keyof BusinessSettings>(
    field: K,
    value: BusinessSettings[K]
  ) {
    setSettings((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function handleLogoChange(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    const file = event.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Selecione uma imagem válida.");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error("A logo deve ter no máximo 2 MB.");
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      if (typeof reader.result === "string") {
        updateField("logo", reader.result);
      }
    };

    reader.readAsDataURL(file);
  }

  function handleSave() {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(settings)
      );

      toast.success("Configurações salvas.");
    } catch {
      toast.error(
        "Não foi possível salvar. A imagem pode ser muito grande."
      );
    }
  }

  return (
    <AppShell
      title="Configurações"
      subtitle="Personalize seu negócio"
      action={
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate({ to: "/inicio" })}
          className="rounded-full"
        >
          <ArrowLeft className="size-5" />
        </Button>
      }
    >
      <div className="space-y-5">
        <section className="rounded-3xl border border-black/[0.05] bg-white p-5 shadow-sm">
          <div className="mb-5">
            <h2 className="text-base font-semibold text-[#211f20]">
              Identidade
            </h2>

            <p className="mt-1 text-xs leading-5 text-[#817b7d]">
              Essas informações serão usadas para personalizar o aplicativo.
            </p>
          </div>

          <div className="space-y-5">
            <div className="flex flex-col items-center">
              <label
                htmlFor="logo-upload"
                className="group relative flex size-24 cursor-pointer items-center justify-center overflow-hidden rounded-3xl border border-dashed border-black/10 bg-[#faf9f8]"
              >
                {settings.logo ? (
                  <img
                    src={settings.logo}
                    alt="Logo do negócio"
                    className="size-full object-cover"
                  />
                ) : (
                  <div className="flex flex-col items-center gap-1 text-[#aaa5a6]">
                    <ImagePlus className="size-7" />
                    <span className="text-[10px]">
                      Adicionar logo
                    </span>
                  </div>
                )}

                <input
                  id="logo-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleLogoChange}
                />
              </label>

              <p className="mt-2 text-[10px] text-[#aaa5a6]">
                PNG ou JPG • até 2 MB
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="businessName">
                Nome do negócio
              </Label>

              <Input
                id="businessName"
                value={settings.businessName}
                onChange={(event) =>
                  updateField("businessName", event.target.value)
                }
                placeholder="Ex.: Studio Bella"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="professionalName">
                Nome do profissional
              </Label>

              <Input
                id="professionalName"
                value={settings.professionalName}
                onChange={(event) =>
                  updateField(
                    "professionalName",
                    event.target.value
                  )
                }
                placeholder="Ex.: Maria Silva"
              />
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-black/[0.05] bg-white p-5 shadow-sm">
          <div className="mb-5">
            <h2 className="text-base font-semibold text-[#211f20]">
              Aparência
            </h2>

            <p className="mt-1 text-xs leading-5 text-[#817b7d]">
              Escolha a cor principal do seu aplicativo.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {colorOptions.map((color) => {
              const selected =
                settings.primaryColor === color.value;

              return (
                <button
                  key={color.value}
                  type="button"
                  onClick={() =>
                    updateField("primaryColor", color.value)
                  }
                  className="flex flex-col items-center gap-2"
                >
                  <span
                    className="relative flex size-12 items-center justify-center rounded-2xl"
                    style={{ backgroundColor: color.value }}
                  >
                    {selected ? (
                      <Check className="size-5 text-white" />
                    ) : null}
                  </span>

                  <span className="text-[11px] text-[#625d5f]">
                    {color.name}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        <section className="rounded-3xl border border-black/[0.05] bg-white p-5 shadow-sm">
          <div className="mb-5">
            <h2 className="text-base font-semibold text-[#211f20]">
              Contato
            </h2>

            <p className="mt-1 text-xs leading-5 text-[#817b7d]">
              Informações que poderão ser usadas nos próximos recursos.
            </p>
          </div>

          <div className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="whatsapp">
                WhatsApp
              </Label>

              <div className="relative">
                <MessageCircle className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#aaa5a6]" />

                <Input
                  id="whatsapp"
                  value={settings.whatsapp}
                  onChange={(event) =>
                    updateField("whatsapp", event.target.value)
                  }
                  placeholder="(00) 00000-0000"
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="instagram">
                Instagram
              </Label>

              <div className="relative">
                <Instagram className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#aaa5a6]" />

                <Input
                  id="instagram"
                  value={settings.instagram}
                  onChange={(event) =>
                    updateField(
                      "instagram",
                      event.target.value
                    )
                  }
                  placeholder="@seuinstagram"
                  className="pl-10"
                />
              </div>
            </div>
          </div>
        </section>

        <Button
          type="button"
          onClick={handleSave}
          className="h-12 w-full rounded-2xl text-sm font-semibold"
          style={{
            backgroundColor: settings.primaryColor,
          }}
        >
          Salvar configurações
        </Button>
      </div>
    </AppShell>
  );
}
