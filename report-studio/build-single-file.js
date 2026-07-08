/* Builds ReportStudio.html — the entire tool in one double-clickable file.
   Everything (styles, engine, UI, all vendor libraries, even the PDF worker)
   is inlined, so the single file works offline from anywhere on disk.
   Run from this folder:  node build-single-file.js */
const fs = require('fs');
const path = require('path');
const here = __dirname;
const read = f => fs.readFileSync(path.join(here, f), 'utf8');

let css = read('styles.css').replace(/@import url\([^)]*\);\n?/, ''); // offline: system fonts
const engine = read('engine.js');
// The folder version points the PDF worker at a file; the single file carries
// the worker inline and hands it over as a blob URL instead.
const app = read('app.js').replace(
  "window.pdfjsLib.GlobalWorkerOptions.workerSrc = './vendor/pdf.worker.min.js';",
  'window.pdfjsLib.GlobalWorkerOptions.workerSrc = window.__pdfWorkerUrl;'
);
const worker = read('vendor/pdf.worker.min.js');
const vendors = ['xlsx.full.min.js', 'pdf.min.js', 'jspdf.umd.min.js', 'jspdf.plugin.autotable.min.js', 'xlsx-populate.min.js', 'pdf-lib.min.js']
  .map(f => read('vendor/' + f));

for (const src of [css, engine, app, worker, ...vendors]) {
  if (src.includes('</script')) throw new Error('inline safety: found </script in a source file');
}

// static fallback shown until the app code takes over; stays visible in
// viewers that display files without running scripts (e.g. in-app previews)
const fallback =
  '<div id="rb-root"><div style="min-height:100vh;display:flex;align-items:center;justify-content:center;padding:32px;text-align:center">' +
  '<div style="max-width:420px"><div style="font-size:2.2rem;margin-bottom:14px">📊</div>' +
  '<h1 style="font-size:1.3rem;margin-bottom:10px">Report Studio is loading…</h1>' +
  '<p style="color:rgba(255,255,255,.6);font-size:.9rem;line-height:1.6">If this message doesn\'t go away, ' +
  'this viewer can only display files, not run apps. Save this file and open it in a web browser — ' +
  'Chrome, Edge, or Safari on a computer works best.</p></div></div></div>';

const body =
  '<div class="grain"></div>\n' + fallback + '\n' +
  '<script type="text/plain" id="pdfjs-worker-code">\n' + worker + '\n</script>\n' +
  vendors.map(v => '<script>\n' + v + '\n</script>').join('\n') +
  '\n<script>\n(function () {\n' +
  "  var code = document.getElementById('pdfjs-worker-code').textContent;\n" +
  "  window.__pdfWorkerUrl = URL.createObjectURL(new Blob([code], { type: 'text/javascript' }));\n" +
  '})();\n</script>\n' +
  '<script>\n' + engine + '\n</script>\n' +
  '<script>\n' + app + '\n</script>';

const full =
  '<!doctype html>\n<html lang="en">\n<head>\n' +
  '<meta charset="UTF-8" />\n' +
  '<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />\n' +
  '<title>Report Studio — on-device smart report builder</title>\n' +
  '<meta name="theme-color" content="#080808" />\n' +
  '<style>\n' + css + '\n</style>\n' +
  '</head>\n<body>\n' + body + '\n</body>\n</html>\n';

fs.writeFileSync(path.join(here, 'ReportStudio.html'), full);
console.log('ReportStudio.html written (' + (full.length / 1024 / 1024).toFixed(1) + ' MB)');
