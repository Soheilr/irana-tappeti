# Irana Tappeti

Sito istituzionale statico di **Irana Tappeti**, showroom di tappeti persiani e orientali e servizi specializzati nell’area di Milano.

- Repository sorgente: GitHub `Soheilr/irana-tappeti`
- Branch di produzione: `main`
- Dominio pubblico: [tappeti-irana.com](https://tappeti-irana.com/)
- Hosting pubblico: Plesk
- Distribuzione: Plesk tramite Git
- Document root: `httpdocs`
- Ultima release: 3 settembre 2026

## Architettura

Il sito pubblico usa HTML, CSS e JavaScript statici condivisi, senza framework frontend nel browser. GitHub gestisce sorgente e versionamento; Plesk distribuisce il branch `main` nella document root `httpdocs`, gestisce HTTPS, redirect Apache e pagina 404.

## Privacy e contatti

Il sito non usa cookie di profilazione, sistemi di remarketing o database. Google Analytics viene caricato solo dopo il consenso esplicito dell’utente; il form prepara un messaggio leggibile e apre WhatsApp al numero aziendale.

## Validazione

```bash
npm run validate:site
```

I redirect di produzione e la pagina 404 sono gestiti da `.htaccess`. La mappa completa delle vecchie URL è mantenuta in `deploy/apache-redirects.conf`.
