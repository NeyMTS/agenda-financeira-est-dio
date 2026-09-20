# Configuração de mensagens automáticas

## Objetivo
Adicionar somente a personalização das mensagens de aniversário e de agendamento, mantendo os textos atuais como padrão e sem criar novos canais de envio.

## Implementação
- Acrescentar ao cadastro individual de configurações os campos `birthday_message` e `appointment_message`, protegidos pelas regras de acesso já existentes: cada pessoa acessa apenas suas próprias configurações.
- Usar como valores padrão os textos que o aplicativo já envia hoje. Contas existentes e novas recebem esses padrões automaticamente; na ausência de personalização, o comportamento permanece igual.
- Adicionar em **Configurações** a seção **Mensagens automáticas**, com dois campos de texto editáveis:
  - Mensagem de aniversário
  - Mensagem de agendamento
- Exibir no próprio texto variáveis simples para preservar os dados dinâmicos atuais, como `{nome}`, `{data}`, `{horario}` e `{servico}`. Ao enviar, o aplicativo troca essas variáveis pelos dados da cliente e do agendamento.
- Salvar as duas mensagens junto das demais configurações individuais já existentes.
- Atualizar somente as ações atuais de WhatsApp de aniversário e agendamento para consumir os textos salvos, mantendo abertura do WhatsApp, destinatário e demais comportamentos intactos.

## Preservação
- Nenhuma mudança em pagamentos, Kiwify, webhook, autenticação, agenda, clientes, serviços, financeiro ou regras de negócio.
- Nenhuma integração nova com WhatsApp ou Instagram.
- Nenhuma alteração no layout geral; apenas a nova opção dentro da tela de Configurações.

## Validação
- Confirmar que os campos abrem preenchidos com os padrões atuais.
- Salvar uma personalização e confirmar seu uso nas ações correspondentes.
- Confirmar que uma conta sem personalização continua usando os textos atuais.
- Confirmar isolamento entre usuários e ausência de erros de compilação.
