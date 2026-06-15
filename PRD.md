# PRD — NúcleoCRM · CRM SaaS Brasileiro

**Versão:** 2.0 (PRD de execução — pronto para desenvolvimento) · **Data:** Junho/2026
**Tipo:** Documento de requisitos orientado a desenvolvimento, escrito para execução com assistentes de IA (vibe coding)
**Como usar este documento:** cada funcionalidade tem um código (RF-XXX = requisito funcional, RN-XXX = regra de negócio, CA-XXX = critério de aceitação, SEC-XXX = segurança, TELA-XX = interface). Ao pedir implementação à IA, referencie os códigos (ex.: "implemente o RF-025 e a TELA-14 respeitando SEC-001 e SEC-010"). Não peça módulos inteiros de uma vez.

---

## ÍNDICE

1. Visão geral e modelo de negócio
2. Stack técnica e decisões de arquitetura
3. Arquitetura multi-tenant e permissões (RBAC)
4. Segurança — política "negado por padrão"
5. Mapa de navegação e inventário de telas (44 telas)
6. Módulos funcionais (requisitos detalhados)
7. Modelo de dados (schema)
8. Contratos de API (endpoints principais)
9. Integrações externas
10. Requisitos não funcionais
11. Sistema de design (tokens v3)
12. Deploy e infraestrutura
13. Planos do SaaS
14. Roadmap de execução (ordem de codificação)
15. Fora de escopo e glossário

---

## 1. Visão Geral e Modelo de Negócio

### 1.1 O que é
CRM completo em modelo SaaS multi-tenant para o mercado brasileiro: interface PT-BR, cobrança em reais, recebimento via Pix/cartão/boleto, atendimento via WhatsApp oficial (Meta Cloud API) com múltiplos atendentes, e — principal diferencial — **fechamento de loop com plataformas de mídia** (envio de conversões offline e criação de públicos para Meta, Google Ads e TikTok).

### 1.2 Problema que resolve
PMEs de serviços (agências, consultorias, escritórios) usam ferramentas desconectadas. O produto unifica funil de vendas, projetos, financeiro, suporte e WhatsApp — e, diferente dos concorrentes, devolve os dados de venda às plataformas de anúncio para otimizar o algoritmo.

### 1.3 Personas
- **Admin do tenant** (dona da agência): vendas, metas, faturamento, contratos, configurações.
- **Vendedor**: trabalha leads no kanban, envia propostas, registra follow-ups.
- **Gerente de projetos**: cria projetos/tarefas, acompanha timers da equipe.
- **Atendente**: responde tickets e conversas de WhatsApp.
- **Financeiro**: faturas, despesas, conciliação.
- **Cliente final** (portal): paga faturas, abre tickets, aprova propostas, assina contratos.
- **Super Admin** (você, dono do SaaS): gere tenants, planos, receita, saúde do sistema.

### 1.4 Modelo de negócio
- Assinatura mensal por plano: **Starter / Pro / Business** (configuráveis sem alterar código).
- Diferenciação por limites (usuários, contatos, armazenamento) e módulos (WhatsApp e Públicos de mídia a partir do Pro).
- Trial de 14 dias sem cartão.
- Cobrança da assinatura via Stripe Billing.

---

## 2. Stack Técnica e Decisões de Arquitetura

> Prioriza maturidade, documentação abundante (IA gera melhor), custo baixo e deploy simples em VPS via Docker.

| Camada | Escolha | Observação |
|---|---|---|
| Framework | Next.js 15+ (App Router) + TypeScript | Full-stack em um repo |
| UI | Tailwind CSS + shadcn/ui | Tematizável (white-label) |
| Banco | PostgreSQL 16 (container) | RLS para multi-tenancy |
| ORM | Drizzle ORM | Migrações versionadas, tipagem forte; escolha única e definitiva |
| Auth | Better Auth (self-hosted) | E-mail/senha + Google, MFA, sessões |
| Cache/filas | Redis + BullMQ | Jobs com retry |
| Tempo real | Socket.IO | Kanban e inbox WhatsApp ao vivo |
| E-mail | Resend (ou SMTP do tenant) | Transacional |
| Pagamento SaaS | Stripe Billing | Planos, trial, dunning |
| Pagamento clientes finais | Asaas (Pix/cartão/boleto) + Stripe/PayPal opcional | Pix obrigatório |
| WhatsApp | Meta WhatsApp Cloud API | Multiatendente oficial |
| Arquivos | MinIO (S3-compatível, container) | Buckets privados por tenant, URLs assinadas |
| Deploy | VPS + EasyPanel + Docker Compose | Git clone/pull; ver seção 12 |
| Proxy/TLS | Traefik (no EasyPanel) | HTTPS automático |
| Erros/uptime | Sentry + Uptime Kuma | Visibilidade desde o dia 1 |
| Validação | Zod | Schemas compartilhados front/back |
| Forms | React Hook Form + Zod | |
| Tabelas/estado | TanStack Query + TanStack Table | Cache de dados e tabelas |
| Gráficos | Recharts ou Chart.js | Conforme seção 11 |

**Estrutura de pastas sugerida (monorepo simples):**
```
/src
  /app            → rotas (App Router): (public), (auth), (app), (portal), (super-admin)
  /modules        → um diretório por módulo de negócio (leads, invoices, ...)
    /<modulo>/{schema.ts, queries.ts, actions.ts, components/, validators.ts}
  /lib            → db, auth, tenant-context, rbac, rate-limit, crypto, queue
  /components/ui  → shadcn/ui + componentes base do design system
  /jobs           → workers BullMQ
/drizzle          → migrações
```

**Regra de ouro do vibe coding:** uma feature por vez = migração + query/action + tela + teste manual roteirizado (o CA da feature). Nunca "construa o módulo inteiro".

---

## 3. Arquitetura Multi-tenant e Permissões

### 3.1 Modelo de isolamento
- Banco único; coluna `tenant_id` em TODAS as tabelas de negócio.
- **Dupla camada de isolamento** (ver SEC-010): RLS no Postgres + escopo de tenant no repositório do ORM.
- Subdomínio por tenant (`empresa.nucleocrm.com.br`); domínio próprio no plano Business.

### 3.2 Requisitos
- **RF-001:** Todo registro de negócio pertence a um tenant; query sem filtro de tenant falha (RLS).
- **RF-002:** Criar tenant gera automaticamente: usuário admin, papéis padrão, estágios de lead padrão, modelos de e-mail padrão, numeração de documentos e configurações iniciais.
- **RF-003:** E-mail de login único globalmente (simplifica recuperação de senha e convites).
- **RF-004:** Painel Super Admin separado (rotas `/super-admin`) para gerir tenants, planos, receita e saúde do sistema (TELA-41 a 44).
- **RF-005:** Papéis padrão: Admin, Gerente, Vendedor, Atendente, Financeiro, Membro. Admin cria papéis personalizados.
- **RF-006:** Permissões por módulo no padrão `ver | ver_próprios | criar | editar | excluir`.
- **RF-007:** Portal do cliente é um tipo de acesso separado (contatos), nunca misturado com staff.
- **CA-001:** Logado no tenant A, nenhuma manipulação de ID/URL acessa dados do tenant B (retorna 404).

---

## 4. Segurança — Política "Negado por Padrão" (obrigatória em todas as fases)

> **Nenhum endpoint nasce aberto.** Tudo exige autenticação + verificação de tenant + verificação de permissão. As exceções públicas são poucas, nomeadas (tabela 4.4) e cada uma tem proteção própria.

