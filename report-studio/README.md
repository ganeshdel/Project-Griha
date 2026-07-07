# Report Studio

A standalone, fully on-device smart report builder. It is **not part of the Griha app** — it just lives in this repository. No build step, no server, no dependencies to install.

## Run it

Any of these work:

- Serve the folder with any static server and open it, e.g. from the repo root:

  ```bash
  python3 -m http.server 5173 --directory .
  # then open http://localhost:5173/report-studio/
  ```

- Or simply double-click `report-studio/index.html` to open it straight from disk (all libraries are bundled in `vendor/`, so it works without internet).

## What it does

1. **Files** — drop any number of `.xlsx`, `.xls`, `.csv`, `.tsv`, `.txt`, `.ods`, `.json` files, plus best-effort table extraction from `.pdf`. Multi-sheet workbooks become one source per sheet. Field types (text / number / date) are auto-detected.
2. **Build** — every field from every file appears in a palette. Drag fields (or click them) onto the canvas to compose report columns; drag chips to reorder. Per-column settings: heading, format (number / currency / percent / date), decimals, alignment, fixed width for PRN.
   - **Cross-file joins**: the first time you use a field from a second file, pick the matching key once (like a VLOOKUP) — after that all its fields join automatically.
   - **Formula columns**: Excel-style expressions with `[Field]` references — arithmetic, `IF`, text and math functions, `LOOKUP(...)`, `SUMIF(...)`, `COUNTMATCH(...)` (self-lookup / duplicate counting on unique fields), and whole-column aggregates like `COLSUM` (e.g. `[Amount] / COLSUM("Amount")`). Live result preview while you type.
   - **Shaping**: filters, multi-level sort, group-by with per-column aggregation (sum, average, min, max, count, count distinct, join), and a totals row.
3. **Export** — Excel, CSV (pick a delimiter), TSV, PDF, PRN fixed-width, TXT, HTML, JSON, XML, Markdown. Excel and PDF outputs can be **encrypted with an open-password** (the file asks for the password when opened).
4. **Saved reports** — save the report *design* (columns, formulas, links, filters — never any data) in the browser for reuse; load fresh files next month and run it again. Designs can be exported/imported as a settings JSON file to share. Lock a saved design with a password (PBKDF2-hashed) so others on the machine can run it but not change or delete it.

## Privacy by design

- All parsing, computation, and file generation happen inside the browser tab.
- File data lives in memory only and vanishes when the tab closes — it is never uploaded and never written anywhere by the tool.
- Only report *designs* (never data) are stored, in this browser's localStorage.
- All libraries are vendored locally in `vendor/`, so the tool makes no network requests for your data and works offline.
- Because no data is transmitted or stored off-device, using it on personal data creates no off-device processing to attract DPA/GDPR obligations.

## Code layout

| File | Purpose |
| --- | --- |
| `index.html` | page shell, loads vendored libraries |
| `engine.js` | pure computation engine (formula parser/evaluator, joins, grouping, totals) — no DOM, unit-testable in Node via `require` |
| `app.js` | UI: upload/parsing, drag-and-drop builder, templates, locking, exports |
| `styles.css` | styling |
| `vendor/` | SheetJS (spreadsheets), pdf.js (PDF input), jsPDF + AutoTable (PDF output), xlsx-populate (encrypted Excel output) |
