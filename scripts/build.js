const fs = require('fs');
const vendorFiles = ['xlsx.full.min.js', 'pdf.min.js', 'pdf.worker.min.js', 'jspdf.umd.min.js', 'jspdf.plugin.autotable.min.js', 'xlsx-populate.min.js'];
const required = ['index.html', 'src/main.js', 'src/styles.css', 'manifest.webmanifest', 'sw.js', 'icons/icon-192.png', 'icons/icon-512.png', 'icons/icon-maskable-512.png', 'icons/apple-touch-icon.png',
  'report-builder.html', 'src/report-builder.js', 'src/report-engine.js', 'src/report-builder.css'].concat(vendorFiles.map(f => 'vendor/' + f));
for (const file of required) {
  if (!fs.existsSync(file)) {
    console.error(`Missing ${file}`);
    process.exit(1);
  }
}
fs.rmSync('dist', { recursive: true, force: true });
fs.mkdirSync('dist/src', { recursive: true });
fs.mkdirSync('dist/icons', { recursive: true });
fs.mkdirSync('dist/vendor', { recursive: true });
fs.copyFileSync('index.html', 'dist/index.html');
fs.copyFileSync('src/main.js', 'dist/src/main.js');
fs.copyFileSync('src/styles.css', 'dist/src/styles.css');
fs.copyFileSync('manifest.webmanifest', 'dist/manifest.webmanifest');
fs.copyFileSync('sw.js', 'dist/sw.js');
fs.copyFileSync('report-builder.html', 'dist/report-builder.html');
fs.copyFileSync('src/report-builder.js', 'dist/src/report-builder.js');
fs.copyFileSync('src/report-engine.js', 'dist/src/report-engine.js');
fs.copyFileSync('src/report-builder.css', 'dist/src/report-builder.css');
for (const v of vendorFiles) {
  fs.copyFileSync('vendor/' + v, 'dist/vendor/' + v);
}
for (const icon of ['icon-192.png', 'icon-512.png', 'icon-maskable-512.png', 'apple-touch-icon.png']) {
  fs.copyFileSync('icons/' + icon, 'dist/icons/' + icon);
}
console.log('Static prototype built in dist/');