### 4.1 Autenticação e sessões
- **SEC-001:** Middleware global: toda rota exige sessão válida; rota pública precisa ser declarada explicitamente numa allowlist para ser acessível.
- **SEC-002:** Senhas com Argon2id; bloqueio progressivo após tentativas; MFA (TOTP) disponível a todos e **obrigatório para admin de tenant e super admin**.
- **SEC-003:** Sessão em cookie `HttpOnly` + `Secure` + `SameSite=Lax`, com expiração e rotação; logout invalida no servidor.
- **SEC-004:** Recuperação de senha e convite com token de uso único, expiração ≤ 1h, sem revelar se o e-mail existe.

### 4.2 Isolamento entre tenants
- **SEC-010:** (a) RLS no Postgres em todas as tabelas com `tenant_id` via variável de sessão por requisição; (b) repositório no ORM injeta `tenant_id` em toda query (proibido query crua em código de feature).
- **SEC-011:** IDs públicos não sequenciais (UUID v7) — impede enumeração.
- **SEC-012:** Teste automatizado cross-tenant obrigatório em todos os módulos: tenant A tenta acessar IDs do tenant B → 404 (nunca 403).
- **SEC-013:** Super admin em rotas separadas, papel próprio, MFA obrigatório, auditoria de cada acesso a dados de tenant (incluindo impersonation).

### 4.3 Autorização (RBAC)
- **SEC-020:** Verificação de permissão no **servidor** em toda ação (esconder botão no front não é controle de acesso).
- **SEC-021:** Contatos do portal usam guard próprio: só enxergam dados do seu cliente e seções permitidas; nunca compartilham sessão/rotas com staff.

### 4.4 Endpoints públicos — lista fechada
| Endpoint | Proteção |
|---|---|
| Login / recuperação de senha | Rate limit por IP + bloqueio progressivo + CAPTCHA após N falhas |
| Cadastro / trial | CAPTCHA + verificação de e-mail |
| Links públicos (fatura, proposta, contrato, pesquisa, pagamento) | Token ≥128 bits na URL, expiração, revogável, rate limit, não listável |
| Webhooks de entrada de leads | Token secreto + rate limit (por webhook e IP) + validação de payload + tamanho máximo |
| Webhooks de gateways e Meta | Verificação de assinatura HMAC + idempotência; sem assinatura válida → descarta e loga |
| Formulário web-to-lead | CAPTCHA invisível + honeypot + rate limit |
| Site público (home, preços) | Estático/público por natureza |

- **SEC-030:** Qualquer rota fora desta tabela que responda sem autenticação é bug crítico.

### 4.5 Proteção da aplicação
- **SEC-040:** Validar TODA entrada com Zod no servidor; queries parametrizadas via ORM (sem SQL concatenado).
- **SEC-041:** Saída escapada (React) + sanitização de HTML rico (sanitize-html) em descrições, propostas, respostas de ticket.
- **SEC-042:** CSRF protegido (token em mutações + SameSite); CORS sem `*` (só domínios do produto).
- **SEC-043:** Headers: CSP estrita, HSTS, X-Content-Type-Options, Referrer-Policy, frame-ancestors.
- **SEC-044:** Uploads: extensão E magic bytes verificados, executáveis bloqueados, tamanho por plano, bucket privado, servido só por URL assinada curta, nome aleatorizado.
- **SEC-045:** Respostas nunca vazam stack trace/SQL/caminhos; erro genérico ao usuário, detalhe no Sentry.
- **SEC-046:** Rate limit global (Redis) por usuário/tenant/IP, mais duro em rotas sensíveis e tokens públicos.
- **SEC-047:** Dependências auditadas em CI; imagem Docker escaneada; processo roda como usuário não-root.

### 4.6 Dados sensíveis
- **SEC-050:** Credenciais de integrações dos tenants (gateways, Meta, Google, TikTok, IMAP, SMTP) criptografadas com AES-256-GCM; chave fora do banco (env do EasyPanel); API retorna só os 4 últimos caracteres.
- **SEC-051:** CPF mascarado por padrão; revelar exige permissão e gera auditoria (RN-271).
- **SEC-052:** Dados a plataformas de mídia sempre hasheados SHA-256 (RN-251); logs nunca contêm senha/token/cartão.
- **SEC-053:** Audit log imutável: login, falha de login, mudança de permissão, exportação, exclusão, acesso super admin, alteração de integração.

### 4.7 Checklist de gate (ao fim de CADA fase)
1. Suíte cross-tenant (SEC-012) 100% verde.
2. Varredura de rotas conferida contra a tabela 4.4.
3. `nmap` externo: só 80/443 (+ SSH restrito).
4. Link público expirado/revogado → 404.
5. Upload de `.exe` renomeado `.jpg` → rejeitado.
6. `.env` fora do repo; backups saindo do VPS.

- **CA-SEC:** Usuário do tenant A não lê/altera/confirma existência de dados do tenant B; anônimo não acessa rota fora da tabela 4.4.

---

## 5. Mapa de Navegação e Inventário de Telas

### 5.1 Áreas da aplicação (route groups)
- `(public)` — site e páginas abertas: home, preços, links públicos.
- `(auth)` — login, cadastro, recuperação de senha.
- `(app)` — painel do staff (autenticado, com sidebar escura).
- `(portal)` — portal do cliente final (sidebar reduzida).
- `(super-admin)` — painel do dono do SaaS (badge "SUPER ADMIN").

### 5.2 Inventário das 44 telas (com rota, área e requisitos ligados)

| # | Tela | Rota | Área | Módulo / RFs |
|---|---|---|---|---|
| 1 | Dashboard | `/dashboard` | app | Vários (visão geral) |
| 2 | Kanban de Leads | `/leads?view=kanban` | app | RF-020..027 |
| 3 | Perfil do Lead | `/leads/[id]` | app | RF-024,026,252 |
| 4 | Inbox WhatsApp | `/whatsapp` | app | RF-120..126 |
| 5 | Detalhe da Fatura | `/invoices/[id]` | app | RF-041..046 |
| 6 | Criar Base (público de mídia) | `/audiences/new` | app | RF-257..259 |
| 7 | Webhook — mapeamento | `/webhooks/[id]` | app | RF-273..283 |
| 8 | Listar Faturas | `/invoices` | app | RF-041 |
| 9 | Login | `/login` | auth | RF-003, SEC-001..004 |
| 10 | Portal — Início | `/portal` | portal | RF-230..232 |
| 11 | Listar Clientes | `/customers` | app | RF-010..014 |
| 12 | Perfil do Cliente | `/customers/[id]` | app | RF-012 |
| 13 | Listar Leads (tabela) | `/leads?view=list` | app | RF-023 |
| 14 | Kanban de Leads (v3) | `/leads` | app | RF-022 |
| 15 | Listar Webhooks | `/webhooks` | app | RF-270..272,281 |
| 16 | Listar Bases | `/audiences` | app | RF-258..260 |
| 17 | Gerenciar Usuários | `/settings/team` | app | RF-005, SEC-020 |
| 18 | Editor de Papéis (RBAC) | `/settings/roles` | app | RF-006 |
| 19 | Config. WhatsApp | `/settings/whatsapp` | app | RF-120,123 |
| 20 | Config. Financeiro | `/settings/billing-config` | app | RF-050,051,220 |
| 21 | Config. Empresa e Tema | `/settings/company` | app | RF-200,220 |
| 22 | Editor de Proposta | `/proposals/[id]/edit` | app | RF-030..034 |
| 23 | Proposta pública (aceite) | `/p/[token]` | public | RF-031,032 |
| 24 | Criar/Editar Fatura | `/invoices/[id]/edit` | app | RF-040..042 |
| 25 | Pagamento público (Pix) | `/pay/[token]` | public | RF-050,052 |
| 26 | Listar Contratos | `/contracts` | app | RF-100..102 |
| 27 | Listar Projetos | `/projects` | app | RF-070 |
| 28 | Detalhe do Projeto | `/projects/[id]` | app | RF-071..074 |
| 29 | Kanban de Tarefas | `/tasks` | app | RF-080..085 |
| 30 | Timesheets + Timer | `/timesheets` | app | RF-090..092 |
| 31 | Listar Tickets | `/tickets` | app | RF-110..115 |
| 32 | Detalhe do Ticket | `/tickets/[id]` | app | RF-111..113 |
| 33 | Relatórios (hub) | `/reports` | app | RF-210..211 |
| 34 | Calendário | `/calendar` | app | RF-140..142 |
| 35 | Painel de Atribuição | `/attribution` | app | RF-254..260 |
| 36 | Config. E-mail | `/settings/email` | app | RF-220 |
| 37 | Campos Personalizados | `/settings/custom-fields` | app | RF-180..182 |
| 38 | Plano e Assinatura | `/settings/subscription` | app | RF-241 |
| 39 | Home (site) | `/` | public | Marketing |
| 40 | Preços (site) | `/precos` | public | RF-240 |
| 41 | Super Admin — Dashboard | `/super-admin` | super-admin | RF-004 |
| 42 | Super Admin — Tenants | `/super-admin/tenants` | super-admin | RF-004 |
| 43 | Super Admin — Planos | `/super-admin/plans` | super-admin | RF-240 |
| 44 | Super Admin — Monitoramento | `/super-admin/monitoring` | super-admin | RNF-004 |

