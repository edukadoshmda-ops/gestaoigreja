import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname);
const from = path.join(root, '.env.example');
const to = path.join(root, '.env.local');
if (!fs.existsSync(from)) {
  console.error('Arquivo .env.example não encontrado.');
  process.exit(1);
}
fs.copyFileSync(from, to);
console.log('Arquivo .env.local criado com sucesso.');
console.log('Abra .env.local e troque "your_supabase_anon_key_here" pela chave anon do Supabase (Settings > API no painel).');
