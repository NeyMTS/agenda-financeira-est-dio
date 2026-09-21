# Corrigir o acesso visitante nas telas reais do Nuvie

## Objetivo
Remover completamente a interface fictícia criada para visitantes e permitir que pessoas sem conta naveguem nas mesmas páginas e componentes usados por clientes autenticados, sem consultar nem persistir dados privados.

## Implementação
1. **Remover a camada fictícia**
   - Excluir `VisitorApp` e retirar sua renderização do fluxo principal.
   - Fazer as rotas atuais renderizarem o mesmo conteúdo para visitantes e usuários autenticados.
   - Manter o controle de assinatura somente para usuários autenticados.

2. **Criar um controle central de visitante**
   - Disponibilizar às telas o estado autenticado/visitante sem alterar o fluxo atual de login.
   - Exibir um único diálogo reutilizável com a mensagem “Crie sua conta grátis para salvar suas informações.” e ações para entrar ou criar conta.
   - Guardar temporariamente somente o rascunho da ação em andamento e a página de origem, para retornar ao mesmo fluxo após autenticação; limpar esse rascunho após uso.

3. **Impedir acesso a dados reais**
   - Desativar consultas de clientes, serviços, agenda, financeiro, contas, metas, configurações e assinatura enquanto não houver usuário autenticado.
   - Exibir os estados vazios já existentes nas próprias telas, sem dados fictícios e sem criar conta, residência, trial ou configuração no banco.
   - Usar configurações visuais padrão em memória para o visitante.

4. **Bloquear toda persistência do visitante**
   - Antes de qualquer criação, edição, exclusão, atualização, upload ou associação, interromper a ação e abrir o diálogo de cadastro/login.
   - Cobrir clientes, serviços e categorias, agenda e recorrências, movimentações, recebimentos, contas, metas e configurações.
   - Não executar chamadas de gravação, armazenamento ou RPC para visitantes; as regras atuais de segurança do banco permanecem como proteção adicional.

5. **Retomar o fluxo após autenticação**
   - Após login ou cadastro com sessão ativa, retornar à página original.
   - Restaurar e reabrir o formulário principal que motivou o cadastro para que a pessoa confirme o salvamento já autenticada.
   - Limpar o cache ao mudar entre visitante e usuário autenticado, evitando mistura de estados.

## Validação
- Confirmar que Home, Agenda, Clientes, Serviços, Financeiro e demais páginas são os componentes oficiais, sem `VisitorApp` ou dados fictícios.
- Preencher formulários como visitante e verificar que nenhuma requisição de gravação ocorre.
- Confirmar diálogo de entrar/criar conta em salvar, editar e excluir.
- Confirmar retorno ao fluxo e restauração do rascunho após autenticação.
- Testar um usuário autenticado para garantir que consultas, gravações, assinatura e navegação continuam inalteradas.
- Validar compilação e ausência de erros no navegador.