### 5.3 Telas auxiliares (modais/drawers, não são rotas próprias)
- Modal "Fechar venda" (no Perfil do Lead, RF-252) — valor + plataforma de conversão + consentimento LGPD.
- Modal "Convidar membro" (RF-005).
- Modal "Editar modelo de e-mail" (RF-220).
- Drawer "Novo cliente / lead / despesa" (formulários rápidos).
- Estados de onboarding pós-cadastro (checklist de primeiros passos do tenant).

### 5.4 Itens da sidebar do staff (ordem final)
Dashboard · Leads · Clientes · Faturas · Projetos · Tarefas · **(Canais)** WhatsApp · Suporte · **(Mídia)** Públicos · Conversões/Atribuição · Relatórios · Calendário · **(rodapé)** Configurações + perfil.

Configurações é uma sub-navegação: Empresa e Tema · Equipe · Papéis · Financeiro · WhatsApp · E-mail · Campos personalizados · Plano e assinatura · Webhooks.

---

## 6. Módulos Funcionais

> Requisitos completos por módulo. Cada um lista as telas que o realizam.

### 6.1 Clientes e Contatos — TELA-11, 12
- **RF-010:** CRUD de Clientes: razão social, nome fantasia, CNPJ/CPF, IE, endereço (busca por CEP via ViaCEP), telefone, site, moeda padrão, grupos/etiquetas.
- **RF-011:** CRUD de Contatos: nome, e-mail, telefone/WhatsApp, cargo, permissões de portal (ver faturas/projetos, abrir tickets, aprovar propostas/contratos), contato primário obrigatório.
- **RF-012:** Perfil do cliente com abas: Resumo, Contatos, Faturas, Projetos, Propostas, Tickets, Contratos, Notas, Arquivos, Campos extras.
- **RF-013:** Notas (autor+data), arquivos, lembretes vinculados ao cliente.
- **RF-014:** Importação via CSV com mapeamento e relatório de erros.
- **RN-010:** CPF/CNPJ validado por dígito; duplicidade alerta (não bloqueia).
- **CA-010:** Criar cliente, 2 contatos, dar portal a 1; esse contato loga e vê só o permitido.

### 6.2 Leads e Funil — TELA-2, 13, 14, 3
- **RF-020:** CRUD de Leads: nome, empresa, e-mail, telefone, origem, estágio, responsável, valor estimado, etiquetas, descrição.
- **RF-021:** Estágios configuráveis por tenant, reordenáveis.
- **RF-022:** Kanban com drag-and-drop; mudança grava histórico.
- **RF-023:** Visão lista com filtros (estágio, responsável, origem, etiqueta, data) e busca.
- **RF-024:** Atividades do lead: notas, tarefas, lembretes, anexos, propostas, follow-ups.
- **RF-025:** Importação automática de leads por e-mail (IMAP/encaminhamento), job periódico.
- **RF-026:** Conversão de lead em Cliente mantendo histórico.
- **RF-027:** Importação CSV + formulário web-to-lead embutível.
- **RF-252:** Pós-aceite (ou manual): classificar "Lead Qualificado" ou "Cliente Fechado" (este exige valor da venda + moeda). Gera evento de conversão (ver 6.18).
- **RN-020:** Lead "Perdido" exige motivo (lista configurável).
- **RN-021:** Duplicado por e-mail/telefone alerta com link ao existente.
- **CA-020:** Arrastar lead atualiza estágio em tempo real + grava histórico; e-mail novo vira lead em ≤5 min.

### 6.3 Propostas — TELA-22, 23
- **RF-030:** Editor com texto rico, itens (qtd/valor/imposto/desconto), validade, moeda.
- **RF-031:** Envio por e-mail com link público (token); destinatário vê, comenta, aceita/recusa online (aceite registra IP, data, assinatura).
- **RF-032:** Status: Rascunho, Enviada, Aberta, Revisada, Recusada, Aceita, Expirada (auto).
- **RF-033:** Conversão de proposta aceita em Orçamento/Fatura em 1 clique.
- **RF-034:** Modelos reutilizáveis.
- **RN-030:** Proposta aceita fica imutável; alterações geram nova versão.
- **CA-030:** Aceite muda status, notifica vendedor, fica auditável.

### 6.4 Orçamentos e Faturas — TELA-8, 5, 24
- **RF-040:** CRUD de Orçamentos: itens, totais, validade, status, conversão em Fatura.
- **RF-041:** CRUD de Faturas: numeração sequencial com prefixo, emissão/vencimento, condições, parcelamento, recorrência, status (Rascunho/Enviada/Vencida/Parcial/Paga/Cancelada).
- **RF-042:** Faturas recorrentes geradas por job, envio automático opcional.
- **RF-043:** PDF com logo/cores do tenant; e-mail com link público.
- **RF-044:** Catálogo de itens reutilizáveis com imposto padrão.
- **RF-045:** Registro manual de pagamento.
- **RF-046:** Lembretes automáticos de vencimento configuráveis.
- **RN-040:** Fatura com pagamento não é excluída, só cancelada com justificativa.
- **RN-041:** Multa/juros por atraso configuráveis, aplicados no link.
- **CA-040:** Fatura em 2 parcelas; cliente abre link e vê valores corretos; ao vencer vira "Vencida" e dispara lembrete.

### 6.5 Pagamentos (clientes finais) — TELA-25
- **RF-050:** Gateway nacional (Asaas): Pix (QR+copia-e-cola), cartão, boleto, baixa automática via webhook.
- **RF-051:** Stripe e PayPal para moedas estrangeiras (habilitável por tenant).
- **RF-052:** Página pública de pagamento; baixa automática (total/parcial); recibo por e-mail.
- **RF-053:** Conciliação: transações do gateway × faturas, reprocessar webhook.
- **RN-050:** Credenciais nunca no front; chaves por tenant criptografadas (SEC-050).
- **CA-050:** Pix em teste baixa a fatura em ≤1 min após confirmação.

