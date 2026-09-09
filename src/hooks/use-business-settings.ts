import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type BusinessSettings = {
  businessName: string;
  professionalName: string;
  whatsapp: string;
  instagram: string;
  logo: string;
  primaryColor: string;
};

export const defaultSettings: BusinessSettings = {
  businessName: "Meu negócio",
  professionalName: "",
  whatsapp: "",
  instagram: "",
  logo: "",
  primaryColor: "#B7838E",
};

const QUERY_KEY = ["business-settings"];

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

  return {
    businessName: data.business_name ?? defaultSettings.businessName,
    professionalName:
      data.professional_name ?? defaultSettings.professionalName,
    whatsapp: data.whatsapp ?? "",
    instagram: data.instagram ?? "",
    logo: data.logo ?? "",
    primaryColor: data.primary_color ?? defaultSettings.primaryColor,
  };
}

export function useBusinessSettingsQuery() {
  return useQuery({
    queryKey: QUERY_KEY,
    queryFn: fetchSettings,
    staleTime: 60_000,
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
