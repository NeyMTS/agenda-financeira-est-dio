import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";

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
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
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
    void navigate({ to: "/inicio", replace: true });
  }, [navigate]);

  return <div className="min-h-screen bg-background" />;
}