### 6.6 Despesas
- **RF-060:** CRUD: categoria, valor, data, moeda, fornecedor, comprovante, vínculo a cliente/projeto.
- **RF-061:** Despesa faturável → converter em fatura (ou item) com markup opcional.
- **RF-062:** Despesas recorrentes automáticas.
- **RF-063:** Relatório por categoria/projeto/período × receitas.
- **RN-060:** Despesa faturada não edita valor; mostra link da fatura.
- **CA-060:** Despesa R$200 faturável com markup 10% → item R$220.

### 6.7 Projetos — TELA-27, 28
- **RF-070:** CRUD: nome, cliente, membros, datas, status, descrição, progresso.
- **RF-071:** Tipos de faturamento: valor fixo / por hora do projeto / por hora da tarefa.
- **RF-072:** Abas: Visão geral, Tarefas, Timesheets, Marcos, Arquivos, Despesas, Discussões, Notas.
- **RF-073:** "Faturar projeto" gera fatura de horas não faturadas + despesas + valor fixo.
- **RF-074:** Visibilidade no portal configurável por projeto.
- **RN-070:** Hora/timesheet faturado não edita nem refatura.
- **CA-070:** Projeto por hora a R$100; 3h → fatura R$300; horas marcadas faturadas.

### 6.8 Tarefas — TELA-29
- **RF-080:** CRUD: nome, descrição rica, prioridade, status configurável, datas, etiquetas, checklist, anexos, comentários com @menções.
- **RF-081:** Vínculo polimórfico: Projeto, Cliente, Lead, Fatura, Orçamento, Proposta, Contrato, Ticket, Despesa.
- **RF-082:** Múltiplos responsáveis; cada um com seu timer.
- **RF-083:** Seguidores (mesmo sem ser membro do projeto): recebem notificação e veem só a tarefa.
- **RF-084:** Tarefas recorrentes.
- **RF-085:** Visões: lista, kanban por status, "minhas tarefas".
- **RN-080:** Concluir com timer rodando para o timer e registra o tempo.
- **CA-080:** Seguidor não-membro vê/comenta a tarefa, mas não acessa o projeto.

### 6.9 Controle de Tempo — TELA-30
- **RF-090:** Timer start/stop por tarefa e usuário; widget global; registro manual (com permissão).
- **RF-091:** Timesheet do projeto: total por pessoa/tarefa/período; flag faturável.
- **RF-092:** Relatório de horas exportável (CSV).
- **RN-090:** Um usuário não tem dois timers simultâneos.
- **CA-090:** Dois membros na mesma tarefa têm timers independentes.

### 6.10 Contratos — TELA-26
- **RF-100:** CRUD: cliente, tipo, valor, vigência, conteúdo rico com merge fields, anexos.
- **RF-101:** Assinatura online no portal/link (desenhada/digitada, IP+data); ambas as partes.
- **RF-102:** Alertas de expiração; renovação em 1 clique (gera contrato vinculado).
- **RF-103:** Modelos reutilizáveis.
- **RN-100:** Contrato assinado imutável; PDF com hash.
- **CA-100:** Cliente assina por link, staff assina no painel, PDF mostra as duas, contrato bloqueado.

### 6.11 Suporte (Tickets) — TELA-31, 32
- **RF-110:** CRUD: assunto, cliente/contato, departamento, prioridade, status, responsável, etiquetas, anexos.
- **RF-111:** Importação por e-mail (IMAP) por departamento; respostas do cliente entram na thread ([TKT-123]).
- **RF-112:** Respostas predefinidas, nota interna, base de conhecimento.
- **RF-113:** Cliente acompanha pelo portal; e-mail a cada resposta.
- **RF-114:** SLA: primeira resposta e resolução por prioridade, com indicador de estouro.
- **RF-115:** Auto-fechamento de "Respondido" sem retorno após X dias.
- **RN-110:** Reabertura pelo cliente reativa o ticket original em Y dias.
- **CA-110:** E-mail vira ticket em ≤5 min; resposta do atendente chega por e-mail; resposta do cliente entra na thread.

### 6.12 WhatsApp (multiatendente) — TELA-4, 19
- **RF-120:** Onboarding (Embedded Signup Meta), registrar número, sincronizar templates.
- **RF-121:** Inbox compartilhada: tempo real, atribuição, transferência, status, notas internas.
- **RF-122:** Enviar texto/imagem/documento/áudio; receber todos os tipos; entregue/lido.
- **RF-123:** Janela de 24h: fora dela, só templates aprovados (UI bloqueia texto livre).
- **RF-124:** Vínculo automático ao Contato/Lead pelo telefone; criar Lead da conversa.
- **RF-125:** Mensagens rápidas, etiquetas, filtros por fila/atendente/status.
- **RF-126:** Relatório: conversas por atendente, tempo de primeira resposta, volume/dia.
- **RN-120:** Distribuição round-robin opcional entre atendentes online.
- **RN-121:** Limite mensal de conversas iniciadas por plano.
- **CA-120:** A assume conversa, transfere para B com nota interna; cliente não percebe; histórico íntegro.

### 6.13 Lembretes e Notificações
- **RF-130:** Lembrete vinculável a qualquer entidade, com data/hora, descrição, destinatários (um/vários membros).
- **RF-131:** Entrega in-app + e-mail (cada uma ligável); "notificar cliente" quando aplicável.
- **RF-132:** Central de notificações (sino) com lidas e preferências por usuário.
- **CA-130:** Lembrete para 2 membros dispara e-mail + in-app no horário com link à entidade.

### 6.14 Calendário — TELA-34
- **RF-140:** Calendário por usuário (mês/semana/dia) agregando tarefas, vencimentos, validades, expirações, lembretes, marcos, eventos manuais.
- **RF-141:** Respeita permissões; admin vê calendário da equipe.
- **RF-142:** Eventos manuais com convidados e cor; feed iCal (fase 2).
- **CA-140:** Vendedor sem permissão de faturas não vê vencimentos.

### 6.15 Pesquisas (NPS)
- **RF-150:** Construtor: múltipla escolha, checkbox, texto, avaliação/NPS.
- **RF-151:** Envio por e-mail com link público; resposta anônima opcional.
- **RF-152:** Resultados agregados com gráficos + CSV; NPS automático.
- **CA-150:** NPS a 10 contatos; dashboard mostra taxa de resposta e NPS.

### 6.16 Metas
- **RF-160:** Metas por período: receita faturada, pagamentos recebidos, leads convertidos, contratos — por empresa ou membro.
- **RF-161:** Progresso automático + notificação ao atingir/encerrar.
- **CA-160:** Meta "R$50 mil/mês" atualiza conforme faturas pagas.

### 6.17 Anúncios (Comunicados)
- **RF-170:** Para staff, clientes ou ambos; título, conteúdo rico, período.
- **RF-171:** Banner/central; registro de visualização.
- **CA-170:** Anúncio para clientes aparece no portal e some após a data.

### 6.18 Integrações de Mídia — Conversões Offline e Públicos ⭐ — TELA-6, 16, 35
**Captura de atribuição (pré-requisito):**
- **RF-250:** Todo ponto de entrada (web-to-lead, API, webhook, importação) captura: utm_*, gclid, fbclid+fbp/fbc, ttclid, página/referrer → `lead_attribution`, imutável.
- **RF-251:** Conversas Click-to-WhatsApp capturam `ctwa_clid` + referral.

