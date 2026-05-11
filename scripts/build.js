const fs = require('fs');
const required = ['index.html', 'src/main.js', 'src/styles.css'];
for (const file of required) {
  if (!fs.existsSync(file)) {
    console.error(`Missing ${file}`);
    process.exit(1);
  }
}
fs.rmSync('dist', { recursive: true, force: true });
fs.mkdirSync('dist/src', { recursive: true });
fs.copyFileSync('index.html', 'dist/index.html');
fs.copyFileSync('src/main.js', 'dist/src/main.js');
fs.copyFileSync('src/styles.css', 'dist/src/styles.css');
console.log('Static prototype built in dist/');
