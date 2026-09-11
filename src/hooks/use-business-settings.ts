import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const LOGO_BUCKET = "business-logos";

export type BusinessSettings = {
  businessName: string;
  professionalName: string;
  whatsapp: string;
  instagram: string;
  /** Caminho no armazenamento (ou URL/base64 legado). */
  logo: string;
  /** URL pronta para exibição — derivada, não é salva. */
  logoUrl?: string;
  primaryColor: string;
};

export const defaultSettings: BusinessSettings = {
  businessName: "Meu negócio",
  professionalName: "",
  whatsapp: "",
  instagram: "",
  logo: "",
  logoUrl: "",
  primaryColor: "#B7838E",
};

const QUERY_KEY = ["business-settings"];

export async function resolveLogoUrl(logo: string): Promise<string> {
  if (!logo) return "";
  if (logo.startsWith("data:") || logo.startsWith("http")) return logo;

  const { data } = await supabase.storage
    .from(LOGO_BUCKET)
    .createSignedUrl(logo, 60 * 60 * 24 * 7);

  return data?.signedUrl ?? "";
}

async function fetchSettings(): Promise<BusinessSettings> {
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user) return defaultSettings;

  const { data, error } = await supabase
    .from("business_settings")
    .select(
      "business_name, professional_name, whatsapp, instagram, logo, primary_color"
    )
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) throw error;

  if (!data) {
    // Primeira vez: cria a configuração padrão da usuária.
    await supabase
      .from("business_settings")
      .insert({ user_id: user.id })
      .select()
      .maybeSingle();

    return defaultSettings;
  }

  const logo = data.logo ?? "";

  return {
    businessName: data.business_name ?? defaultSettings.businessName,
    professionalName:
      data.professional_name ?? defaultSettings.professionalName,
    whatsapp: data.whatsapp ?? "",
    instagram: data.instagram ?? "",
    logo,
    logoUrl: await resolveLogoUrl(logo),
    primaryColor: data.primary_color ?? defaultSettings.primaryColor,
  };
}

export function useBusinessSettingsQuery() {
  return useQuery({
    queryKey: QUERY_KEY,
    queryFn: fetchSettings,
    staleTime: 10 * 60_000,
    gcTime: 60 * 60_000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });
}

export function useBusinessSettings(): BusinessSettings {
  const { data } = useBusinessSettingsQuery();
  return data ?? defaultSettings;
}

export function useSaveBusinessSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (settings: BusinessSettings) => {
      const { data: userData } = await supabase.auth.getUser();
      const user = userData.user;
      if (!user) throw new Error("Usuária não autenticada.");

      const { error } = await supabase.from("business_settings").upsert(
        {
          user_id: user.id,
          business_name: settings.businessName,
          professional_name: settings.professionalName,
          whatsapp: settings.whatsapp,
          instagram: settings.instagram,
          logo: settings.logo,
          primary_color: settings.primaryColor,
        },
        { onConflict: "user_id" }
      );

      if (error) throw error;
      return settings;
    },
    onSuccess: (settings) => {
      queryClient.setQueryData(QUERY_KEY, settings);
    },
  });
}

export async function uploadBusinessLogo(file: File): Promise<string> {
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user) throw new Error("Usuária não autenticada.");

  const extension =
    file.type === "image/png"
      ? "png"
      : file.type === "image/webp"
        ? "webp"
        : "jpg";

  const path = `${user.id}/logo-${Date.now()}.${extension}`;

  const { error } = await supabase.storage
    .from(LOGO_BUCKET)
    .upload(path, file, { contentType: file.type, upsert: true });

  if (error) throw error;

  return path;
}
