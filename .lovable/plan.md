# Editar bloqueios da agenda

## Alteração
- Adicionar uma ação **Editar** ao lado de **Excluir** em cada bloqueio existente.
- Reabrir o mesmo formulário de bloqueio já usado hoje, preenchido com motivo, data, horário, duração e opção de dia inteiro.
- Alterar o título e o botão de confirmação para deixar claro quando um bloqueio está sendo editado.
- Ao confirmar, atualizar o bloqueio existente em vez de criar outro, inclusive quando data, horário ou duração forem alterados.

## Regras preservadas
- Manter as validações atuais de horário, duração, limite do dia e conflitos, desconsiderando apenas o próprio bloqueio durante a edição.
- Manter o bloqueio de persistência para visitantes e o fluxo normal de usuários autenticados.
- Não alterar layout geral, agendamentos, pagamentos ou outras áreas.

## Validação
- Testar criação, edição de horário/duração, mudança de data, dia inteiro, conflito com outro item e cancelamento do formulário.
