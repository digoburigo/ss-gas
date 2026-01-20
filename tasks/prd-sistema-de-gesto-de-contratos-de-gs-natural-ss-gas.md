# PRD: Sistema de Gestão de Contratos de Gás Natural (SS-GAS)

## Visão Geral

Sistema para gestão de contratos de gás natural, permitindo interpretação automática de contratos via IA, controle de programação de consumo por unidade, alertas de prazos importantes e análise de assertividade de programação.

---

## Personas

| Persona | Descrição | Permissões |
|---------|-----------|------------|
| **Admin** | Administrador do sistema | Acesso total + configuração de parâmetros de cálculo, templates e regras de negócio |
| **Gestor de Contrato** | Responsável pelos contratos da organização | CRUD de contratos, visualização de todas as unidades, configuração de alertas |
| **Operador de Unidade** | Responsável pela programação diária | Programação de consumo da(s) sua(s) unidade(s), visualização de dashboards |
| **Visualizador** | Consulta apenas | Somente leitura de dashboards e relatórios |

---

## User Stories

### US-001: Cadastro de Organizações
**Como** Admin  
**Quero** cadastrar organizações (empresas clientes)  
**Para** que cada empresa gerencie seus próprios contratos e unidades

**Critérios de Aceite:**
- Formulário com: Nome, CNPJ, endereço, contato principal
- Cada organização é isolada (multi-tenant)
- Admin pode ativar/desativar organizações

---

### US-002: CRUD de Unidades Consumidoras
**Como** Gestor de Contrato  
**Quero** gerenciar unidades consumidoras (pontos de medição)  
**Para** controlar cada ponto de entrega de gás

**Critérios de Aceite:**
- Campos: Nome, código do medidor, endereço, contrato vinculado, responsáveis (e-mails)
- Cada unidade representa 1 ponto de medição
- Usar ZenStack v3 TanStack Query no frontend
- Endpoints ElysiaJS com Kysely para operações complexas
- Validação: não permitir excluir unidade com programações pendentes

---

### US-003: Upload e Extração de Contratos via IA
**Como** Gestor de Contrato  
**Quero** fazer upload de contratos em PDF e extrair dados automaticamente  
**Para** agilizar o cadastro de contratos

**Critérios de Aceite:**
- Upload de PDF/imagem do contrato
- IA extrai campos: fornecedor, volume contratado (DCQ), vigência, preços, flexibilidades (take-or-pay, make-up gas, tolerâncias), cláusulas de reajuste, penalidades
- Exibição lado a lado: PDF original + formulário com dados extraídos
- Usuário DEVE revisar e confirmar todos os campos antes de salvar
- Campos com baixa confiança destacados em amarelo

---

### US-004: Cadastro Manual de Contratos
**Como** Gestor de Contrato  
**Quero** cadastrar/editar contratos manualmente  
**Para** inserir contratos quando a extração automática não for suficiente

**Critérios de Aceite:**
- Formulário completo com todos os campos do contrato
- Seções: Dados básicos, Volumes e flexibilidades, Preços e reajustes, Penalidades, Eventos/datas importantes
- Vincular múltiplas unidades a um contrato
- Histórico de alterações (audit log)

---

### US-005: Configuração de Alertas de Prazos
**Como** Gestor de Contrato  
**Quero** configurar alertas para datas importantes do contrato  
**Para** não perder prazos críticos

**Critérios de Aceite:**
- Eventos padrão: vencimento do contrato, renovação, prazos de programação, datas de reajuste, vencimento take-or-pay
- Eventos customizáveis por contrato (nome + data + recorrência)
- Configurar antecedência do alerta (ex: 30, 15, 7, 1 dia antes)
- Definir responsáveis (e-mails) por alerta

---

### US-006: Disparo de E-mails de Lembrete
**Como** Sistema  
**Quero** enviar e-mails automáticos para os responsáveis  
**Para** garantir que os prazos sejam cumpridos

**Critérios de Aceite:**
- E-mail individual por evento (1 alerta = 1 e-mail)
- Template com: nome do contrato, unidade, evento, data, ação necessária
- Link direto para o contrato/unidade no sistema
- Log de e-mails enviados (data, destinatário, status)

---

### US-007: Programação Diária de Consumo por Unidade
**Como** Operador de Unidade  
**Quero** registrar a programação diária de volume de gás  
**Para** declarar o consumo previsto para a distribuidora

**Critérios de Aceite:**
- Selecionar unidade e data
- Informar volume programado (m³ ou MMBtu)
- Campo para observações
- Validação contra limites do contrato (DCQ, tolerâncias)
- Programação interna + declaração para distribuidora (DCQ)

---

### US-008: Dashboard de Programação Diária
**Como** Gestor de Contrato  
**Quero** visualizar todas as unidades no dashboard  
**Para** ver quem já programou no dia e quem falta

