# Report Studio

A standalone, fully on-device smart report builder. It is **not part of the Griha app** — it just lives in this repository. No build step, no server, no dependencies to install.

## Run it

Any of these work:

- **Easiest — one file**: download `ReportStudio.html` and double-click it. The entire tool (styles, engine, every library) is inside that single file, so it runs from anywhere — a laptop, a USB stick, a shared drive — with no internet and nothing to install. Regenerate it after code changes with `node build-single-file.js`.

- Serve the folder with any static server and open it, e.g. from the repo root:

  ```bash
  python3 -m http.server 5173 --directory .
  # then open http://localhost:5173/report-studio/
  ```

- Or double-click `report-studio/index.html` to open the folder version straight from disk (all libraries are bundled in `vendor/`, so it also works without internet).

## What it does

0. **Home** — a personalisable start screen ("Welcome, ⟨your name⟩ — what do you want to do today?") with large task cards: Build a report, Convert files, PDF tools, Transform data, Open a saved report. The 🎨 Personalise panel sets your name, accent colour, background theme, or a personal photo wallpaper (shrunk and stored only in this browser).
1. **Files** — drop any number of `.xlsx`, `.xls`, `.csv`, `.tsv`, `.txt`, `.ods`, `.json` files, plus best-effort table extraction from `.pdf`. Multi-sheet workbooks become one source per sheet. Field types (text / number / date) are auto-detected. If an import contains blank or duplicate rows, the tool asks whether to remove them — it never cleans silently.
2. **Build** — every field from every file appears in a palette. Drag fields (or click them) onto the canvas to compose report columns; drag chips to reorder. Per-column settings: heading, format (number / currency / percent / date), decimals, alignment, fixed width for PRN.
   - **Cross-file joins**: the first time you use a field from a second file, pick the matching key once (like a VLOOKUP) — after that all its fields join automatically.
   - **Formula columns**: Excel-style expressions with `[Field]` references — arithmetic, `IF`, text and math functions, `LOOKUP(...)`, `SUMIF(...)`, `COUNTMATCH(...)` (self-lookup / duplicate counting on unique fields), and whole-column aggregates like `COLSUM` (e.g. `[Amount] / COLSUM("Amount")`). Live result preview while you type.
   - **Shaping**: filters, multi-level sort, group-by with per-column aggregation (sum, average, min, max, count, count distinct, join), and a totals row.
3. **Export** — Excel, CSV (pick a delimiter), TSV, PDF, PRN fixed-width, TXT, HTML, JSON, XML, Markdown. Excel and PDF outputs can be **encrypted with an open-password** (the file asks for the password when opened). Before you download, a **Report health** panel flags formula errors, unmatched lookup rows, duplicate headings and always-empty columns, and a preview table shows exactly what the file will contain.
3b. **Convert** — one-step file conversion without building a report: drop a file, pick any output format, download. Each sheet/table converts independently; "Shape in Build" jumps into the full builder with every field laid out.
3c. **PDF tools** — a page-level PDF workspace: merge files (in list order), reorder / rotate / delete pages with thumbnail previews, extract page ranges, split to single pages, convert pages to PNG images, or pull tables into Excel/data. All edits apply on download; originals are untouched.
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
