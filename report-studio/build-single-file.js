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
const vendors = ['xlsx.full.min.js', 'pdf.min.js', 'jspdf.umd.min.js', 'jspdf.plugin.autotable.min.js', 'xlsx-populate.min.js']
  .map(f => read('vendor/' + f));

for (const src of [css, engine, app, worker, ...vendors]) {
  if (src.includes('</script')) throw new Error('inline safety: found </script in a source file');
}

const body =
  '<div class="grain"></div>\n<div id="rb-root"></div>\n' +
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