**Qualificação e marcos:**
- **RF-252:** (ver 6.2) classificar qualificado/fechado; fechado exige valor → gera `conversion_events`.
- **RF-253:** Marcos configuráveis: quais eventos viram conversão e com qual nome em cada plataforma; mapear perdido como evento negativo.

**Envio de conversões (server-side):**
- **RF-254:** OAuth por tenant: Meta Conversions API, Google Ads (Offline + Enhanced Conversions), TikTok Events API. Tela de status + envio de teste.
- **RF-255:** Marco atingido → envio automático à plataforma de origem, com valor/moeda/event_time + dados hasheados (SHA-256). Fila com retry, idempotência por event_id, log por evento.
- **RF-256:** Fallback: sem click ID mas com UTM → matching por dados hasheados; origem desconhecida → envio manual.

**Públicos ("Criar base"):**
- **RF-257:** Construtor de segmentos: estágio, qualificação, valor, origem/campanha, etiquetas, datas, motivo de perda, campos personalizados; preview de contagem.
- **RF-258:** Salvar com nome personalizado e enviar como Custom Audience (Meta), Customer Match (Google), Custom Audience (TikTok); hasheado; múltiplas plataformas.
- **RF-259:** Públicos dinâmicos: sync diária (entram/saem conforme filtro); log de cada sync.
- **RF-260:** Painel de atribuição: receita/leads/conversão por origem/campanha/plataforma; ROAS (investimento manual na v1).

**Regras:**
- **RN-250:** Envio exige consentimento LGPD; sem ele, lead fica fora (contagem visível).
- **RN-251:** Dados pessoais só hasheados (lowercase, telefone E.164).
- **RN-252:** Dedup por event_id; alteração de valor gera ajuste quando suportado.
- **RN-253:** Módulo premium (Pro+).
- **CA-250:** Lead com gclid; aceite + "Cliente Fechado R$5.000" → Google recebe conversão em ≤15 min vinculada ao clique.
- **CA-251:** Segmento "clientes >R$1.000" → Meta como "Leads alto valor", match >0; novo cliente entra no dia seguinte.
- **CA-252:** "Perdido — Sem perfil" entra no público dinâmico "Leads desqualificados" nas 3 plataformas.

### 6.19 Webhooks de Entrada — TELA-15, 7
- **RF-270:** Múltiplos webhooks por tenant; URL única `/api/in/{tenant}/{webhook_id}` + token secreto.
- **RF-271:** Config por webhook: estágio inicial, origem, responsável (ou round-robin), etiquetas.
- **RF-272:** Rate limit; aceita JSON e form-urlencoded; tamanho máximo.
- **RF-273:** Modo escuta: captura payload de teste e exibe campos (incl. aninhados).
- **RF-274:** Mapeamento em 2 colunas: campos do payload → campos do CRM (padrão, atribuição, personalizados); auto-sugestão por similaridade.
- **RF-275:** Criar campo personalizado na hora durante o mapeamento.
- **RF-276:** Campos não mapeados: ignorar / guardar em "Dados extras" (padrão) / notificar admin.
- **RF-277:** Transformações: normalizar telefone E.164, formatar CPF/CEP, converter data, caixa, valor fixo, condicional.
- **RF-278:** Campos de atribuição alimentam `lead_attribution` (liga ao 6.18).
- **RF-279:** Dedup por e-mail/telefone: criar/atualizar/nota.
- **RF-280:** Validação mínima (e-mail OU telefone); inválido rejeita com mensagem clara.
- **RF-281:** Log completo de requisições + "Reprocessar" + "Testar com este payload".
- **RF-282:** Resposta JSON com `lead_id` quando criado.
- **RF-283:** Documentação automática por webhook (URL, token, cURL, mapeamento).
- **RN-270:** Alterar mapeamento só afeta requisições futuras (ou reprocessadas).
- **RN-271:** CPF só mapeia para campo marcado sensível (mascarado + auditoria).
- **RN-272:** Webhook pausado responde 200 e guarda payload (não cria lead).
- **RN-273:** Consentimento pode vir no payload; sem ele, fora dos envios de mídia.
- **CA-270:** Payload {nome,email,telefone,cep,cpf,idade}; mapeia idade a campo criado na hora; lead correto no kanban.
- **CA-271:** {nome,telefone,gclid,utm_*}; lead com atribuição; ao fechar venda, conversão sobe ao Google.
- **CA-272:** Campo novo não mapeado vai a "Dados extras" + aviso; após mapear + reprocessar, alimenta a coluna.

### 6.20 Campos Personalizados — TELA-37
- **RF-180:** Para Clientes, Contatos, Leads, Faturas, Orçamentos, Propostas, Projetos, Tarefas, Tickets, Contratos, Despesas, Membros.
- **RF-181:** Tipos: texto, número, data, select, multi-select, checkbox, link, moeda.
- **RF-182:** Opções: obrigatório, visível no portal, visível em PDF, pesquisável/filtrável.
- **CA-180:** Campo "Origem indicação" em Leads aparece no form, lista (com filtro) e CSV.

### 6.21 Mídia e Arquivos
- **RF-190:** Gerenciador por tenant com pastas; pasta pessoal por membro não-admin.
- **RF-191:** Limites por plano; bloqueio de tipos perigosos; preview de imagem/PDF.
- **CA-190:** Membro não-admin vê só sua pasta e compartilhadas; admin vê tudo.

### 6.22 Tema e Marca — TELA-21
- **RF-200:** Por tenant: logo claro/escuro, favicon, cor primária/secundária, CSS extra opcional.
- **RF-201:** Reflete em painel, portal, e-mails e PDFs.
- **CA-200:** Trocar cor/logo atualiza tudo sem deploy.

### 6.23 Relatórios — TELA-33
- **RF-210:** Padrão: vendas, pagamentos, despesas×receita, funil (por estágio/origem), horas, tickets, metas, itens mais vendidos.
- **RF-211:** Filtros por período/cliente/membro; gráficos+tabela; CSV/PDF; relatórios agendados.
- **CA-210:** Conversão por origem no trimestre em %.

### 6.24 Configurações Gerais — TELA-20, 21, 36
- **RF-220:** Por tenant: dados da empresa, localização (fuso/data/moeda BRL), numeração/prefixos, impostos, modelos de e-mail (merge fields) para todos os eventos, assinatura, SMTP opcional, campos do portal, textos jurídicos.
- **RF-221:** Ativar/desativar módulos por tenant (além dos limites do plano).
- **CA-220:** Editar modelo "fatura enviada" muda o próximo envio sem deploy.

### 6.25 Portal do Cliente — TELA-10
- **RF-230:** Login próprio; dashboard com pendências (faturas, propostas/contratos, tickets).
- **RF-231:** Permissões por contato controlam cada seção.
- **RF-232:** Ações: pagar fatura, aceitar proposta/orçamento, assinar contrato, abrir/responder ticket, responder pesquisa, ver projetos liberados, baixar arquivos.

### 6.26 Site Público — TELA-39, 40
- **RF-300:** Home com hero, pilares, diferencial de mídia, CTA de trial.
- **RF-301:** Página de preços com 3 planos, comparação e FAQ; CTA para cadastro/trial.
- **CA-300:** Visitante clica "Começar grátis" → fluxo de cadastro de tenant (trial 14 dias).

