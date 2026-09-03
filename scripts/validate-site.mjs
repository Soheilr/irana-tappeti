import { access, readFile } from "node:fs/promises";
import { dirname, extname, join, resolve } from "node:path";

const cwd = process.cwd();
const domain = "https://tappeti-irana.com";
const version = "20260903-consent";
const mapsUrl = "https://maps.app.goo.gl/fL556cfAGvnDGBKA7";
const siteRoot = process.argv[2]
  ? resolve(process.argv[2])
  : await exists(join(cwd, "index.html"))
    ? cwd
    : join(cwd, "github-pages");
const principal = [
  "index.html",
  "tappeti-persiani-milano/index.html",
  "lavaggio-tappeti/index.html",
  "riparazione-tappeti/index.html",
  "noleggio-tappeti-milano/index.html",
  "contatti/index.html",
  "privacy-policy/index.html",
  "cookie-policy/index.html",
  "404.html",
];
const redirects = [
  "galleria-irana-tappeti/index.html",
  "blog/index.html",
  "manutenzione/index.html",
  "home-2/index.html",
];
const errors = [];

async function exists(path) {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

function add(file, message) {
  errors.push(`${file}: ${message}`);
}

function tags(html, name) {
  return [...html.matchAll(new RegExp(`<${name}\\b[^>]*>`, "gi"))].map((match) => match[0]);
}

function attr(tag, name) {
  return tag.match(new RegExp(`\\s${name}=["']([^"']*)["']`, "i"))?.[1];
}

function text(html, tag) {
  return html
    .match(new RegExp(`<${tag}\\b[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i"))?.[1]
    .replace(/<[^>]+>/g, " ")
    .replace(/\\s+/g, " ")
    .trim();
}

function localTarget(file, reference) {
  if (!reference || reference.startsWith("#") || /^(mailto:|tel:|javascript:)/i.test(reference)) return null;
  let pathname;
  if (/^https?:\/\//i.test(reference)) {
    const url = new URL(reference);
    if (url.origin !== domain) return null;
    pathname = url.pathname.replace(/^\//, "");
  } else {
    pathname = reference.split(/[?#]/)[0];
    if (!pathname) return null;
    pathname = pathname.startsWith("/") ? pathname.slice(1) : join(dirname(file), pathname);
  }
  if (!pathname) pathname = "index.html";
  if (pathname.endsWith("/")) pathname += "index.html";
  if (!extname(pathname) && !pathname.endsWith("index.html")) pathname += "/index.html";
  return resolve(siteRoot, pathname);
}

const titles = new Map();
const descriptions = new Map();
for (const file of [...principal, ...redirects]) {
  const path = join(siteRoot, file);
  if (!(await exists(path))) {
    add(file, "file mancante");
    continue;
  }

  const html = await readFile(path, "utf8");
  const isRedirect = redirects.includes(file);
  const is404 = file === "404.html";
  const isNoindex = isRedirect || is404;
  if ((html.match(/<head\b/gi) ?? []).length !== 1 || (html.match(/<\/head>/gi) ?? []).length !== 1) add(file, "struttura head non valida");
  const pageTitle = text(html, "title");
  const descriptionTag = tags(html, "meta").find((tag) => attr(tag, "name") === "description");
  const description = descriptionTag && attr(descriptionTag, "content");

  if (!pageTitle) add(file, "title mancante");
  if (!isRedirect && !description) add(file, "meta description mancante");
  if (!isRedirect && pageTitle) {
    if (titles.has(pageTitle)) add(file, `title duplicato con ${titles.get(pageTitle)}`);
    else titles.set(pageTitle, file);
  }
  if (!isRedirect && description) {
    if (descriptions.has(description)) add(file, `description duplicata con ${descriptions.get(description)}`);
    else descriptions.set(description, file);
  }
  if (!isRedirect && tags(html, "h1").length !== 1) add(file, `numero H1: ${tags(html, "h1").length}`);

  const canonical = tags(html, "link").find((tag) => attr(tag, "rel") === "canonical");
  const canonicalUrl = canonical && attr(canonical, "href");
  if (!canonicalUrl) add(file, "canonical mancante");
  else if (!canonicalUrl.startsWith(domain)) add(file, "canonical fuori dominio");
  else if (!isRedirect && !is404 && canonicalUrl !== `${domain}/` && !canonicalUrl.endsWith("/")) add(file, "canonical senza slash finale");

  const robots = tags(html, "meta").find((tag) => attr(tag, "name") === "robots");
  const expectedRobots = isNoindex ? "noindex,follow" : "index,follow,max-image-preview:large";
  if (attr(robots ?? "", "content") !== expectedRobots) add(file, `robots deve essere ${expectedRobots}`);

  if (!isRedirect) {
    if (!html.includes(`site.css?v=${version}`)) add(file, "versione CSS errata");
    if (!html.includes(`site.js?v=${version}`)) add(file, "versione JavaScript errata");
    for (const property of ["og:type", "og:locale", "og:site_name", "og:title", "og:description", "og:url", "og:image", "og:image:width", "og:image:height", "og:image:alt"]) {
      if (!tags(html, "meta").some((tag) => attr(tag, "property") === property)) add(file, `metadato ${property} mancante`);
    }
    for (const name of ["twitter:card", "twitter:title", "twitter:description", "twitter:image", "twitter:image:alt"]) {
      if (!tags(html, "meta").some((tag) => attr(tag, "name") === name)) add(file, `metadato ${name} mancante`);
    }
  }

  if (/soheilr\.github\.io/i.test(html)) add(file, "URL GitHub presente");
  if (/preview\.tappeti-irana\.com/i.test(html)) add(file, "URL preview presente");
  if (!isRedirect && !html.includes(domain)) add(file, "dominio di produzione assente");
  if (/favicon\.svg/i.test(html)) add(file, "favicon.svg obsoleto");
  if (/<span[^>]*>\s*WA\s*<\/span>/i.test(html)) add(file, "sigla WA al posto dell’icona");
  if (/\b(charSet|autoComplete|inputMode|fetchPriority)=/.test(html)) add(file, "attributo JSX presente");
  if (/href=["'](?:#|javascript:void\(0\))["']/i.test(html)) add(file, "link fittizio");
  if (/googletagmanager\.com\/gtag\/js/i.test(html) || /gtag\(['"]config/i.test(html)) add(file, "Google Analytics non deve essere caricato direttamente nell’HTML");

  const ids = [...html.matchAll(/\sid=["']([^"']+)["']/gi)].map((match) => match[1]);
  const duplicateIds = ids.filter((id, index) => ids.indexOf(id) !== index);
  if (duplicateIds.length) add(file, `ID duplicati: ${[...new Set(duplicateIds)].join(", ")}`);

  for (const img of tags(html, "img")) {
    const src = attr(img, "src");
    if (!attr(img, "width") || !attr(img, "height")) add(file, `immagine senza width/height: ${src}`);
    const target = localTarget(file, src);
    if (target && !(await exists(target))) add(file, `immagine locale mancante: ${src}`);
  }

  for (const tag of [...tags(html, "link"), ...tags(html, "script")]) {
    const reference = attr(tag, "href") || attr(tag, "src");
    if (!reference || (!/site\.(css|js)/.test(reference) && !/assets\/brand/.test(reference))) continue;
    const target = localTarget(file, reference);
    if (target && !(await exists(target))) add(file, `asset locale mancante: ${reference}`);
  }

  for (const anchor of tags(html, "a")) {
    const href = attr(anchor, "href");
    const target = localTarget(file, href);
    if (target && !(await exists(target))) add(file, `link interno mancante: ${href}`);
    const relation = attr(anchor, "rel") ?? "";
    if (attr(anchor, "target") === "_blank" && !/\bnoopener\b/.test(relation)) add(file, `target blank senza noopener: ${href}`);
    if (/(?:maps\.app\.goo\.gl|google\.[^/]+\/maps)/i.test(href ?? "")) {
      if (href !== mapsUrl) add(file, `URL Google Maps non approvato: ${href}`);
      if (attr(anchor, "target") !== "_blank" || !/\bnoopener\b/.test(relation) || !/\bnoreferrer\b/.test(relation)) add(file, "link Google Maps senza target/rel corretti");
    }
  }

  for (const block of html.matchAll(/<script type=["']application\/ld\+json["']>([\s\S]*?)<\/script>/gi)) {
    try {
      JSON.parse(block[1]);
    } catch (error) {
      add(file, `JSON-LD non valido: ${error.message}`);
    }
  }
}

const home = await readFile(join(siteRoot, "index.html"), "utf8");
for (const label of ["Lavaggio tappeti", "Riparazione e restauro", "Noleggio tappeti"]) {
  if (!new RegExp(`<h3>\\s*<a[^>]+>\\s*${label}\\s*<\\/a>\\s*<\\/h3>`, "i").test(home)) add("index.html", `titolo card non cliccabile: ${label}`);
}

for (const file of principal) {
  const html = await readFile(join(siteRoot, file), "utf8");
  if (!html.includes("nav-dropdown-menu") || !html.includes("services-nav-bar")) add(file, "menu Servizi incompleto");
  if (!html.includes("footer-col") || !html.includes("Lavaggio tappeti") || !html.includes("Riparazione e restauro") || !html.includes("Noleggio tappeti")) add(file, "footer Servizi incompleto");
}

const required = [
  ".htaccess",
  "privacy-policy/index.html",
  "cookie-policy/index.html",
  "robots.txt",
  "sitemap.xml",
  "build-version.txt",
  "assets/brand/site.webmanifest",
];
for (const file of required) if (!(await exists(join(siteRoot, file)))) add(file, "file mancante");

const htaccess = await readFile(join(siteRoot, ".htaccess"), "utf8");
for (const directive of ["Options -Indexes", "DirectoryIndex index.html", "ErrorDocument 404 /404.html", "tappeti-irana.com%{REQUEST_URI}"]) {
  if (!htaccess.includes(directive)) add(".htaccess", `direttiva mancante: ${directive}`);
}
if (htaccess.includes("INSERIRE QUI")) add(".htaccess", "placeholder non sostituito");
const redirectSource = (await readFile(join(cwd, "deploy/apache-redirects.conf"), "utf8"))
  .split(/\r?\n/)
  .map((line) => line.trim())
  .filter(Boolean);
for (const redirect of redirectSource) {
  const occurrences = htaccess.split(redirect).length - 1;
  if (occurrences !== 1) add(".htaccess", `${redirect}: occorrenze ${occurrences}, attesa 1`);
}

if (await exists(join(siteRoot, "CNAME"))) add("CNAME", "file ancora presente");
if (siteRoot !== cwd && await exists(join(cwd, "CNAME"))) add("CNAME", "file ancora presente nella root");

const packagePath = join(cwd, "package.json");
if (!(await exists(packagePath))) add("package.json", "file mancante");
else {
  const packageJson = JSON.parse(await readFile(packagePath, "utf8"));
  if (packageJson.scripts?.["validate:site"] !== "node scripts/validate-site.mjs") add("package.json", "script validate:site errato");
}

const page404 = await readFile(join(siteRoot, "404.html"), "utf8");
if (/(?:href|src)=["']\.\//i.test(page404)) add("404.html", "percorso relativo ./ ancora presente");
for (const reference of ["/assets/css/site.css", "/assets/js/site.js", "/assets/brand/irana-logo.png", "/tappeti-persiani-milano/", "/lavaggio-tappeti/", "/riparazione-tappeti/", "/noleggio-tappeti-milano/", "/contatti/", "/privacy-policy/", "/cookie-policy/"]) {
  if (!page404.includes(reference)) add("404.html", `percorso root-relative mancante: ${reference}`);
}

const robotsTxt = await readFile(join(siteRoot, "robots.txt"), "utf8");
if (robotsTxt.trim() !== `User-agent: *\nAllow: /\n\nSitemap: ${domain}/sitemap.xml`) add("robots.txt", "contenuto incoerente");
const sitemap = await readFile(join(siteRoot, "sitemap.xml"), "utf8");
const expectedSitemap = ["/", "/tappeti-persiani-milano/", "/lavaggio-tappeti/", "/riparazione-tappeti/", "/noleggio-tappeti-milano/", "/contatti/", "/privacy-policy/", "/cookie-policy/"];
for (const route of expectedSitemap) if (!sitemap.includes(`<loc>${domain}${route}</loc>`)) add("sitemap.xml", `URL mancante: ${route}`);
if ((sitemap.match(/<url>/g) ?? []).length !== expectedSitemap.length) add("sitemap.xml", "contiene URL aggiuntive o mancanti");
if ((sitemap.match(/<lastmod>2026-08-06<\/lastmod>/g) ?? []).length !== expectedSitemap.length) add("sitemap.xml", "lastmod non aggiornati");
if (/soheilr\.github\.io|preview\.tappeti-irana\.com/i.test(sitemap)) add("sitemap.xml", "URL non di produzione presente");

const buildVersion = (await readFile(join(siteRoot, "build-version.txt"), "utf8")).trim();
if (buildVersion !== "irana-production-20260903-consent") add("build-version.txt", "valore errato");

const siteJs = await readFile(join(siteRoot, "assets/js/site.js"), "utf8");
for (const value of ["ANALYTICS_MEASUREMENT_ID", "irana_cookie_consent", "loadAnalytics", "Preferenze cookie"]) {
  if (!siteJs.includes(value)) add("assets/js/site.js", `gestione consenso mancante: ${value}`);
}
for (const file of ["privacy-policy/index.html", "cookie-policy/index.html"]) {
  const html = await readFile(join(siteRoot, file), "utf8");
  if (!/Google Analytics/i.test(html)) add(file, "informativa Analytics mancante");
}

const readme = await readFile(join(cwd, "README.md"), "utf8");
for (const value of ["Plesk", "httpdocs", "branch `main`", "npm run validate:site", ".htaccess"]) {
  if (!readme.includes(value)) add("README.md", `informazione mancante: ${value}`);
}
if (/GitHub Pages|pubblicata si trova in `github-pages\//i.test(readme)) add("README.md", "hosting di produzione obsoleto");

if (errors.length) {
  console.error(`Validazione fallita (${errors.length} errori):\n- ${errors.join("\n- ")}`);
  process.exit(1);
}

console.log(`Validazione completata: ${principal.length} pagine principali, ${redirects.length} redirect, nessun errore.`);
