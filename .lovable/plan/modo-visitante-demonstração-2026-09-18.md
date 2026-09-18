# Modo visitante/demonstração

## Objetivo
Permitir que uma pessoa conheça o Nuvie antes de criar conta, navegando por uma demonstração segura e somente leitura.

## Implementação
- Adicionar uma entrada “Conhecer demonstração” na tela de acesso, sem alterar login ou cadastro.
- Criar uma área pública de demonstração com o mesmo padrão visual e menu inferior do aplicativo.
- Disponibilizar as visões principais: Início, Agenda, Clientes, Serviços e Financeiro.
- Preencher essas visões apenas com dados fictícios locais, sem consultar dados de usuários nem gravar no banco.
- Manter valores, horários, clientes e serviços de exemplo disponíveis para exploração.
- Interceptar qualquer tentativa de cadastrar, editar, excluir, agendar ou salvar e mostrar: “Crie sua conta grátis para salvar suas informações.” com a ação “Criar conta”.
- Garantir que recarregar ou sair descarte qualquer estado temporário da demonstração.

## Preservação
- Não alterar regras, consultas, permissões ou comportamento das telas autenticadas.
- Não alterar pagamentos, planos, Kiwify, webhook, banco ou autenticação.
- Reutilizar o estilo visual, a marca, a transição e o comportamento fixo do menu existentes.

## Validação
- Testar navegação por todas as telas demonstrativas em desktop e mobile.
- Confirmar que ações exibem o convite de cadastro e que nenhuma solicitação de escrita é enviada ao banco.
- Confirmar que login, cadastro e rotas protegidas continuam funcionando como antes.