### 6.27 Super Admin — TELA-41, 42, 43, 44
- **RF-310:** Dashboard: MRR, tenants ativos, trials, churn, novos, tickets, erros, armazenamento; gráfico MRR 12 meses.
- **RF-311:** Listar tenants: filtros, status, MRR, impersonation seguro (banner + auditoria SEC-013), suspender.
- **RF-312:** Gestão de planos: preços, limites, módulos por plano, config de trial.
- **RF-313:** Monitoramento: status de serviços (app, Postgres, Redis, MinIO, worker), fila BullMQ, erros Sentry, audit log de super admin.
- **RN-310:** Reduzir limites de plano não afeta tenants existentes retroativamente.
- **CA-310:** Suspender tenant inadimplente bloqueia acesso do staff dele mantendo dados.

---

## 7. Modelo de Dados (Schema)

> Convenções: toda tabela de negócio tem `id` (UUID v7), `tenant_id` (FK, indexado), `created_at`, `updated_at`, e `deleted_at` (soft delete) quando aplicável. Toda `tenant_id` entra em índice composto com as colunas mais filtradas. RLS habilitada em todas (SEC-010).

### 7.1 Núcleo e acesso
- **tenants**: name, slug (subdomínio), custom_domain, plan_id, status (trial/active/past_due/suspended), trial_ends_at, settings (jsonb).
- **plans**: name, price_monthly, price_yearly, limits (jsonb: users, contacts, storage_gb, wa_numbers), modules (jsonb de flags), is_public.
- **subscriptions**: tenant_id, plan_id, stripe_subscription_id, status, current_period_end.
- **users**: email (único global), password_hash, name, mfa_secret, mfa_enabled, is_super_admin.
- **staff_members**: tenant_id, user_id, role_id, status (active/invited/inactive), invited_at, last_login_at.
- **roles**: tenant_id, name, is_system (Admin não editável).
- **permissions** / **role_permissions**: module, action (view/view_own/create/edit/delete), role_id.

### 7.2 Clientes, contatos, leads
- **customers**: tenant_id, legal_name, trade_name, doc (cpf/cnpj), doc_type, ie, address (jsonb), phone, website, currency, group_id, owner_id (staff), status.
- **customer_groups**: tenant_id, name.
- **contacts**: tenant_id, customer_id, name, email, phone, role, is_primary, portal_enabled, portal_permissions (jsonb), password_hash (portal).
- **leads**: tenant_id, name, company, email, phone, source_id, stage_id, owner_id, estimated_value, currency, tags (jsonb), description, qualification (none/qualified/won/lost), sale_value, lost_reason, converted_customer_id.
- **lead_stages**: tenant_id, name, order, is_won, is_lost.
- **lead_sources**: tenant_id, name.
- **lead_attribution** (1:1 lead, imutável): lead_id, utm_source/medium/campaign/term/content, gclid, fbclid, fbp, fbc, ttclid, ctwa_clid, landing_page, referrer, consent_lgpd (bool).
- **lead_activity_log**: lead_id, type, payload (jsonb), actor_id, created_at.

### 7.3 Webhooks de entrada
- **inbound_webhooks**: tenant_id, name, token_hash, default_stage_id, default_source_id, default_owner_id (ou round_robin bool), auto_tags (jsonb), dedup_key (email/phone/none), dedup_action (create/update/note), unmapped_policy (ignore/store/notify), status (active/paused), validation (jsonb).
- **webhook_field_mappings**: webhook_id, source_field (path), target_type (lead_field/attribution/custom_field), target_key, transform (jsonb).
- **webhook_request_logs**: webhook_id, raw_payload (jsonb), result (created/updated/note/rejected), reason, lead_id, ip, created_at.

### 7.4 Conversões e públicos (mídia)
- **ad_platform_connections**: tenant_id, platform (meta/google/tiktok), oauth_tokens (encrypted), account_id, status.
- **conversion_events**: tenant_id, lead_id, milestone (qualified/won/custom), value, currency, event_id (único), event_time.
- **conversion_uploads**: conversion_event_id, platform, status (queued/sent/accepted/error), error_reason, sent_at.
- **audiences**: tenant_id, name, filter (jsonb), platforms (jsonb), dynamic (bool), created_by.
- **audience_members**: audience_id, lead_id (snapshot).
- **audience_sync_logs**: audience_id, platform, added, removed, errors, synced_at.

### 7.5 Financeiro
- **estimates** / **estimate_items**: tenant_id, customer_id, number, status, valid_until, totals.
- **invoices**: tenant_id, customer_id, number, prefix, issue_date, due_date, status, payment_terms, recurring (jsonb), parent_invoice_id, totals (subtotal/tax/discount/total/paid).
- **invoice_items**: invoice_id, description, qty, unit_price, tax_rate, total.
- **invoice_payments**: invoice_id, method (pix/card/boleto/manual), amount, gateway_tx_id, status, paid_at.
- **proposals** / **proposal_items**: tenant_id, lead_id/customer_id, number, status, content (jsonb rich), valid_until, public_token, accepted_at, accept_ip, signature.
- **payment_gateways_config**: tenant_id, gateway, credentials (encrypted), mode, active.
- **items_catalog**: tenant_id, name, default_price, default_tax.
- **taxes**: tenant_id, name, rate, default.
- **expenses** / **expense_categories**: tenant_id, category_id, amount, date, currency, vendor, receipt_file, customer_id, project_id, billable, invoiced_id, markup.

### 7.6 Projetos, tarefas, tempo
- **projects**: tenant_id, customer_id, name, billing_type (fixed/project_hour/task_hour), rate, status, start_date, due_date, progress, portal_visibility (jsonb).
- **project_members**: project_id, staff_id, project_role, rate.
- **milestones**: project_id, name, due_date, status, order.
- **tasks**: tenant_id, related_type, related_id, name, description, priority, status, start_date, due_date, tags, recurring (jsonb).
- **task_assignees**: task_id, staff_id.
- **task_followers**: task_id, staff_id.
- **task_checklist_items** / **task_comments**.
- **timesheets**: tenant_id, task_id, staff_id, start_at, end_at, duration_sec, billable, invoice_id (nulo até faturar), rate.

### 7.7 Contratos e suporte
- **contracts** / **contract_signatures**: tenant_id, customer_id, type, value, start_date, end_date, content (jsonb), status, content_hash, signatures (party, name, ip, signed_at, signature_data).
- **tickets**: tenant_id, number, subject, customer_id, contact_id, department_id, priority, status, assignee_id, tags, sla (jsonb: first_response_due, resolution_due).
- **ticket_replies**: ticket_id, author_type (staff/contact), author_id, body, is_internal_note, attachments.
- **departments** / **predefined_replies**.

### 7.8 WhatsApp
- **wa_accounts**: tenant_id, phone_number_id, waba_id, display_number, quality, tokens (encrypted).
- **wa_queues**: tenant_id, name, distribution (round_robin/manual), business_hours (jsonb).
- **wa_conversations**: tenant_id, wa_account_id, queue_id, contact_id/lead_id, assignee_id, status (open/pending/resolved), window_expires_at, ctwa_clid.
- **wa_messages**: conversation_id, direction, type, content, status (sent/delivered/read), wa_message_id, created_at.
- **wa_templates**: tenant_id, name, category, language, status (approved/pending).

### 7.9 Transversais
- **surveys** / **survey_questions** / **survey_responses**.
- **goals**: tenant_id, type, target, period, scope (company/member), member_id, progress.
- **announcements** / **announcement_views**.
- **reminders**: tenant_id, related_type, related_id, remind_at, description, recipients (jsonb), channels (jsonb), notify_customer.
- **notifications**: tenant_id, user_id, type, payload, read_at.
- **custom_fields**: tenant_id, entity, name, type, required, portal_visible, pdf_visible, searchable, sensitive, options (jsonb), order.
- **custom_field_values**: custom_field_id, entity_type, entity_id, value.
- **media_folders** / **media_files**: tenant_id, owner_id, path, name, mime, size, storage_key.
- **calendar_events**: tenant_id, owner_id, title, start, end, type, related_type, related_id, guests, color.
- **email_templates**: tenant_id, event_key, subject, body_html, active.
- **activity_log** (auditoria, imutável): tenant_id, actor_id, action, entity, entity_id, ip, created_at.
- **settings**: tenant_id, key, value (jsonb).