**Critérios de Aceite:**
- Visão do dia atual
- Lista de todas as unidades da organização
- Status por unidade: ✅ Programado | ⏳ Pendente | ⚠️ Atrasado
- Filtros por contrato, unidade, status
- Destaque visual para unidades pendentes

---

### US-009: Registro de Consumo Real
**Como** Operador de Unidade  
**Quero** registrar o consumo real medido  
**Para** comparar com a programação e calcular assertividade

**Critérios de Aceite:**
- Input manual do volume consumido (medição)
- Data e hora da leitura
- Cálculo automático do desvio (programado vs real)

---

### US-010: Taxa de Assertividade de Programação
**Como** Gestor de Contrato  
**Quero** visualizar a taxa de assertividade por unidade/período  
**Para** identificar desvios e melhorar a programação

**Critérios de Aceite:**
- Cálculo: (1 - |Programado - Real| / Programado) × 100%
- Considerar tolerâncias do contrato na análise
- Histórico de desvios por período (diário, semanal, mensal)
- Análise de causa registrável (clima, produção, manutenção, etc.)
- Gráficos de tendência

---

### US-011: Alertas de Desvio de Programação
**Como** Sistema  
**Quero** alertar quando o desvio ultrapassar o threshold configurado  
**Para** que ações corretivas sejam tomadas rapidamente

**Critérios de Aceite:**
- Threshold configurável por Admin (ex: desvio > 10%)
- Alerta automático por e-mail quando threshold excedido
- Indicador visual no dashboard
- Não inclui sugestões automáticas de ação (apenas alerta)

---

### US-012: Painel Administrativo de Parâmetros
**Como** Admin  
**Quero** configurar parâmetros de cálculo do sistema  
**Para** ajustar regras de negócio conforme necessidade

**Critérios de Aceite:**
- Thresholds de alertas (desvio %, antecedência de vencimentos)
- Fórmulas de cálculo de penalidades (take-or-pay, multas)
- Regras de negócio por tipo de contrato
- Templates de contratos com campos padrão
- Campos customizáveis por organização
- Apenas perfil Admin tem acesso

---

### US-013: Gestão de Usuários por Organização
**Como** Admin/Gestor de Contrato  
**Quero** gerenciar usuários e suas permissões  
**Para** controlar quem acessa o que no sistema

**Critérios de Aceite:**
- Convite de usuários por e-mail
- Atribuição de perfil (Admin, Gestor, Operador, Visualizador)
- Operador pode ser vinculado a unidades específicas
- Desativação de usuários (soft delete)

---

### US-014: Histórico e Audit Log
**Como** Admin  
**Quero** visualizar histórico de alterações  
**Para** rastrear quem fez o que no sistema

**Critérios de Aceite:**
- Log de todas as operações de escrita (create, update, delete)
- Registrar: usuário, data/hora, entidade, campo alterado, valor anterior, valor novo
- Filtros por entidade, usuário, período
- Exportação do log

---

## Requisitos Técnicos

### Stack
- **Frontend:** React + TanStack Router + ZenStack v3 TanStack Query
- **Backend:** ElysiaJS + ZenStack v3 (Kysely)
- **Database:** Conforme configurado no projeto (via ZenStack)
- **Auth:** Better-Auth (já configurado)
- **IA/OCR:** Integração com serviço de extração de documentos (a definir)

### Integrações
- Nenhuma integração externa necessária na v1
- Todos os dados inseridos manualmente ou via upload de PDF

### Idioma
- Apenas Português (Brasil)

---

## Modelo de Dados (Principais Entidades)

```
Organization (1) ──── (N) Contract
Organization (1) ──── (N) Unit
Organization (1) ──── (N) User

Contract (1) ──── (N) Unit
Contract (1) ──── (N) ContractAlert
Contract (1) ──── (N) ContractDocument

Unit (1) ──── (N) DailySchedule
Unit (1) ──── (N) ActualConsumption

DailySchedule (1) ──── (1) ActualConsumption (por data)

SystemParameter (configurações globais do Admin)
AuditLog (histórico de alterações)
```

---

## Fora de Escopo (v1)

- Integração com sistemas de medição/telemetria
- Integração com ERP/financeiro
- Integração com API de distribuidoras
- Multi-idioma
- Notificações push/in-app
- Visão semanal/mensal do dashboard
- Sugestões automáticas de plano de ação
- App mobile nativo (usar apenas web responsivo)

---

## Métricas de Sucesso

- 100% dos contratos cadastrados com todos os campos obrigatórios
- Taxa de programação diária completada > 95%
- Zero prazos perdidos por falta de alerta
- Redução do desvio médio de programação em 20% após 3 meses de uso