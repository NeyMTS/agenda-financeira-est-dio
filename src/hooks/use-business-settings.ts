import { useEffect, useState } from "react";

export type BusinessSettings = {
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

export function useBusinessSettings() {
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
      setSettings(defaultSettings);
    }
  }, []);

  return settings;
}
