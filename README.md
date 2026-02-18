# Dynamic Form Builder (Vite + React + TypeScript)

Admin-style dynamic schema builder for:

- Add a field
- Edit a field
- Delete a field
- Save using mocked `POST` (first save) then `PUT` (subsequent saves)

## Tech

- Vite + React + TypeScript
- Node LTS (recommended: Node 22.x LTS)
- Minimal dependencies (React + Vite tooling only)

## Setup

```bash
npm install
```

## Run

```bash
npm run dev
```

## Build

```bash
npm run build
```

## Lighthouse CI Auditing

Run Lighthouse locally with:

```bash
npm run lhci:autorun
```

What this does:

- Builds the production bundle.
- Starts the production preview server on `http://localhost:4173`.
- Runs Lighthouse CI for 3 runs in desktop mode.
- Applies assertion thresholds and fails if any are below target.

Thresholds:

- Performance: `>= 90`
- Accessibility: `>= 95`
- Best Practices: `>= 95`
- SEO: `>= 90`

Reports:

- LHCI uploads reports to filesystem at `./lhci_reports`.
- Temporary runtime artifacts are stored under `.lighthouseci`.

## Mocked Save Behavior (POST vs PUT)

The mock API is in `src/services/schemaApi.ts` and uses an in-memory `Map`.

- First save:
  - No `schemaId` exists in reducer state.
  - Calls `createSchema(fields)` to simulate `POST`.
  - Mock API returns a generated `schemaId`.
- Later saves:
  - `schemaId` now exists.
  - Calls `updateSchema(schemaId, fields)` to simulate `PUT`.

Both calls are Promise-based and delayed with `setTimeout` to mimic network latency.

## Manual Test Checklist

1. Add at least one field and save.
   - Confirm success toast says create/POST.
2. Save again after any edit.
   - Confirm success toast says update/PUT.
3. String validation:
   - Choose `string`, enter a value longer than 100 chars, save should be blocked.
4. Number validation:
   - Choose `number`, set a value greater than 1000, save should be blocked.
5. Boolean handling:
   - Choose `boolean`, toggle Yes/No, and verify JSON value is `true`/`false`.
6. Type switch cleanup:
   - Change a field type and check JSON preview.
   - Confirm irrelevant properties do not remain.
7. Accessibility:
   - Confirm labels exist, inline errors appear, and invalid inputs use `aria-invalid` + `aria-describedby`.
