# PRD — Programagas.ai MVP Technical Evaluation Fixes

**Source:** Avaliacao Tecnica MVP Programagas (Luiz Henrique Zim Alexandre, 03/03/2026)
**Date:** 2026-03-05

---

## 1. Painel de Programacao — Exibicao de numeros na requisicao

**Problema:** Ao efetuar uma requisicao de programacao, alguns valores numericos sao exibidos com tamanho desproporcional, prejudicando a leitura e usabilidade. Evidencia no PDF mostra numeros como "54.000,0" e "34.000,0" com tamanho excessivo no card de observacoes.

**Impacto:** Poluicao visual, risco de erro operacional por leitura equivocada.

**Analise tecnica:**
- `apps/web/src/features/scheduling-dashboard/components/scheduling-dashboard-columns.tsx` (linha 130-138): Volume usa `font-mono` e `toLocaleString("pt-BR")` — sem controle de tamanho maximo.
- `apps/web/src/components/gas/daily-entry-form.tsx` (linhas 593, 601): QDS/QDP exibidos com `text-3xl font-bold` — classe fixa que nao escala para numeros grandes.
- `apps/web/src/features/gas/index.tsx` (linha 66-71): Dashboard usa `text-2xl font-bold` nos cards de resumo.

**Solucao proposta:**
- Aplicar `text-xl` ou `text-lg` para numeros grandes (>6 digitos) nos cards de resumo.
- Adicionar `truncate` ou `break-all` para evitar overflow em containers pequenos.
- Considerar abreviacao automatica (ex: "54k" ou "54 mil") para valores acima de um limiar.
- Revisar largura minima das colunas da tabela para acomodar numeros formatados em PT-BR.

**Arquivos a modificar:**
- `apps/web/src/features/scheduling-dashboard/components/scheduling-dashboard-columns.tsx`
- `apps/web/src/components/gas/daily-entry-form.tsx`
- `apps/web/src/features/gas/index.tsx`

**Prioridade:** Alta
**Complexidade:** Baixa

---

## 2. Painel de Programacao — Regras de calendario para programacao diaria

**Problema:** O calendario permite criar programacoes apenas ate a data atual. O comportamento esperado e permitir programar a partir da data atual para frente, bloqueando lancamentos em datas passadas (exceto com permissao administrativa).

**Analise tecnica:**
- `apps/web/src/features/scheduling-dashboard/components/scheduling-dashboard-date-picker.tsx` (linha 54): O componente `<Calendar>` NAO possui prop `disabled` — permite navegar para qualquer data livremente.
- `apps/web/src/components/date-picker.tsx` (linha 41-43): O DatePicker generico faz o **oposto** do desejado: `disabled={(date) => date > new Date()}` — bloqueia datas futuras e permite datas passadas.
- `apps/web/src/features/daily-scheduling/components/daily-scheduling-form.tsx` (linha 162-169): Usa `<Input type="date">` sem nenhuma validacao (sem min/max).
- `apps/web/src/features/actual-consumption/components/actual-consumption-form.tsx` (linha 193-202): Idem, sem validacao.

**Solucao proposta:**
- **Scheduling Dashboard date picker:** Adicionar `disabled={(date) => date < startOfToday()}` ao `<Calendar>` para bloquear datas passadas. Adicionar prop `fromDate={new Date()}` para nao mostrar meses anteriores.
- **Daily Scheduling form:** Adicionar `min={format(new Date(), "yyyy-MM-dd")}` ao input de data.
- **Actual Consumption form:** Manter permissao de datas passadas (faz sentido registrar consumo retroativo).
- **Permissao admin:** Adicionar bypass condicional baseado no perfil do usuario (ex: `isAdmin ? undefined : disabledPastDates`).
- Adicionar mensagem de validacao: "Nao e possivel programar para datas passadas."

**Arquivos a modificar:**
- `apps/web/src/features/scheduling-dashboard/components/scheduling-dashboard-date-picker.tsx`
- `apps/web/src/components/date-picker.tsx`
- `apps/web/src/features/daily-scheduling/components/daily-scheduling-form.tsx`

**Prioridade:** Alta
**Complexidade:** Baixa

---

## 3. Programacao mensal com upload em massa

**Problema:** Atualmente so existe programacao diaria/intra-diaria. Recomenda-se aba propria para programacao mensal com envio em massa via planilha Excel. A IA interpretaria o conteudo e criaria as programacoes automaticamente.

**Analise tecnica:** Nao existe nenhuma funcionalidade de upload em massa ou importacao de planilha no codebase atualmente. A infraestrutura de upload existe em `apps/server/src/plugins/better-upload.ts` e pode ser reutilizada.

