import fs from 'fs';
import path from 'path';

const order = [
  'constants.js',
  'noise.js',
  'sprites.js',
  'caveMap.js',
  'cloudMap.js',
  'map.js',
  'player.js',
  'camera.js',
  'minimap.js',
  'touchControls.js',
  'combat.js',
  'game.js'
];

let bundleCode = '(function() {\n';

for (const file of order) {
  const filePath = path.join('js', file);
  let content = fs.readFileSync(filePath, 'utf8');

  // Strip imports and exports
  content = content.replace(/import\s+.*?from\s+['"].*?['"];?\r?\n?/g, '');
  content = content.replace(/export\s+const\s+/g, 'const ');
  content = content.replace(/export\s+class\s+/g, 'class ');
  content = content.replace(/export\s+function\s+/g, 'function ');
  content = content.replace(/export\s+default\s+/g, '');

  bundleCode += `\n// --- ${file} ---\n` + content + '\n';
}

bundleCode += '\n})();\n';

fs.writeFileSync('bundle.js', bundleCode, 'utf8');
console.log('Successfully bundled to bundle.js');
