#!/usr/bin/env node
// =====================================================================
//  Gera as duas versões a partir do código compartilhado em src/:
//
//    node scripts/build.mjs web   → dist/web   (site, com service worker e SEO)
//    node scripts/build.mjs app   → dist/app   (app Android via Capacitor)
//    node scripts/build.mjs       → as duas
//
//  Configuração do Supabase: supabase/config.json
//  (as variáveis de ambiente SUPABASE_URL e SUPABASE_ANON_KEY, se existirem, têm prioridade)
//  Endereço do site: variável PUBLIC_SITE_URL (padrão: GitHub Pages deste repositório)
// =====================================================================
import { createHash } from 'node:crypto';
import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SRC = join(ROOT, 'src');
const WEB = join(ROOT, 'web');
const DIST = join(ROOT, 'dist');

const DEFAULT_SITE_URL = 'https://biellog.github.io/progressao-senior/';

function readSupabaseConfig() {
  let file = {};
  const p = join(ROOT, 'supabase', 'config.json');
  if (existsSync(p)) {
    try { file = JSON.parse(readFileSync(p, 'utf8')); }
    catch (err) { throw new Error('supabase/config.json não é um JSON válido: ' + err.message); }
  }
  const url = (process.env.SUPABASE_URL || file.url || '').trim().replace(/\/+$/, '');
  const anonKey = (process.env.SUPABASE_ANON_KEY || file.anonKey || '').trim();
  if (url && !/^https:\/\/[a-z0-9-]+\.supabase\.co$/.test(url)) {
    console.warn('⚠️  O endereço do Supabase não parece com https://xxxx.supabase.co: ' + url);
  }
  if (anonKey && anonKey.split('.').length !== 3 && !anonKey.startsWith('sb_publishable_')) {
    console.warn('⚠️  A chave do Supabase não parece uma "anon key" nem uma "publishable key".');
  }
  return { url, anonKey };
}

function siteUrl() {
  let u = (process.env.PUBLIC_SITE_URL || DEFAULT_SITE_URL).trim();
  if (!u.endsWith('/')) u += '/';
  return u;
}

function listFiles(dir) {
  const out = [];
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) out.push(...listFiles(p));
    else out.push(p);
  }
  return out;
}

function build(target) {
  const out = join(DIST, target);
  rmSync(out, { recursive: true, force: true });
  mkdirSync(out, { recursive: true });
  cpSync(SRC, out, { recursive: true });

  const sbCfg = readSupabaseConfig();
  const site = siteUrl();
  const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8'));
  const config = {
    platform: target,
    version: process.env.APP_VERSION || pkg.version,
    publicSiteUrl: site,
    supabaseUrl: sbCfg.url,
    supabaseAnonKey: sbCfg.anonKey
  };
  writeFileSync(join(out, 'config.js'),
    '// Gerado por scripts/build.mjs — não edite aqui (edite supabase/config.json)\n' +
    'window.APP_CONFIG = ' + JSON.stringify(config, null, 2) + ';\n');

  const indexPath = join(out, 'index.html');
  let html = readFileSync(indexPath, 'utf8');
  if (target === 'web') {
    const head = readFileSync(join(WEB, 'head.html'), 'utf8').replaceAll('__SITE_URL__', site);
    html = html.replace('<!--WEB_HEAD-->', head.trim());
    for (const f of ['manifest.json', 'robots.txt', 'sitemap.xml']) {
      writeFileSync(join(out, f), readFileSync(join(WEB, f), 'utf8').replaceAll('__SITE_URL__', site));
    }
  } else {
    html = html.replace('<!--WEB_HEAD-->\n', '').replace('<!--WEB_HEAD-->', '');
  }
  writeFileSync(indexPath, html);

  if (target === 'web') {
    // Lista de arquivos para o modo offline + versão do cache = hash do conteúdo
    const files = listFiles(out)
      .map((p) => relative(out, p).split(sep).join('/'))
      .filter((p) => !['robots.txt', 'sitemap.xml'].includes(p))
      .sort();
    const hash = createHash('sha256');
    for (const f of files) hash.update(f).update(readFileSync(join(out, f)));
    const version = hash.digest('hex').slice(0, 10);
    const assets = ['./', ...files.map((f) => './' + f)];
    const sw = readFileSync(join(WEB, 'sw.js'), 'utf8')
      .replace('__CACHE_VERSION__', version)
      .replace('__ASSETS__', JSON.stringify(assets, null, 2));
    writeFileSync(join(out, 'sw.js'), sw);
  }

  const status = sbCfg.url && sbCfg.anonKey ? 'Supabase: ' + sbCfg.url : 'Supabase: NÃO CONFIGURADO (o app vai pedir configuração)';
  console.log(`✓ dist/${target}  ·  ${status}` + (target === 'web' ? '  ·  site: ' + site : ''));
}

const arg = process.argv[2];
const targets = arg ? [arg] : ['web', 'app'];
for (const t of targets) {
  if (!['web', 'app'].includes(t)) { console.error('Use: node scripts/build.mjs [web|app]'); process.exit(1); }
  build(t);
}
