# Pagamento único com PIX e cartão no mesmo checkout

## Verificação (feita antes do plano)

A documentação oficial do Asaas confirma que um único checkout de pagamento avulso (`DETACHED`) pode oferecer PIX **e** cartão na mesma página: os métodos aceitos são `CREDIT_CARD` e `PIX`, e o próprio exemplo oficial de venda avulsa usa os dois juntos. Também confirma que a criação do checkout não confirma pagamento — a confirmação vem pelo webhook.

Ou seja: o modelo que você quer é possível e é exatamente o caminho recomendado pelo Asaas.

## Novo modelo comercial

- Mensal: R$ 29,90, pagamento único, libera 30 dias
- Anual: R$ 299,00, pagamento único, libera 365 dias
- Sem assinatura recorrente
- Um único botão por plano; a cliente escolhe PIX ou cartão dentro da página do Asaas
- O acesso só é liberado quando o Asaas confirma o pagamento

## O que muda no aplicativo

1. **Tela de Planos**: cada plano volta a ter um botão só ("Começar agora" / "Escolher anual"). O botão extra de PIX e os avisos de "sem renovação automática" saem. O texto abaixo do botão passa a indicar "PIX ou cartão • libera 30 dias" (ou 365). Layout, cores e estrutura da tela permanecem iguais.

2. **Criação do checkout**: passa a existir uma única função de checkout, com PIX e cartão habilitados, cobrança avulsa, valor do plano, expiração de 60 minutos e retorno para a tela de Planos. A credencial continua apenas no ambiente seguro.

3. **Confirmação de pagamento**: quando o Asaas avisa que o pagamento foi confirmado, o sistema soma 30 ou 365 dias a partir daquele momento e marca o acesso como ativo. Nada libera acesso sem esse aviso.

4. **Renovação**: como não há cobrança automática, ao final do período a cliente volta para a tela de Planos e paga novamente. O aviso de vencimento próximo já aparece pelo estado da assinatura existente.

## Detalhes técnicos

- `src/lib/asaas.functions.ts`: substituir `createAsaasCheckout` e `createAsaasPixCheckout` por uma única `createAsaasCheckout` com `billingTypes: ["PIX","CREDIT_CARD"]`, `chargeTypes: ["DETACHED"]`, sem bloco `subscription`, `externalReference = userId`, gravando `plan`, `asaas_checkout_id` e `payment_method: null` em `subscriptions`.
- `src/lib/subscription.ts`: manter `PLANS` com `value` e `days`; `cycle` deixa de ser usado no payload (pode permanecer para rótulos).
- `src/routes/api/public/asaas-webhook.ts`: em `PAYMENT_CONFIRMED` / `PAYMENT_RECEIVED` / `CHECKOUT_PAID`, sempre usar a regra de dias (30/365) em vez do cálculo recorrente; gravar `subscription_start`, `subscription_end`, `access_expires_at` e `payment_method` conforme o `billingType` recebido no evento. Manter os eventos de estorno/exclusão como cancelamento e remover a dependência do caminho recorrente.
- `src/routes/_authenticated/planos.tsx`: remover o segundo botão e o segundo estado de carregamento; manter o restante do markup.
- Sem migração de banco: as colunas `payment_method`, `access_expires_at`, `asaas_checkout_id` e `subscription_end` já existem.
- Nada muda em agenda, clientes, serviços, financeiro, autenticação, Secrets ou na URL do webhook.

## Teste

Criar um checkout real de teste contra a API de produção e confirmar que a resposta traz `billingTypes: ["PIX","CREDIT_CARD"]` e um link hospedado pelo Asaas, sem concluir pagamento.