### 7.10 Relações críticas
- `tasks.related_type/related_id` → polimórfico.
- `timesheets.invoice_id` → nulo até faturar (RN-070).
- `lead_attribution` → imutável; alimenta `conversion_events` e `audiences`.
- `custom_field_values` → polimórfico por entidade.
- `wa_conversations` → contact_id OU lead_id (pelo telefone).
- Toda credencial (`*_config`, `*_connections`, `wa_accounts.tokens`) → AES-256-GCM (SEC-050).

---

## 8. Contratos de API (endpoints principais)

> Padrão REST sob `/api`. Toda rota autenticada passa pelo middleware (SEC-001) e injeta `tenant_id` (SEC-010). Mutações usam Server Actions ou route handlers com validação Zod. Lista representativa — não exaustiva.

### 8.1 Convenções
- Respostas: `{ data }` em sucesso; `{ error: { code, message } }` em falha (sem stack — SEC-045).
- Paginação: `?page=&limit=` (limit máx 50), retorno `{ data, total, page }`.
- IDs sempre UUID v7 (SEC-011).
- Idempotência em webhooks via `event_id`/assinatura (SEC-046).

### 8.2 Exemplos por módulo
```
Leads
  GET    /api/leads?stage=&owner=&source=&q=&page=
  POST   /api/leads
  GET    /api/leads/:id
  PATCH  /api/leads/:id
  POST   /api/leads/:id/move-stage      { stageId }      # grava histórico
  POST   /api/leads/:id/qualify         { status }       # RF-252
  POST   /api/leads/:id/close-won       { value, currency, platform?, consent } # gera conversion_event
  POST   /api/leads/:id/convert-customer

Webhook de entrada (PÚBLICO, token)
  POST   /api/in/:tenant/:webhookId     # body livre → mapeia (RF-274) → cria/atualiza lead → {leadId}
  GET    /api/webhooks/:id/logs
  POST   /api/webhooks/:id/replay/:logId

Faturas / Pagamentos
  POST   /api/invoices
  POST   /api/invoices/:id/send
  GET    /api/pay/:token                # PÚBLICO (dados mínimos da fatura)
  POST   /api/pay/:token/pix            # gera QR via Asaas
  POST   /api/webhooks/asaas            # PÚBLICO, assinatura HMAC → baixa fatura

Propostas
  POST   /api/proposals/:id/send
  GET    /api/p/:token                  # PÚBLICO
  POST   /api/p/:token/accept           { signature } # registra IP+data, imutabiliza

Conversões & públicos
  POST   /api/integrations/:platform/oauth/callback
  POST   /api/audiences                 # cria segmento
  GET    /api/audiences/:id/preview     # contagem ao vivo (RF-257)
  POST   /api/audiences/:id/sync        # envia às plataformas
  (job)  conversion-upload              # consome conversion_events → plataformas (RF-255)

WhatsApp
  GET    /api/wa/conversations?queue=&status=&assignee=
  POST   /api/wa/conversations/:id/messages
  POST   /api/wa/conversations/:id/assign       { staffId }
  POST   /api/wa/conversations/:id/transfer     { toStaffId, note }
  POST   /api/webhooks/meta             # PÚBLICO, assinatura → mensagens recebidas
  (ws)   socket: wa:message, lead:moved, notification:new

Super Admin
  GET    /api/super-admin/tenants
  POST   /api/super-admin/tenants/:id/impersonate   # banner + auditoria (SEC-013)
  POST   /api/super-admin/tenants/:id/suspend
  GET    /api/super-admin/metrics       # MRR, churn, etc.
```

---

## 9. Integrações Externas

| Integração | Uso | Notas de implementação |
|---|---|---|
| ViaCEP | Autopreenchimento de endereço | Chamada client-side ou server; sem auth |
| Asaas | Pix/cartão/boleto dos clientes finais | Webhook com assinatura; sandbox primeiro |
| Stripe | Billing do SaaS + pagamentos internacionais | Stripe Billing + Customer Portal |
| PayPal | Pagamentos internacionais (opcional) | Habilitável por tenant |
| Meta WhatsApp Cloud API | Inbox multiatendente | Embedded Signup; App Review (semanas) |
| Meta Conversions API | Conversões offline | Dados hasheados; dedup por event_id |
| Google Ads API | Offline + Enhanced Conversions; Customer Match | Developer token (aprovação); OAuth |
| TikTok Marketing/Events API | Conversões + Custom Audience | OAuth; aprovação |
| Resend / SES | E-mail transacional | Fallback SMTP do tenant |
| Sentry | Erros | self-host ou SaaS |

**Prazos de aprovação (iniciar cedo):** Meta App Review, Google developer token e TikTok Marketing API levam semanas — abrir os cadastros já nas Fases 1–2, em paralelo.

---

## 10. Requisitos Não Funcionais
- **RNF-001 (Segurança):** política da seção 4, obrigatória em toda fase.
- **RNF-002 (LGPD):** consentimento no web-to-lead/webhook; exportação e exclusão de dados sob solicitação; registro de tratamento; DPA nos termos.
- **RNF-003 (Desempenho):** listas paginadas (≤50); kanban e inbox em tempo real (Socket.IO); P95 < 800ms nas telas principais.
- **RNF-004 (Confiabilidade):** webhooks idempotentes; filas com retry; backups diários fora do VPS; healthchecks; monitoramento (TELA-44).
- **RNF-005 (Auditoria):** activity_log para ações sensíveis (SEC-053).
- **RNF-006 (i18n):** PT-BR no lançamento; strings preparadas para EN/ES.
- **RNF-007 (Responsivo):** painel e portal usáveis em celular; inbox WhatsApp otimizada para mobile.
- **RNF-008 (Acessibilidade):** contraste AA, navegação por teclado, labels em formulários.

---

## 11. Sistema de Design (Tokens v3 — aprovado)

> Estes valores são a fonte da verdade do tema. Na Fase 0 viram o arquivo de tokens (Tailwind config + CSS vars). O kit completo de prompts de UI está em `Prompts-Stitch-UI.md` (Bloco DNA v3 + 44 telas).

**Cores**
- Page bg `#F0F2F5` · Card `#FFFFFF` · Sidebar `#0F1117` · Sidebar item ativo `#1C2030`
- Texto: principal `#111827` · secundário `#6B7280` · terciário `#9CA3AF`
- Borda card: `0.5px solid #E5E7EB`
- **Primária (azul) `#2563EB`** — ações, links, progresso, barra ativa
- **Apoio (laranja) `#F97316`** — alertas, metas, urgências, linha de meta
- Badges: azul `#EFF6FF`/`#1D4ED8` · laranja `#FFF7ED`/`#C2410C` · amarelo `#FFFBEB`/`#B45309` · vermelho `#FEF2F2`/`#991B1B` · verde `#ECFDF5`/`#16A34A`

**Tipografia** — Inter. Página 20px/500 · card 13px/500 · corpo 13px/400 · meta 11px · valor financeiro 22px/500 (-0.5px).

