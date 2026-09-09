import { useEffect } from "react";
import { useBusinessSettings } from "@/hooks/use-business-settings";

export function NuvieTheme() {
  const settings = useBusinessSettings();

  useEffect(() => {
    const root = document.documentElement;
    const color = settings.primaryColor;

    root.style.setProperty("--nuvie-primary", color);

    root.style.setProperty(
      "--nuvie-primary-soft",
      `color-mix(in srgb, ${color} 14%, white)`
    );

    root.style.setProperty(
      "--nuvie-primary-medium",
      `color-mix(in srgb, ${color} 32%, white)`
    );

    root.style.setProperty(
      "--nuvie-primary-strong",
      `color-mix(in srgb, ${color} 82%, black)`
    );

    root.style.setProperty(
      "--nuvie-primary-deep",
      `color-mix(in srgb, ${color} 72%, black)`
    );

    root.style.setProperty("--nuvie-primary-foreground", "#ffffff");
  }, [settings.primaryColor]);

  return null;
}
