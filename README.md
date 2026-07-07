# Griha

Griha is a static HTML, CSS, and JavaScript prototype for a household financial operating system.

## Report Studio (`report-builder.html`)

A fully on-device smart report builder. Open `report-builder.html` (or the **Report Studio** link in the app sidebar).

- **Load many files at once** — `.xlsx`, `.xls`, `.csv`, `.tsv`, `.txt`, `.ods`, `.json`, and best-effort table extraction from `.pdf`. Multi-sheet workbooks become one source per sheet.
- **Build screen** — every field from every file appears in a palette; drag (or click) fields onto the canvas to compose a report. Drag column chips to reorder.
- **Cross-file lookups** — drop a field from a second file and pick the matching key once (like VLOOKUP); after that its fields join automatically.
- **Formula columns** — Excel-style expressions with `[Field]` references: arithmetic, `IF`, text functions, `LOOKUP`, `SUMIF`, `COUNTMATCH` (self-lookup / duplicate counts), whole-column aggregates like `COLSUM`, and more. Live result preview while typing.
- **Shaping** — filters, multi-level sort, group-by with per-column aggregation (sum, average, count, distinct, join), and a totals row.
- **Saved reports** — save the report *design* (never the data) on the device, reload it next month against fresh files, or export/import the settings as a JSON file to share with a colleague.
- **Access control** — lock a saved report with a password (PBKDF2-hashed) so others on the machine can run it but not modify or delete it.
- **Export formats** — Excel, CSV, TSV, PDF, PRN (fixed width), TXT, HTML, JSON, XML, Markdown. Excel and PDF outputs can be **encrypted with an open-password**.
- **Privacy by design** — all parsing, computation, and file generation happen in the browser. Nothing is uploaded, no server exists, and file data is never stored (it lives in memory and vanishes when the tab closes), so loading personal data creates no DPA/GDPR processing off the device. All libraries are vendored locally in `vendor/`, so it also works offline.

The computation engine lives in `src/report-engine.js` (pure JS, no DOM) and can be unit-tested in Node directly.

## Run locally

From the repository root:

```bash
npm run dev
```

Then open:

```text
http://localhost:5173
```

The local server uses Python's built-in HTTP server, so make sure `python3` is installed.

## Build/check static files

```bash
npm run build
```

This creates a `dist/` folder with `index.html`, `src/main.js`, and `src/styles.css`.

## Publish on GitHub Pages

You do **not** need a verified domain to publish this app with GitHub Pages.

Use GitHub's default Pages URL unless you specifically bought and configured a custom domain:

```text
https://YOUR_GITHUB_USERNAME.github.io/Project-Griha/
```

### Enable Pages without a custom domain

1. Push this repository to GitHub.
2. Open the repository on GitHub.
3. Go to **Settings** → **Pages**.
4. Under **Build and deployment**, set:
   - **Source**: `Deploy from a branch`
   - **Branch**: `main`
   - **Folder**: `/ (root)`
5. Click **Save**.
6. Wait for GitHub Pages to finish deploying, then open the Pages URL on desktop or mobile.

### About the "There are no verified domains" message

That message appears in the **Custom domain** area of GitHub Pages settings. It is not an error for this project.

- If you are using the free GitHub Pages URL, ignore it and leave **Custom domain** empty.
- If you want your own domain, first add and verify the domain in your GitHub account settings, then return to the repository Pages settings and enter that domain.

## Why asset paths are relative

`index.html` uses relative paths for CSS and JavaScript:

```html
<link rel="stylesheet" href="./src/styles.css" />
<script type="module" src="./src/main.js"></script>
```

Relative paths allow the app to work when GitHub Pages serves it from a project path such as `/Project-Griha/`.
