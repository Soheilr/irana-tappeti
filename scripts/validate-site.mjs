import { access, readFile, readdir } from "node:fs/promises";
import { dirname, extname, join, resolve } from "node:path";

const cwd = process.cwd();
const siteRoot = process.argv[2] ? resolve(process.argv[2]) : await exists(join(cwd, "index.html")) ? cwd : join(cwd, "github-pages");
const domain = "https://tappeti-irana.com";
const version = "20260805-final";
const principal = [
  "index.html", "tappeti-persiani-milano/index.html", "lavaggio-tappeti/index.html",
  "riparazione-tappeti/index.html", "noleggio-tappeti-milano/index.html",
  "contatti/index.html", "privacy-policy/index.html", "cookie-policy/index.html", "404.html",
];
const redirects = ["galleria-irana-tappeti/index.html", "blog/index.html", "manutenzione/index.html", "home-2/index.html"];
const errors = [];

async function exists(path) { try { await access(path); return true; } catch { return false; } }
function add(file, message) { errors.push(`${file}: ${message}`); }
function tags(html, name) { return [...html.matchAll(new RegExp(`<${name}\\b[^>]*>`, "gi"))].map((m) => m[0]); }
function attr(tag, name) { return tag.match(new RegExp(`\\s${name}=["']([^"']*)["']`, "i"))?.[1]; }
function text(html, tag) { return html.match(new RegExp(`<${tag}\\b[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i"))?.[1].replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim(); }
function localTarget(file, href) {
  if (!href || href.startsWith("#") || /^(mailto:|tel:|javascript:)/i.test(href)) return null;
  let pathname;
  if (/^https?:\/\//i.test(href)) {
    const url = new URL(href);
    if (url.origin !== domain) return null;
    pathname = url.pathname.replace(/^\//, "");
  } else {
    pathname = href.split(/[?#]/)[0];
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
  if (!(await exists(path))) { add(file, "file mancante"); continue; }
  const html = await readFile(path, "utf8");
  const isRedirect = redirects.includes(file);
  const isNoindex = isRedirect || file === "404.html";
  const title = text(html, "title");
  const descriptionTag = tags(html, "meta").find((tag) => attr(tag, "name") === "description");
  const description = descriptionTag && attr(descriptionTag, "content");
  if (!title) add(file, "title mancante");
  if (!isRedirect && !description) add(file, "meta description mancante");
  if (!isRedirect && title) { if (titles.has(title)) add(file, `title duplicato con ${titles.get(title)}`); else titles.set(title, file); }
  if (!isRedirect && description) { if (descriptions.has(description)) add(file, `description duplicata con ${descriptions.get(description)}`); else descriptions.set(description, file); }
  if (!isRedirect && tags(html, "h1").length !== 1) add(file, `numero H1: ${tags(html, "h1").length}`);
  const canonical = tags(html, "link").find((tag) => attr(tag, "rel") === "canonical");
  if (!canonical) add(file, "canonical mancante");
  else if (!attr(canonical, "href")?.startsWith(domain)) add(file, "canonical fuori dominio");
  const robots = tags(html, "meta").find((tag) => attr(tag, "name") === "robots");
  const expectedRobots = isNoindex ? "noindex,follow" : "index,follow,max-image-preview:large";
  if (attr(robots ?? "", "content") !== expectedRobots) add(file, `robots deve essere ${expectedRobots}`);
  if (!isRedirect && !html.includes(`site.css?v=${version}`)) add(file, "versione CSS errata");
  if (!isRedirect && !html.includes(`site.js?v=${version}`)) add(file, "versione JavaScript errata");
  if (/soheilr\.github\.io\/irana-tappeti/i.test(html)) add(file, "URL GitHub nei metadati di produzione");
  if (/favicon\.svg/i.test(html)) add(file, "favicon.svg obsoleto");
  if (/<span[^>]*>\s*WA\s*<\/span>/i.test(html)) add(file, "sigla WA al posto dell’icona");
  if (/\b(charSet|autoComplete|inputMode|fetchPriority)=/.test(html)) add(file, "attributo JSX presente");
  if (/<!--\s*-->/g.test(html)) add(file, "commento serializzato vuoto");
  if (/href=["'](?:#|javascript:void\(0\))["']/i.test(html)) add(file, "link fittizio");
  const idValues = [...html.matchAll(/\sid=["']([^"']+)["']/gi)].map((m) => m[1]);
  const duplicateIds = idValues.filter((id, index) => idValues.indexOf(id) !== index);
  if (duplicateIds.length) add(file, `ID duplicati: ${[...new Set(duplicateIds)].join(", ")}`);
  for (const img of tags(html, "img")) {
    const src = attr(img, "src");
    if (!attr(img, "width") || !attr(img, "height")) add(file, `immagine senza width/height: ${src}`);
    const target = localTarget(file, src);
    if (target && !(await exists(target))) add(file, `immagine locale mancante: ${src}`);
  }
  for (const tag of [...tags(html, "link"), ...tags(html, "script")]) {
    const ref = attr(tag, "href") || attr(tag, "src");
    if (!ref || (!/site\.(css|js)/.test(ref) && !/assets\/brand/.test(ref))) continue;
    const target = localTarget(file, ref);
    if (target && !(await exists(target))) add(file, `asset locale mancante: ${ref}`);
  }
  for (const anchor of tags(html, "a")) {
    const href = attr(anchor, "href");
    const target = localTarget(file, href);
    if (target && !(await exists(target))) add(file, `link interno mancante: ${href}`);
    if (attr(anchor, "target") === "_blank" && !/\bnoopener\b/.test(attr(anchor, "rel") ?? "")) add(file, `target blank senza noopener: ${href}`);
  }
  for (const block of html.matchAll(/<script type=["']application\/ld\+json["']>([\s\S]*?)<\/script>/gi)) {
    try { JSON.parse(block[1]); } catch (error) { add(file, `JSON-LD non valido: ${error.message}`); }
  }
}

const home = await readFile(join(siteRoot, "index.html"), "utf8");
for (const label of ["Lavaggio tappeti", "Riparazione e restauro", "Noleggio tappeti"]) {
  if (!new RegExp(`<h3>\\s*<a[^>]+>\\s*${label}\\s*<\\/a>\\s*<\\/h3>`, "i").test(home)) add("index.html", `titolo card non cliccabile: ${label}`);
}
if (!home.includes("nav-dropdown-menu") || !home.includes("services-nav-bar")) add("index.html", "menu servizi incompleto");
for (const file of principal) {
  const html = await readFile(join(siteRoot, file), "utf8");
  if (!html.includes("footer-col") || !html.includes("Lavaggio tappeti") || !html.includes("Riparazione e restauro") || !html.includes("Noleggio tappeti")) add(file, "footer servizi incompleto");
}

for (const required of ["privacy-policy/index.html", "cookie-policy/index.html", "CNAME", "robots.txt", "sitemap.xml", "assets/brand/site.webmanifest"]) {
  if (!(await exists(join(siteRoot, required)))) add(required, "file mancante");
}
if ((await readFile(join(siteRoot, "CNAME"), "utf8")).trim() !== "tappeti-irana.com") add("CNAME", "contenuto errato");
const robots = await readFile(join(siteRoot, "robots.txt"), "utf8");
if (!robots.includes("Allow: /") || !robots.includes(`${domain}/sitemap.xml`)) add("robots.txt", "contenuto incoerente");
const sitemap = await readFile(join(siteRoot, "sitemap.xml"), "utf8");
const expectedSitemap = ["/", "/tappeti-persiani-milano/", "/lavaggio-tappeti/", "/riparazione-tappeti/", "/noleggio-tappeti-milano/", "/contatti/", "/privacy-policy/", "/cookie-policy/"];
for (const route of expectedSitemap) if (!sitemap.includes(`<loc>${domain}${route}</loc>`)) add("sitemap.xml", `URL mancante: ${route}`);
if ((sitemap.match(/<url>/g) ?? []).length !== expectedSitemap.length) add("sitemap.xml", "contiene URL aggiuntive o mancanti");

if (errors.length) {
  console.error(`Validazione fallita (${errors.length} errori):\n- ${errors.join("\n- ")}`);
  process.exit(1);
}
console.log(`Validazione completata: ${principal.length} pagine principali, ${redirects.length} redirect, nessun errore.`);
