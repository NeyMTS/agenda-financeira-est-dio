# Nuvie mais rápido no celular e consulta offline

## Escopo desta primeira etapa
Melhorar a abertura e a navegação no Nuvie instalado na tela inicial e permitir consultar Agenda, Clientes e Serviços sem internet, mantendo o visual atual.

Cadastros e alterações offline, com envio posterior, ficam para uma segunda etapa. Nesta primeira etapa, salvar continua exigindo conexão; nenhuma alteração será apresentada como salva sem confirmação online.

## 1. Velocidade no celular
- Medir abertura e troca entre Início, Agenda, Clientes e Serviços, incluindo conexão lenta.
- Reutilizar consultas entre telas somente quando campos, período e filtros forem compatíveis, preservando as atualizações após salvar.
- Separar o carregamento das partes pesadas que só são necessárias ao abrir uma ação, conforme os resultados das medições.
- Manter a fonte atual junto do aplicativo, reduzindo dependências externas sem trocar a tipografia.
- Preservar cache, antecipação de telas, transição curta, acessibilidade e menu inferior fixo.

## 2. Consulta sem internet
- Preparar abertura offline das telas selecionadas no site publicado, depois de uma primeira abertura com internet.
- Guardar no aparelho uma cópia dos próprios clientes, serviços e agendamentos: mês atual, anterior e seguinte. Meses não baixados ficam explicitamente indisponíveis offline.
- Disponibilizar as cópias já baixadas logo na abertura e atualizar quando houver conexão.
- Mostrar um aviso discreto de falta de conexão e a data da última atualização; não mostrar uma lista vazia como se ela tivesse sido consultada.
- Bloquear salvamentos sem internet com aviso claro, sem mudar o comportamento dos usuários conectados.

## Segurança e limites
- Separar cópias por usuário e conta compartilhada; limpar dados locais e memória ao sair ou trocar de conta. Visitantes não recebem cópias de dados privados.
- Não guardar senhas, tokens ou respostas de autenticação no mecanismo de consulta offline.
- Pagamentos, confirmação de acesso, administração e financeiro continuam online. Não alterar Kiwify, links, webhook, preços, regras de acesso ou RLS.
- A cópia offline não concede nem prolonga acesso: usar apenas a última validade confirmada; validade desconhecida ou vencida exige conexão. Revogação remota só pode ser conhecida ao reconectar.
- Bloqueios da agenda e detalhes de serviços já armazenados apenas no aparelho permanecem como hoje; não prometer sincronização entre celulares nesta etapa.
- Limpar dados do navegador pode apagar cópias locais. Elas não substituem os dados online.

## Verificação e entrega
- Comparar tempos e consultas antes/depois, sem prometer um percentual de ganho antes das medições.
- Testar consulta offline, reconexão, atualização das cópias, saída/troca de conta, visitante, validade vencida e tentativa de salvar sem conexão.
- Conferir agenda e menu inferior em tamanhos de celular, sem mudanças no layout.
- Validar erros de compilação e funcionamento online. A abertura offline completa precisa de validação no site publicado; instalação e particularidades de Android/iPhone devem ser conferidas em aparelhos reais.

## Detalhes técnicos
- Usar armazenamento IndexedDB com esquema versionado e lista explícita de consultas permitidas; não persistir todo o cache indiscriminadamente.
- Centralizar consultas compatíveis de agenda, clientes e serviços, mantendo household_id e invalidações existentes.
- Gerar service worker com vite-plugin-pwa, registro único protegido, desabilitado no desenvolvimento, pré-visualização e iframe; incluir desligamento por `?sw=off`.
- Navegações usam NetworkFirst; arquivos estáticos versionados usam CacheFirst. Excluir autenticação, OAuth, APIs, administração e pagamentos do cache de respostas.
- Integrar a geração dos arquivos offline ao resultado real do TanStack Start, verificando caminhos e arquivos emitidos antes de considerar a abertura offline concluída.

## Segunda etapa, não incluída agora
Salvar e editar offline com fila de envio, prevenção de duplicações, dependências entre cadastros e tratamento explícito de conflitos. Será planejada separadamente após a consulta offline ser validada.