**Layout** — sidebar 200px escura com seções agrupadas (Canais/Mídia) e ponto laranja de notificação; topbar 52px branca com saudação+data, botão primário, sino, avatar; grade 8px.

**Componentes** — botão primário azul cantos 8px; cards 12px com borda 0.5px; KPI com ícone 30px + borda-esquerda 3px (azul=crescimento, laranja=atenção); gráfico de barras (históricas `#BFDBFE`, atual `#2563EB`) + linha de meta tracejada laranja; alerta urgente fundo `#FFF7ED` + borda-esquerda laranja; badge não-lidas azul.

**UX** — 1 ação primária por tela; estados vazios sempre desenhados; espaço em branco generoso; dados PT-BR realistas.

**Variações** — Site público (39,40): mesma marca, layout marketing, sem sidebar. Super Admin (41–44): mesma paleta + badge vermelho "SUPER ADMIN" na sidebar.

---

## 12. Deploy e Infraestrutura — VPS + Docker + EasyPanel

**Fluxo:** GitHub (privado) → EasyPanel faz clone/pull e build → containers Docker. Nada fora de container.

### 12.1 Containers
- `app` (Next.js) — único exposto, só via Traefik (HTTPS).
- `worker` (Node + BullMQ) — e-mails, IMAP, webhooks, sync de públicos, conversões, lembretes, faturas recorrentes.
- `postgres` — sem porta publicada (rede interna).
- `redis` — sem porta publicada, com senha.
- `minio` — console fechado; arquivos via URL assinada.
- `uptime-kuma` (opcional) — atrás de auth.

### 12.2 Requisitos
- **RF-290:** Dockerfile multi-stage (imagem final mínima); compose para dev; config equivalente no EasyPanel.
- **RF-291:** Config via env (`.env` nunca commitado; `.env.example` documentado); segredos no EasyPanel.
- **RF-292:** Migrações automáticas no deploy com fail-fast (migração falha → versão antiga continua).
- **RF-293:** Backups diários do Postgres e MinIO enviados para fora do VPS (S3/Backblaze), retenção 30 dias, restauração testada.
- **RF-294:** Healthchecks + restart automático + logs centralizados.
- **RF-295:** Subdomínio wildcard `*.nucleocrm.com.br` → VPS; Traefik resolve tenant e emite TLS.
- **RN-290:** VPS expõe só 80/443 (Traefik) e SSH (chave, porta alterada, fail2ban).
- **CA-290:** push em `main` → rebuild sem downtime; `nmap` externo mostra só 80/443 (+SSH restrito).

---

## 13. Planos do SaaS

| | Starter | Pro | Business |
|---|---|---|---|
| Preço (sugerido) | R$ 97/mês | R$ 297/mês | R$ 697/mês |
| Usuários staff | 3 | 10 | 25 |
| Leads/contatos | 1.000 | 10.000 | Ilimitado |
| Armazenamento | 2 GB | 20 GB | 100 GB |
| WhatsApp multiatendente | — | ✔ 1 número | ✔ 3 números |
| Públicos de mídia + Conversões | — | ✔ | ✔ |
| Contratos c/ assinatura | — | ✔ | ✔ |
| White-label | logo/cores | logo/cores | + domínio próprio |

- **RF-240:** Limites aplicados em tempo real com mensagens de upgrade; trial 14 dias = Pro.
- **RF-241:** Tela "Plano e assinatura" (TELA-38): uso atual, upgrade/downgrade, faturas do SaaS (Stripe Customer Portal).
- Valores e limites editáveis no Super Admin (TELA-43) sem alterar código.

---

## 14. Roadmap de Execução (ordem de codificação)

> Construir o sistema completo em ondas testáveis. Cada fase termina com o checklist de segurança (4.7). Telas referenciadas por número da seção 5.

**Fase 0 — Fundação (2–4 sem):** Docker desde o dia 1 (RF-290..295); esqueleto de segurança (middleware negado-por-padrão, RLS, RBAC, suíte cross-tenant — seção 4); auth + MFA (RF-002,003,005,006); tokens de design v3 (seção 11); layout base do app (sidebar/topbar); Login (TELA-9); configurações de empresa/tema (TELA-21, RF-200,220); campos personalizados (TELA-37, RF-180..182).

**Fase 1 — CRM core:** Clientes/Contatos (TELA-11,12; RF-010..014); Leads + Kanban + Lista + Perfil (TELA-2,13,14,3; RF-020..027); **captura de atribuição (RF-250..251) — não negociável aqui**; **Webhooks de entrada + mapeamento (TELA-15,7; RF-270..283) — principal canal de captação**; Lembretes/Notificações (RF-130..132); Calendário (TELA-34; RF-140..141).

**Fase 2 — Vendas e dinheiro:** Catálogo/impostos; Orçamentos e Faturas (TELA-8,5,24; RF-040..046); Pagamentos Pix/cartão (TELA-25; RF-050..053); Propostas + aceite público (TELA-22,23; RF-030..034) + qualificação/marcos (RF-252..253); Portal do cliente v1 (TELA-10; RF-230..232); Config. financeira (TELA-20).

**Fase 3 — Integrações de Mídia (coração):** OAuth + conversões offline Meta/Google/TikTok (RF-254..256); "Criar base" + públicos dinâmicos (TELA-6,16; RF-257..259); Painel de atribuição (TELA-35; RF-260). *Cadastros de API iniciados nas fases 1–2.*

**Fase 4 — Entrega:** Projetos (TELA-27,28; RF-070..074); Tarefas (TELA-29; RF-080..085); Timesheets (TELA-30; RF-090..092); Despesas (RF-060..063); Contratos (TELA-26; RF-100..103). → **Beta lançável.**

**Fase 5 — Suporte:** Tickets + importação por e-mail (TELA-31,32; RF-110..115); Anúncios (RF-170..171).

**Fase 6 — WhatsApp:** Cloud API completa (TELA-4,19; RF-120..126) + ctwa_clid. *Verificação Meta iniciada na Fase 2.*

**Fase 7 — Crescimento:** Pesquisas (RF-150..152); Metas (RF-160..161); Relatórios (TELA-33; RF-210..211); Mídia avançada (RF-190..191).

**Fase 8 — Monetização e Site:** Site público (TELA-39,40; RF-300..301); planos/limites/Stripe Billing (RF-240..241); Super Admin completo (TELA-41..44; RF-310..313). *Pode ser antecipada para antes da beta paga.*

---

## 15. Fora de Escopo (v1) e Glossário

**Fora de escopo v1:** emissão de NF-e/NFS-e (integrar via parceiro, ex.: Focus NFe), app mobile nativo, workflow builder de automações, IA de atendimento, integração contábil, multi-idioma.

**Glossário:**
- **Tenant** — cada empresa cliente do SaaS (uma conta).
- **RLS** — regra no banco que impede um tenant de ver dados de outro.
- **Webhook** — aviso automático que um serviço externo envia ao sistema.
- **Webhook de entrada** — endpoint que recebe leads de fora, com mapeamento flexível.
- **Conversão offline** — devolver à plataforma de anúncio uma venda ocorrida fora dela.
- **Customer Match / Custom Audience** — público enviado às plataformas para segmentar anúncios.
- **Click ID** (gclid/fbclid/ttclid) — identificador do clique no anúncio; liga a venda à campanha.
- **Janela de 24h (WhatsApp)** — após a última mensagem do cliente, 24h para responder livre; depois, só template aprovado.
- **Impersonation** — super admin acessar a conta de um tenant para suporte (com banner + auditoria).
- **Merge field** — variável em modelo de texto, ex.: {nome_cliente}.