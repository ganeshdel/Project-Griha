const fs = require('fs');
const required = ['index.html', 'src/main.js', 'src/styles.css', 'manifest.webmanifest', 'sw.js', 'icons/icon-192.png', 'icons/icon-512.png', 'icons/icon-maskable-512.png', 'icons/apple-touch-icon.png'];
for (const file of required) {
  if (!fs.existsSync(file)) {
    console.error(`Missing ${file}`);
    process.exit(1);
  }
}
fs.rmSync('dist', { recursive: true, force: true });
fs.mkdirSync('dist/src', { recursive: true });
fs.mkdirSync('dist/icons', { recursive: true });
fs.copyFileSync('index.html', 'dist/index.html');
fs.copyFileSync('src/main.js', 'dist/src/main.js');
fs.copyFileSync('src/styles.css', 'dist/src/styles.css');
fs.copyFileSync('manifest.webmanifest', 'dist/manifest.webmanifest');
fs.copyFileSync('sw.js', 'dist/sw.js');
for (const icon of ['icon-192.png', 'icon-512.png', 'icon-maskable-512.png', 'apple-touch-icon.png']) {
  fs.copyFileSync('icons/' + icon, 'dist/icons/' + icon);
}
console.log('Static prototype built in dist/');
