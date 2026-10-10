- [x] Corrigir acesso visitante para usar somente as telas reais, sem dados fictícios ou persistência
# Roadmap

- [ ] Acelerar abertura no celular e compartilhar consultas compatíveis
- [ ] Preparar consulta offline de Agenda, Clientes e Serviços com separação por conta
- [ ] Validar consulta offline, reconexão e proteções; abertura instalada depende de teste publicado

- [x] Corrigir nomes e contagem mensal na aba Serviços dos relatórios
- [x] Abrir WhatsApp pelo card de aniversariantes com a mensagem existente e aviso sem telefone

- [ ] Audit database schema, grants, RLS, auth, household association, and frontend CRUD paths
- [ ] Fix persistence and visible operation errors for clients, services, appointments, and transactions
- [x] Add optional client birthday persistence, display, WhatsApp action, today alert, and upcoming birthdays
- [ ] Fix iPhone PWA zoom behavior and form input sizing
- [ ] Verify database CRUD/select persistence, build, and main browser flows
- [x] Switch billing to single one-off checkout (superseded by Kiwify migration below)
- [x] Migrar pagamento do Asaas para a Kiwify (pagamento único 30/365 dias via webhook)
- [x] Otimizar performance de navegação (sessão local, preload, cache, transição)

- [x] Adicionar mensagens automáticas personalizáveis por usuário
- [x] Implementar painel administrativo seguro com gestão de acesso e último acesso
- [x] Permitir editar e confirmar bloqueios existentes na agenda
- [x] Corrigir edição de bloqueios em horários entre os intervalos da agenda
- [x] PWA instalável com convite discreto, tutorial do iPhone e opção no menu
- [ ] Migrar os dados de larissaandrade1412@hotmail.com do Financeiro Estúdio para o Nuvie Agenda — aguardando exportação da origem