**Solucao proposta:**
- Criar nova aba "Programacao Mensal" na sidebar (`apps/web/src/components/layout/data/sidebar-data.ts`).
- Criar rota `/gas/monthly-scheduling` com page component.
- Criar template Excel oficial com colunas: Data, Unidade, Volume Programado (m3), Observacoes.
- Implementar upload via drag-and-drop (reutilizar pattern de `contract-upload-drawer.tsx`).
- Endpoint server para parsing de Excel (usando `exceljs`, ja presente no projeto para exports).
- Etapa de pre-visualizacao (preview) mostrando dados importados antes de confirmar.
- Registrar logs de importacao (linhas importadas, erros, motivos).

**Arquivos a criar:**
- `apps/web/src/routes/_authenticated/gas/monthly-scheduling/index.tsx`
- `apps/web/src/features/monthly-scheduling/index.tsx`
- `apps/web/src/features/monthly-scheduling/components/monthly-scheduling-upload.tsx`
- `apps/web/src/features/monthly-scheduling/components/monthly-scheduling-preview.tsx`
- `apps/server/src/modules/gas/monthly-scheduling.controller.ts`

**Arquivos a modificar:**
- `apps/web/src/components/layout/data/sidebar-data.ts`

**Prioridade:** Media
**Complexidade:** Alta

---

## 4. Consumo Real — Upload em massa de consumos

**Problema:** Deve existir opcao de importacao em massa de consumos reais para casos de ausencia de registros (ferias, troca de turno, etc.). A IA deve interpretar Excel e lancar dados automaticamente.

**Analise tecnica:** A pagina de Consumo Real (`apps/web/src/features/actual-consumption/`) possui apenas botao "Registrar Consumo" para entrada manual individual. Nao ha funcionalidade de upload/import.

**Solucao proposta:**
- Adicionar botao "Importar Consumos" ao lado de "Registrar Consumo" em `actual-consumption-primary-buttons.tsx`.
- Criar drawer/dialog de upload com drag-and-drop para Excel.
- Template com colunas: Data, Hora, Unidade, Ponto de Medicao, Consumo (m3), Fonte (medidor/manual/calculado).
- Validacoes: datas duplicadas, lacunas, valores fora de faixa (comparar com QDC contratado).
- Preview antes de confirmar importacao.
- Endpoint server para processamento do Excel.

**Arquivos a criar:**
- `apps/web/src/features/actual-consumption/components/actual-consumption-import-drawer.tsx`
- `apps/web/src/features/actual-consumption/components/actual-consumption-import-preview.tsx`

**Arquivos a modificar:**
- `apps/web/src/features/actual-consumption/components/actual-consumption-primary-buttons.tsx`
- `apps/server/src/modules/gas/gas.controller.ts` (novo endpoint de import)

**Prioridade:** Media
**Complexidade:** Alta

---

## 5. Lancamento Diario — Sobreposicao com Programacao Diaria

**Problema:** A aba "Lancamento Diario" (`/gas/entry`) aparenta se sobrepor a "Programacao Diaria" (`/gas/scheduling`), gerando confusao. Ambas usam o `DailyEntryForm`.

**Analise tecnica:**
- `/gas/entry` (Lancamento Diario): Pagina standalone com seletor de unidade + `DailyEntryForm`.
- `/gas/scheduling` (Programacao Diaria): Tabela read-only de `GasDailyPlan` que redireciona para o Scheduling Dashboard.
- `/gas/scheduling-dashboard` (Painel de Programacao): Dashboard com tabela + drawer que abre `DailyEntryForm`.

**Solucao proposta (opcao A — unificar):**
- Remover a aba "Lancamento Diario" (`/gas/entry`) da sidebar.
- Consolidar toda a entrada de dados no "Painel de Programacao" (`/gas/scheduling-dashboard`).
- Manter "Programacao Diaria" (`/gas/scheduling`) como visao read-only/historico.

**Solucao proposta (opcao B — separar claramente):**
- Renomear "Lancamento Diario" para "Registro de Operacao Diaria" com descricao clara.
- Adicionar textos de ajuda e descricoes em cada aba explicando o proposito.
- Ajustar hierarquia de navegacao (agrupar sub-itens na sidebar).

**Arquivos a modificar:**
- `apps/web/src/components/layout/data/sidebar-data.ts`
- `apps/web/src/routes/_authenticated/gas/entry.tsx` (remover ou renomear)

**Prioridade:** Media
**Complexidade:** Baixa

---

## 6. Relatorios — Tela sem resultados

**Problema:** A tela de relatorios nao apresentou resultados durante os testes, mesmo com diferentes filtros. Para gestao, e critico ter relatorios executivos e comparativos.

