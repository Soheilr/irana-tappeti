# Irana Tappeti

Sito istituzionale di **Irana Tappeti**, showroom di tappeti persiani e orientali e servizi specializzati nell’area di Milano.

- Dominio di produzione: [tappeti-irana.com](https://tappeti-irana.com/)
- Sorgente: repository GitHub `Soheilr/irana-tappeti`
- Ultima release: 5 agosto 2026

## Pagine

- Homepage
- Tappeti persiani e orientali
- Lavaggio tappeti
- Riparazione e restauro
- Noleggio tappeti
- Contatti e showroom
- Privacy Policy
- Cookie Policy
- Pagina 404

La versione statica pubblicata si trova in `github-pages/`. Tutte le pagine condividono `assets/css/site.css` e `assets/js/site.js`, senza framework o librerie esterne nel browser.

## Privacy e contatti

Il sito non installa strumenti di analytics, profilazione o remarketing. Il form non salva dati e non invia richieste a database: prepara un messaggio leggibile e apre WhatsApp al numero aziendale.

## Validazione

```bash
npm run validate:site
```

Il controllo verifica pagine, metadati, link interni, immagini, JSON-LD, sitemap, robots, CNAME e versione degli asset. Le regole per le vecchie URL sono documentate in `deploy/apache-redirects.conf` e `docs/legacy-redirects.csv`.

Stato release: produzione verificata.
