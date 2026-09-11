# Diagnóstico: lentidão ao trocar de tela

Análise feita no código atual. Nenhuma alteração foi aplicada.

## O que está causando a demora

1. **Verificação de login a cada clique (principal causa).**
   A área protegida do app confere a sessão com o servidor toda vez que você abre outra tela.
   Isso é uma ida e volta pela internet antes de a tela começar a aparecer — normalmente 150–500 ms,
   e bem mais em rede fraca. A tela fica "parada" nesse intervalo.
   (`src/routes/_authenticated/route.tsx`, `beforeLoad` chamando `auth.getUser()`)

2. **Cada tela só começa a ser baixada depois do clique.**
   O código de cada tela é carregado sob demanda e não há pré-carregamento ao tocar/apontar o item do menu.
   (`src/router.tsx` não define `defaultPreload`)

3. **Consultas repetidas ao banco a cada entrada na tela.**
   As telas de agenda, clientes, financeiro, serviços, contas e metas não definem tempo de validade do cache,
   então refazem as mesmas consultas sempre que você volta para elas, mesmo segundos depois.
   Só "conta compartilhada", "configurações do negócio" e "assinatura" têm cache configurado.

4. **Cadeia de consultas em série no início.**
   As telas esperam primeiro a "conta compartilhada" para só então consultar seus dados —
   duas idas ao servidor em sequência em vez de uma.

5. **Assinatura consultada em segundo plano com frequência.**
   Recarrega a cada 60 s e a cada volta do foco da janela, competindo com o carregamento da tela aberta.
   (`src/hooks/use-subscription.ts`)

6. **Sem transição visual.**
   A troca de tela é seca: nada indica que algo está acontecendo, o que faz a espera parecer maior do que é.
   Também não há um esqueleto/placeholder padrão enquanto os dados chegam.

## O que proponho otimizar (sem mudar layout nem funcionalidades)

- Usar a sessão já guardada no dispositivo na verificação de acesso, em vez de perguntar ao servidor a cada clique;
  a revalidação continua acontecendo, só que em segundo plano. Comportamento de segurança preservado
  (as regras do banco continuam protegendo os dados).
- Ativar o pré-carregamento das telas ao encostar/tocar nos itens do menu inferior e nos atalhos.
- Definir tempo de cache (ex.: 30–60 s) para as consultas de cada tela, mantendo atualização em segundo plano,
  para que voltar a uma tela seja instantâneo.
- Reaproveitar o identificador da conta compartilhada já em cache, evitando a espera em cadeia.
- Reduzir a frequência da checagem de assinatura em segundo plano, mantendo a atualização imediata ao voltar o foco
  (para o pagamento confirmado continuar refletindo rápido).
- Adicionar uma transição curta de entrada (fade/slide de ~150 ms) e um esqueleto de carregamento discreto,
  usando as cores e o espaçamento atuais — sem redesenhar nada.

## Detalhes técnicos

- `src/routes/_authenticated/route.tsx`: trocar `supabase.auth.getUser()` por `getSession()` no `beforeLoad`
  (leitura local, sem rede), mantendo o `redirect` para `/auth` quando não houver sessão.
- `src/router.tsx`: adicionar `defaultPreload: "intent"` e `defaultPreloadDelay`; manter `defaultPreloadStaleTime: 0`.
- Telas em `src/routes/_authenticated/*`: adicionar `staleTime` (30–60 s) e `placeholderData: keepPreviousData`
  onde a chave muda por mês/dia, evitando o "flash" de tela vazia.
- `use-household`: aumentar `staleTime`/`gcTime` e reutilizar o valor em cache como `initialData` das telas.
- `use-subscription`: `refetchInterval` de 60 s → 5 min, mantendo `refetchOnWindowFocus`.
- Transição: wrapper leve de animação (CSS, sem nova dependência) em `AppShell` sobre o conteúdo,
  com `prefers-reduced-motion` respeitado.

## Resultado esperado

Abrir outra tela passa a ser praticamente imediato quando os dados já foram vistos, com a rede removida
do caminho crítico do clique e uma transição suave cobrindo o que restar de espera.
