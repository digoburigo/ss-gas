# Ralph Progress Log

This file tracks progress across iterations. Agents update this file
after each iteration and it's included in prompts for context.

## Codebase Patterns (Study These First)

- **ZenStack v3 type errors**: The `CreateWithFKInput` type errors for `useCreate` mutations are pre-existing across the codebase. The code works at runtime despite these TS errors. Don't try to fix them.
- **Dialog pattern**: Contract features use a provider context (`ContractsProvider`) with `useDialogState` hook for managing dialog types. Add new dialog types to `ContractsDialogType` union, handle in `ContractsDialogs` component.
- **Row actions pattern**: Use `DropdownMenu` with `setCurrentRow` + `setOpen` to trigger dialogs from table rows.
- **ESLint config broken**: `@repo/eslint-config` package not found - ESLint/Ultracite fix commands fail. Biome checks work fine.
- **DB not running locally**: `db:push` fails (localhost:5432 unreachable). Schema generation (`db:generate`) works without DB.
- **Vercel AI SDK v6 API**: Uses `maxOutputTokens` (not `maxTokens`) and `toTextStreamResponse()` (not `toDataStreamResponse()`). The text stream returns plain text chunks, not SSE data events.
- **Elysia streaming**: Elysia supports returning `Response` objects directly from handlers, so `streamText().toTextStreamResponse()` works seamlessly.
- **Gas layout wrapper**: `apps/web/src/routes/_authenticated/gas/layout.tsx` wraps all `/gas/*` routes - good place for cross-cutting gas UI like the chatbot widget.

---

## 2026-03-05 - US-021
- Implemented contract versioning with re-upload support
- Files changed:
  - `packages/zen-v3/schema.zmodel` - Added `GasContractVersion` model with version number, data snapshot, upload metadata
  - `packages/zen-v3/src/zenstack/` - Regenerated schema, input, models files
  - `apps/web/src/features/contracts/components/contracts-provider.tsx` - Added `re-upload` and `view-versions` dialog types
  - `apps/web/src/features/contracts/components/contract-upload-drawer.tsx` - Added `existingContract` prop for re-upload mode, version creation on both new upload and re-upload
  - `apps/web/src/features/contracts/components/data-table-row-actions.tsx` - Added "Re-upload" and "Versoes" menu items
  - `apps/web/src/features/contracts/components/contracts-dialogs.tsx` - Added version history dialog with detail view, re-upload drawer integration
- **Learnings:**
  - ZenStack v3 uses `CreateWithFKInput` types that have pre-existing TS errors - don't try to fix
  - Contract upload drawer accepts `existingContract` prop to switch between create and version-update modes
  - Version snapshots stored as JSON strings in `dataSnapshot` field for flexibility
---

## 2026-03-05 - US-022
- Improved contracts listing empty state with clear CTA, AI extraction explanation, and upload button
- Files changed:
  - `apps/web/src/features/contracts/components/contracts-table.tsx` - Added rich empty state with icon, description of AI extraction, and upload button; differentiates between "no contracts" and "no results from filter"
- **Learnings:**
  - Empty states across codebase all use simple text - this is the first rich empty state
  - `useContracts()` hook provides `setOpen` for triggering dialogs from anywhere within `ContractsProvider`
  - Pre-existing TS errors in contracts-table.tsx: `className`/`thClassName`/`tdClassName` on ColumnMeta type
---

## 2026-03-05 - US-024
- Created feasibility study document for direct SCGas scheduling integration
- Files changed:
  - `docs/feasibility-scgas-integration.md` - New document covering: SCGas API availability, authentication requirements, data format requirements, regulatory considerations (ANP, LGPD), technical architecture proposal, risk assessment with mitigation strategies, and go/no-go recommendation
- **Learnings:**
  - Documentation-only stories don't require typecheck/lint since no code changed
  - Project had no `docs/` directory - created it for this and future documentation
  - SCGas integration is blocked by external dependency (API availability from distributor)
---

## 2026-03-05 - US-023
- Implemented Chatbot Q&A - contract and dashboard assistant
- Files changed:
  - `apps/server/src/modules/gas-chat/gas-chat.controller.ts` - New streaming chat endpoint using Vercel AI SDK v6 with `@ai-sdk/gateway`. Builds context from active contracts, units, real consumption, daily plans, and deviations.
  - `apps/server/src/modules/gas-chat/index.ts` - Module export
  - `apps/server/src/index.ts` - Registered `gasChatController`
  - `apps/web/src/features/gas-chat/components/gas-chat-widget.tsx` - Floating chat button + chat panel with streaming responses, quick-start suggestions, route link detection
  - `apps/web/src/routes/_authenticated/gas/layout.tsx` - Added `GasChatWidget` to gas layout wrapper
- **Learnings:**
  - Vercel AI SDK v6 uses `maxOutputTokens` and `toTextStreamResponse()` - different from earlier versions
  - `@ai-sdk/gateway` with `createGateway` is the pattern for AI model access in this codebase
  - Text stream response returns plain text chunks - simpler to parse on frontend than SSE data events
  - Gas layout.tsx is the right place for cross-cutting gas page UI (wraps all /gas/* routes)
  - Existing `features/chats` is a user-to-user messaging feature, not related to AI chatbot
---

