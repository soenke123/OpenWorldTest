import fs from 'fs';
import path from 'path';

const files = [
  'js/constants.js',
  'js/noise.js',
  'js/characters.js',
  'bestiary.js',
  'js/sprites.js',
  'js/caveMap.js',
  'js/cloudMap.js',
  'js/map.js',
  'js/magic.js',
  'js/enemies.js',
  'js/player.js',
  'js/camera.js',
  'js/minimap.js',
  'js/touchControls.js',
  'js/combat.js',
  'js/game.js'
];

let bundleCode = '(function() {\n';

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');

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
