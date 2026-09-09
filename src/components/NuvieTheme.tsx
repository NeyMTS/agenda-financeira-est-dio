import { useEffect } from "react";
import { useBusinessSettings } from "@/hooks/use-business-settings";

export function NuvieTheme() {
  const settings = useBusinessSettings();

  useEffect(() => {
    const root = document.documentElement;

    root.style.setProperty(
      "--nuvie-primary",
      settings.primaryColor
    );

    root.style.setProperty(
      "--nuvie-primary-soft",
      `${settings.primaryColor}18`
    );

    root.style.setProperty(
      "--nuvie-primary-medium",
      `${settings.primaryColor}33`
    );
  }, [settings.primaryColor]);

  return null;
}
