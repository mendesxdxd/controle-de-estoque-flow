/**
 * Tira screenshots das telas autenticadas em varias larguras.
 *
 * Uso:  node scripts/screenshots.mjs [rota...]
 *       node scripts/screenshots.mjs                 -> telas principais
 *       node scripts/screenshots.mjs /conferencia    -> so essa rota
 *
 * Credenciais: E2E_EMAIL e E2E_SENHA no .env.local (que esta no gitignore).
 *
 * IMPORTANTE: este script apenas navega e fotografa. Ele nunca submete
 * formulario, porque o .env.local aponta para o Supabase de producao e um
 * submit gravaria movimentacao de verdade no estoque.
 */

import { chromium } from "playwright";
import { readFileSync, mkdirSync, existsSync } from "node:fs";
import { join } from "node:path";

const BASE = process.env.BASE_URL ?? "http://localhost:3000";
const SAIDA = "scripts/.screenshots";

const LARGURAS = [
  { nome: "desktop", width: 1440, height: 900 },
  { nome: "notebook", width: 1280, height: 800 },
  { nome: "tablet", width: 1024, height: 768 },
  { nome: "celular", width: 390, height: 844 },
];

const ROTAS_PADRAO = ["/estoque", "/conferencia", "/ordens-frete"];

function lerEnvLocal() {
  const env = {};
  try {
    for (const linha of readFileSync(".env.local", "utf8").split("\n")) {
      const m = linha.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)$/);
      if (m) env[m[1]] = m[2].trim().replace(/^["']|["']$/g, "");
    }
  } catch {
    /* sem .env.local */
  }
  return env;
}

const env = lerEnvLocal();
const EMAIL = process.env.E2E_EMAIL ?? env.E2E_EMAIL;
const SENHA = process.env.E2E_SENHA ?? env.E2E_SENHA;

if (!EMAIL || !SENHA) {
  console.error(
    "\nFaltam credenciais. Adicione ao .env.local:\n" +
      '  E2E_EMAIL="usuario-de-teste@exemplo.com"\n' +
      '  E2E_SENHA="a-senha"\n'
  );
  process.exit(1);
}

/**
 * O Git Bash no Windows converte um argumento "/estoque" em caminho absoluto
 * ("C:/Program Files/Git/estoque"). Ficar so com o ultimo trecho desfaz isso e
 * ainda aceita a rota escrita sem barra.
 */
function normalizarRota(arg) {
  const ultimo = arg.split(/[\\/]/).filter(Boolean).pop() ?? "";
  return `/${ultimo}`;
}

const argumentos = process.argv.slice(2);
const rotas = argumentos.length ? argumentos.map(normalizarRota) : ROTAS_PADRAO;

if (!existsSync(SAIDA)) mkdirSync(SAIDA, { recursive: true });

const navegador = await chromium.launch();
const contexto = await navegador.newContext({ viewport: LARGURAS[0] });
const pagina = await contexto.newPage();

const errosDeConsole = [];
pagina.on("console", (m) => {
  if (m.type() === "error") errosDeConsole.push(m.text());
});
pagina.on("pageerror", (e) => errosDeConsole.push(`pageerror: ${e.message}`));

// --- Login ---
await pagina.goto(`${BASE}/login`, { waitUntil: "networkidle" });
await pagina.fill('input[type="email"]', EMAIL);
await pagina.fill('input[type="password"]', SENHA);
await pagina.click('button[type="submit"]');

try {
  await pagina.waitForURL((u) => !u.pathname.startsWith("/login"), { timeout: 20000 });
} catch {
  console.error("Login falhou. Confira E2E_EMAIL / E2E_SENHA no .env.local.");
  await pagina.screenshot({ path: join(SAIDA, "erro-login.png") });
  await navegador.close();
  process.exit(1);
}
console.log(`login ok -> ${new URL(pagina.url()).pathname}`);

// --- Captura ---
for (const rota of rotas) {
  for (const larg of LARGURAS) {
    await pagina.setViewportSize({ width: larg.width, height: larg.height });
    await pagina.goto(`${BASE}${rota}`, { waitUntil: "networkidle" });
    await pagina.waitForTimeout(400); // deixa fonte/animacao assentarem

    // CLICAR="seletor" abre acordeoes/abas antes da foto. So interacao de
    // leitura: nunca use para botao que salva, o banco e o de producao.
    if (process.env.CLICAR) {
      const alvos = pagina.locator(process.env.CLICAR);
      const total = Math.min(await alvos.count(), 3);
      for (let i = 0; i < total; i++) await alvos.nth(i).click();
      await pagina.waitForTimeout(500); // deixa a transicao terminar
    }

    const sufixo = process.env.CLICAR ? `-aberto` : "";
    const nome = `${rota.replace(/\//g, "_").replace(/^_/, "")}--${larg.nome}${sufixo}.png`;
    await pagina.screenshot({ path: join(SAIDA, nome), fullPage: true });

    // Scroll horizontal no body denuncia layout estourando a largura.
    const estouro = await pagina.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1
    );
    console.log(`${estouro ? "ESTOURA " : "ok      "} ${nome}`);
  }
}

if (errosDeConsole.length) {
  console.log("\nErros de console:");
  for (const e of [...new Set(errosDeConsole)].slice(0, 10)) console.log(`  - ${e}`);
}

await navegador.close();
console.log(`\nImagens em ${SAIDA}/`);