**Analise tecnica:** A pagina de relatorios (`apps/web/src/routes/_authenticated/gas/reports.tsx`, ~1600 linhas) ja possui implementacao robusta:
- **Dashboard tab:** 5 graficos (Recharts) — consumo mensal, penalidades, assertividade, comparativo unidades, distribuicao equipamentos.
- **Petrobras tab:** Grafico QDP vs QDR, KPIs, tabela diaria, exportacao Excel.
- **Server endpoints:** `GET /gas/reports/dashboard` (linha 2836) e `GET /gas/reports/petrobras` (linha 1060) em `gas.controller.ts`.
- **Empty state:** Existe (`EmptyChart` component) mas pode nao ser informativo o suficiente.
- **Export:** Ja tem "Exportar Excel" para ambas as tabs.

**Provavel causa do problema:** Os filtros podem estar retornando resultados vazios por falta de dados seed, ou por incompatibilidade entre os filtros (periodo/contrato/unidade). Necessario investigar:
- Se o endpoint retorna dados corretamente com dados validos.
- Se os filtros padrao (periodo inicial) fazem sentido.
- Se a mensagem de empty state orienta o usuario.

**Solucao proposta:**
- Investigar e corrigir queries/filtros no endpoint `GET /gas/reports/dashboard`.
- Melhorar empty states com mensagens orientativas: "Nenhum dado encontrado. Verifique se existem programacoes e consumos registrados para o periodo selecionado."
- Adicionar filtros padrao inteligentes (ex: ultimo mes com dados disponveis).
- Considerar adicionar relatorio executivo padronizado para exportacao PDF (atualmente so Excel).

**Arquivos a investigar/modificar:**
- `apps/server/src/modules/gas/gas.controller.ts` (endpoints de reports)
- `apps/web/src/routes/_authenticated/gas/reports.tsx` (filtros e empty states)

**Prioridade:** Alta
**Complexidade:** Media

---

## 7. Parametros Admin — Icones/botoes nao intuitivos

**Problema:** O icone de disquete nao comunica claramente a acao de "editar e salvar". O icone de ferramenta remete a "configurar/ajustes", nao "editar e salvar".

**Analise tecnica:**
- `alert-thresholds-tab.tsx`, `penalty-formulas-tab.tsx`, `business-rules-tab.tsx`: Usam o icone `Save` (lucide-react, que renderiza como disquete) como botao para **entrar no modo de edicao** — semanticamente incorreto.
- O botao de **confirmar salvar** usa icone `Check` (verde).
- O botao de **cancelar** usa `AlertTriangle` (vermelho) — `AlertTriangle` normalmente indica "aviso/perigo", nao "cancelar".
- Nao ha tooltips (usando `@acme/ui/tooltip`). Apenas `title` HTML no botao de reset.

**Solucao proposta:**
- Substituir icone `Save` (disquete) por `Pencil` ou `PencilLine` para o botao de editar.
- Manter `Check` para confirmar.
- Substituir `AlertTriangle` por `X` para cancelar.
- Adicionar `<Tooltip>` com textos: "Editar", "Salvar", "Cancelar", "Restaurar padrao".
- Considerar adicionar rotulos de texto ao lado dos icones para maior clareza.

**Arquivos a modificar:**
- `apps/web/src/features/admin-parameters/components/alert-thresholds-tab.tsx`
- `apps/web/src/features/admin-parameters/components/penalty-formulas-tab.tsx`
- `apps/web/src/features/admin-parameters/components/business-rules-tab.tsx`

**Prioridade:** Media
**Complexidade:** Baixa

---

## 8. Templates de Contrato — Interface mais amigavel

**Problema:** A area de templates precisa de interface mais amigavel e orientada a jornada do usuario. Esperado: upload do contrato + IA faz leitura e extracao de clausulas.

**Analise tecnica:** Ja existe implementacao robusta de upload + AI extraction:
- `apps/web/src/features/contracts/components/contract-upload-drawer.tsx`: Drag-and-drop para PDF/imagem.
- `apps/web/src/features/contracts/components/contract-extraction-form.tsx`: Formulario de revisao com indicadores de confianca e tooltips.
- `apps/server/src/modules/contract-extraction/contract-extraction.controller.ts`: Usa Claude Sonnet 4.6 para extracao.
- `apps/web/src/features/contracts/components/contracts-dialogs.tsx`: Historico de alteracoes (audit log).

**O que ja funciona:**
- Upload de PDF/imagem com visualizacao inline.
- Extracao AI de clausulas (penalidades, janelas, limites, formulas).
- Campos revisaveis com indicadores de confianca.
- Audit trail (historico de alteracoes).

**O que falta/pode melhorar:**
- Nao ha suporte a **multiplos contratos por unidade/fornecedor com versionamento** explicito (existem audit logs, mas nao versionamento formal).
- O status de processamento durante a extracao poderia ser mais visual (progresso, etapas).
- Nao ha fluxo de arrastar/soltar na listagem de contratos (so no drawer).

