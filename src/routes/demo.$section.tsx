import { createFileRoute } from "@tanstack/react-router";
import { DemoApp } from "@/components/DemoApp";

export const Route = createFileRoute("/demo/$section")({
  head: () => ({
    meta: [
      { title: "Demonstração — Nuvie" },
      {
        name: "description",
        content: "Conheça a agenda, os clientes, os serviços e o financeiro do Nuvie com dados fictícios.",
      },
      { property: "og:title", content: "Demonstração — Nuvie" },
      {
        property: "og:description",
        content: "Experimente o Nuvie com segurança antes de criar sua conta.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: DemoApp,
});