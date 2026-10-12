import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { compile } from '@tailwindcss/node';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const store = path.join(root, 'node_modules/.pnpm');
const viteDir = fs.readdirSync(store).find((entry) => entry.startsWith('vite@'));
if (!viteDir) throw new Error('Install package development dependencies before building the layout example.');
const { build } = await import(path.join(store, viteDir, 'node_modules/vite/dist/node/index.js'));
const example = process.argv[2] ?? 'shared-layouts';
if (!/^[a-z-]+$/.test(example)) throw new Error('Example name must contain only lowercase letters and hyphens.');
const dest = path.join(root, 'docs/tasks/evidence', example);
const file = path.join(dest, 'consumer.tsx');
const result = await build({
  configFile: false, root, logLevel: 'error',
  define: { 'process.env.NODE_ENV': JSON.stringify('production') },
  oxc: { jsx: { runtime: 'automatic' } },
  resolve: { dedupe: ['react', 'react-dom'] },
  build: { write: false, minify: true, lib: { entry: file, name: 'SharedLayoutExample', formats: ['iife'] } },
});
const outputs = (Array.isArray(result) ? result : [result]).flatMap((item) => item.output);
const bundle = outputs.find((item) => item.type === 'chunk').code;
const files = fs.readdirSync(path.join(root, 'src'), { recursive: true }).filter((entry) => /\.(tsx|ts)$/.test(entry));
const candidates = new Set();
for (const sourceFile of [...files.map((entry) => path.join(root, 'src', entry)), file]) {
  for (const match of fs.readFileSync(sourceFile, 'utf8').matchAll(/"([^"\n]+)"|'([^'\n]+)'/g)) {
    for (const candidate of (match[1] ?? match[2]).split(/\s+/)) candidates.add(candidate);
  }
}
const compiler = await compile('@import "tailwindcss";\n@import "./styles/theme.css";', { base: root, onDependency: () => {} });
const bundledCss = outputs
  .filter((item) => item.type === 'asset' && item.fileName.endsWith('.css'))
  .map((item) => typeof item.source === 'string' ? item.source : new TextDecoder().decode(item.source))
  .join('\n');
const css = `${compiler.build([...candidates])}\n${bundledCss}`;
fs.writeFileSync(path.join(dest, 'index.html'), `<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><title>Shared layout consumer example</title><style>${css}</style></head><body><div id="root"></div><script>${bundle.replaceAll('</script', '<\\/script')}</script></body></html>`);
console.log('Built standalone consumer from package exports and shared CSS.');
