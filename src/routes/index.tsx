import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/")({
  component: Index,
  head: () => ({
    meta: [
      { title: "Nuvie — Gestão para profissionais da beleza" },
      {
        name: "description",
        content:
          "Agenda, clientes e controle financeiro em um só lugar.",
      },
      { property: "og:title", content: "Nuvie — Gestão para profissionais da beleza" },
      {
        property: "og:description",
        content:
          "Organize sua agenda, seus clientes e seu financeiro em um só lugar.",
      },
    ],
  }),
});

function Index() {
  const navigate = useNavigate();

  useEffect(() => {
    let active = true;

    supabase.auth.getUser().then(({ data, error }) => {
      if (!active) return;
      navigate({
        to: !error && data.user ? "/inicio" : "/auth",
        replace: true,
      });
    });

    return () => {
      active = false;
    };
  }, [navigate]);

  return <div className="min-h-screen bg-background" />;
}
