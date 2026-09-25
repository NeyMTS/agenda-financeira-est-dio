# Painel administrativo do Nuvie

## Objetivo
Criar um painel administrativo integrado ao visual atual, acessível somente à conta principal autorizada, com visão dos usuários e concessão manual de acesso Pro gratuito sem interferir nos pagamentos Kiwify.

## Implementação
- Criar uma estrutura separada de funções administrativas (`user_roles`) e atribuir `ADMIN` somente à conta `neymattos11@gmail.com`, sem qualquer concessão automática para novos usuários.
- Adicionar ao perfil o registro de último acesso e atualizar esse horário somente para usuários autenticados durante o uso normal do aplicativo.
- Estender a assinatura existente apenas com os campos de acesso gratuito administrativo: validade e indicação de acesso permanente. As compras, webhooks, links e dados Kiwify permanecem intactos.
- Fazer o controle central de acesso considerar primeiro uma concessão administrativa válida; quando ela vencer ou for removida, voltar automaticamente ao teste/assinatura normal existente.
- Criar funções de servidor protegidas que validam a sessão e a função `ADMIN` antes de listar usuários ou alterar acesso. Leituras globais e alterações privilegiadas nunca serão executadas diretamente pelo navegador.
- Criar `/admin` com proteção visual e de servidor, resumo de usuários e lista com nome, e-mail, cadastro, plano, status, vencimento e último acesso.
- Oferecer em cada usuário: 7 dias, 14 dias, 30 dias, 90 dias, 6 meses, 1 ano, Permanente e Remover acesso gratuito.
- Substituir a ação isolada do cabeçalho inicial por um menu de três pontos, preservando “Sair” e exibindo “Administração” somente para ADMIN.

## Segurança e regras de dados
- Funções ficam em tabela separada, sem função no perfil e sem permissão para usuários se promoverem.
- Políticas permitem que cada usuário leia apenas sua própria função; operações administrativas exigem validação no servidor.
- O painel falha fechado: sem sessão válida ou sem `ADMIN`, não exibe dados e redireciona para o início.
- A validade gratuita é calculada no servidor. Concessões com prazo partem do momento da concessão; permanente não vence.
- Usuários “ativos” serão os que têm acesso efetivo agora (teste, compra ou gratuidade administrativa); “inativos” são os demais. “PRO” inclui compra válida ou gratuidade administrativa; “grátis” inclui teste ativo e sem acesso pago.

## Validação
- Confirmar a função da conta principal e ausência de promoção automática.
- Testar bloqueio de `/admin` e das funções administrativas para visitante e usuário comum.
- Testar listagem, concessão de cada período, acesso permanente, remoção e retorno às regras normais.
- Confirmar atualização de último acesso, interface em tela pequena e grande, e compilação sem erros.