**Solucao proposta:**
- Adicionar indicador de progresso durante extracao AI (skeleton/stepper).
- Implementar versionamento formal: ao re-uploadar contrato para mesma unidade, manter versao anterior acessivel.
- Melhorar empty state na listagem de contratos com CTA para upload.

**Arquivos a modificar:**
- `apps/web/src/features/contracts/components/contract-upload-drawer.tsx`
- `apps/web/src/features/contracts/components/contracts-primary-buttons.tsx`
- `apps/web/src/features/contracts/index.tsx`

**Prioridade:** Media
**Complexidade:** Media

---

## 9. Observacoes Gerais — Modulo de penalidades e tarifa

**Problema:** Nao foi identificada aba/funcionalidade para calculo de penalidade. Nao ha referencia ao preco (tarifa) do gas.

**Analise tecnica:** A logica de penalidades **existe no backend** mas nao tem UI dedicada:
- `apps/server/src/modules/gas/gas.service.ts`: `GasCalculationService` com metodos `calculatePvema`, `calculatePveme`, `calculateSobredemanda`, `calculateDailyPenalties`, `calculateMonthlyPenalties`.
- Penalidades aparecem apenas no grafico "Penalidades Acumuladas" dentro da tab Dashboard de Relatorios.
- Tarifa/preco e armazenado por contrato (`basePricePerUnit`, `tusdTariffPerUnit`, `transportCostPerUnit`), nao ha cadastro centralizado com historico.

**Solucao proposta:**
- **Criar pagina dedicada de Penalidades** (`/gas/penalties`) com:
  - Visao diaria e mensal de penalidades calculadas.
  - Breakdown por tipo (PVEMA, PVEME, Sobredemanda).
  - Comparativo com periodos anteriores.
  - Exportacao de relatorio de penalidades.
- **Criar cadastro de tarifa vigente** com:
  - Historico de tarifas por periodo de vigencia.
  - Associacao com contratos.
  - Campo de tarifa visivel no dashboard.
- Adicionar na sidebar como novo item.

**Arquivos a criar:**
- `apps/web/src/routes/_authenticated/gas/penalties/index.tsx`
- `apps/web/src/features/penalties/index.tsx`
- `apps/web/src/features/penalties/components/` (tabela, graficos, filtros)

**Arquivos a modificar:**
- `apps/web/src/components/layout/data/sidebar-data.ts`
- `packages/zen-v3/schema.zmodel` (modelo GasTariffHistory se necessario)

**Prioridade:** Alta
**Complexidade:** Alta

---

## 10. Fluxo sugerido (processo ideal)

O PDF sugere o seguinte fluxo integrado:
1. Upload do contrato -> IA extrai clausulas e parametriza formulas (**JA EXISTE**)
2. Usuario informa tarifa vigente (**PARCIAL** — existe por contrato, falta cadastro centralizado)
3. IA calcula penalidades diarias automaticamente (**BACKEND EXISTE**, falta UI)
4. Dashboard com visao diaria/consolidada + exportacao (**PARCIAL** — existe em Relatorios)

---

## 11. Nice to Have — Chatbot Q&A

**Problema:** Implementar chatbot para perguntas sobre contratos e analise do dashboard.

**Solucao proposta:** Criar componente de chat com AI (reutilizar integracao com Claude ja existente) com contexto dos dados do dashboard e contratos. Implementar como drawer/panel lateral.

**Prioridade:** Baixa
**Complexidade:** Alta

---

## 12. Premium Plus — Programacao direta pelo site

**Problema:** Possibilitar que a programacao seja realizada diretamente pelo site, reduzindo dependencia de canais externos. Necessario verificar viabilidade tecnica/regulatoria com SCGas.

**Prioridade:** Baixa (depende de alinhamento externo)
**Complexidade:** Muito Alta

---

## Resumo de Prioridades

| # | Item | Prioridade | Complexidade | Status Atual |
|---|------|-----------|-------------|-------------|
| 1 | Numeros desproporcionais | Alta | Baixa | Bug |
| 2 | Regras de calendario | Alta | Baixa | Bug |
| 3 | Programacao mensal (bulk) | Media | Alta | Feature nova |
| 4 | Upload consumo em massa | Media | Alta | Feature nova |
| 5 | Sobreposicao Lancamento/Programacao | Media | Baixa | UX |
| 6 | Relatorios sem resultados | Alta | Media | Bug/UX |
| 7 | Icones admin nao intuitivos | Media | Baixa | UX |
| 8 | Templates de contrato UX | Media | Media | Melhoria |
| 9 | Modulo penalidades + tarifa | Alta | Alta | Feature nova |
| 10 | Chatbot Q&A | Baixa | Alta | Nice to have |
| 11 | Programacao direta SCGas | Baixa | Muito Alta | Premium |
