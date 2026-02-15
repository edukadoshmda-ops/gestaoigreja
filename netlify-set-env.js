/**
 * Lê netlify-env-import.txt e define as variáveis no Netlify via CLI.
 * Use depois de: npx netlify link (e escolher o site gest-church)
 *
 * Uso: node netlify-set-env.js
 */
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.join(__dirname, 'netlify-env-import.txt');

if (!fs.existsSync(envPath)) {
  console.error('Arquivo netlify-env-import.txt não encontrado.');
  process.exit(1);
}

const content = fs.readFileSync(envPath, 'utf8');
const lines = content.split('\n').filter((l) => l.trim() && !l.startsWith('#'));

for (const line of lines) {
  const eq = line.indexOf('=');
  if (eq === -1) continue;
  const key = line.slice(0, eq).trim();
  const value = line.slice(eq + 1).trim();
  if (!key || !value) continue;
  try {
    execSync('npx', ['netlify', 'env:set', key, value], { stdio: 'inherit' });
    console.log('OK:', key);
  } catch (e) {
    console.error('Erro ao definir', key, '- Projeto já está linkado? Rode: npx netlify link');
    process.exit(1);
  }
}

console.log('\nVariáveis definidas. Faça um novo deploy no Netlify (Deploys > Trigger deploy).');
