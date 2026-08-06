# Irana Tappeti

Sito istituzionale statico di **Irana Tappeti**, showroom di tappeti persiani e orientali e servizi specializzati nell’area di Milano.

- Repository sorgente: GitHub `Soheilr/irana-tappeti`
- Branch di produzione: `main`
- Dominio pubblico: [tappeti-irana.com](https://tappeti-irana.com/)
- Hosting pubblico: Plesk
- Distribuzione: Plesk tramite Git
- Document root: `site-production`
- Ultima release: 6 agosto 2026

## Architettura

Il sito pubblico usa HTML, CSS e JavaScript statici condivisi, senza framework frontend nel browser. GitHub gestisce sorgente e versionamento; Plesk distribuisce il branch `main` nella document root `site-production`, gestisce HTTPS, redirect Apache e pagina 404.

## Privacy e contatti

Il sito non installa analytics, cookie di profilazione o sistemi di remarketing. Il form non salva dati e non usa database: prepara un messaggio leggibile e apre WhatsApp al numero aziendale.

## Validazione

```bash
npm run validate:site
```

I redirect di produzione e la pagina 404 sono gestiti da `.htaccess`. La mappa completa delle vecchie URL è mantenuta in `deploy/apache-redirects.conf`.
