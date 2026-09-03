const menuButton = document.querySelector(".menu-toggle");
const mobileMenu = document.querySelector(".mobile-menu");
const servicesToggle = document.querySelector(".nav-dropdown-toggle");
const servicesMenu = document.querySelector(".nav-dropdown-menu");

function closeMobileMenu({ restoreFocus = false } = {}) {
  if (!mobileMenu || !menuButton) return;
  mobileMenu.setAttribute("hidden", "");
  document.body.style.overflow = "";
  menuButton.setAttribute("aria-expanded", "false");
  menuButton.setAttribute("aria-label", "Apri il menu");
  if (restoreFocus) menuButton.focus();
}

menuButton?.addEventListener("click", () => {
  if (!mobileMenu) return;
  const open = mobileMenu.hasAttribute("hidden");
  mobileMenu.toggleAttribute("hidden", !open);
  document.body.style.overflow = open ? "hidden" : "";
  menuButton.setAttribute("aria-expanded", String(open));
  menuButton.setAttribute("aria-label", open ? "Chiudi il menu" : "Apri il menu");
});

mobileMenu?.querySelectorAll("a").forEach((link) => {
  link.addEventListener("click", () => closeMobileMenu({ restoreFocus: link.getAttribute("href")?.startsWith("#") }));
});

function closeServicesMenu({ restoreFocus = false } = {}) {
  if (!servicesToggle || !servicesMenu) return;
  servicesMenu.setAttribute("hidden", "");
  servicesToggle.setAttribute("aria-expanded", "false");
  if (restoreFocus) servicesToggle.focus();
}

servicesToggle?.addEventListener("click", () => {
  if (!servicesMenu) return;
  const open = servicesMenu.hasAttribute("hidden");
  servicesMenu.toggleAttribute("hidden", !open);
  servicesToggle.setAttribute("aria-expanded", String(open));
  if (open) servicesMenu.querySelector("a")?.focus();
});

servicesMenu?.querySelectorAll("a").forEach((link) => {
  link.addEventListener("click", () => closeServicesMenu());
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && mobileMenu && !mobileMenu.hasAttribute("hidden")) {
    closeMobileMenu({ restoreFocus: true });
  }
  if (event.key === "Escape" && servicesMenu && !servicesMenu.hasAttribute("hidden")) {
    closeServicesMenu({ restoreFocus: true });
  }
});

document.addEventListener("click", (event) => {
  const target = event.target;
  if (!(target instanceof Element)) return;

  if (servicesMenu && !servicesMenu.hasAttribute("hidden") && !target.closest(".nav-dropdown")) {
    closeServicesMenu();
  }

  const serviceLink = target.closest("[data-service]");
  if (!serviceLink) return;

  const formTarget = serviceLink.getAttribute("href");
  const form = formTarget?.startsWith("#")
    ? document.querySelector(formTarget)?.querySelector(".contact-card")
    : document.querySelector(".contact-card");
  const service = form?.elements.namedItem("service");
  const message = form?.elements.namedItem("message");

  if (service instanceof HTMLSelectElement) {
    service.value = serviceLink.dataset.service || "";
    service.dispatchEvent(new Event("change", { bubbles: true }));
  }

  window.setTimeout(() => {
    if (message instanceof HTMLTextAreaElement) message.focus({ preventScroll: true });
  }, 0);
});

document.querySelectorAll(".contact-card").forEach((form) => {
  form.addEventListener("invalid", () => {
    const status = form.querySelector("#form-status");
    if (status) status.textContent = "Completa i campi obbligatori: Nome e Servizio.";
  }, true);

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const status = form.querySelector("#form-status");
    if (status) status.textContent = "";

    const data = new FormData(form);
    const intro = form.dataset.whatsappIntro || "Buongiorno Irana Tappeti,";
    const lines = [
      intro,
      "",
      "Nome: " + String(data.get("name") || "").trim(),
      "Telefono: " + String(data.get("phone") || "non indicato").trim(),
      "Richiesta: " + String(data.get("service") || "").trim(),
      "Messaggio: " + String(data.get("message") || "vorrei ricevere maggiori informazioni").trim(),
    ];

    window.open(
      "https://wa.me/393386490517?text=" + encodeURIComponent(lines.join("\n")),
      "_blank",
      "noopener,noreferrer",
    );
  });
});

const ANALYTICS_MEASUREMENT_ID = "G-0FWL202XG8";
const CONSENT_COOKIE_NAME = "irana_cookie_consent";
const CONSENT_MAX_AGE = 60 * 60 * 24 * 180;
let cookiePreferencesDialog;
let cookiePreferencesTrigger;

function getCookie(name) {
  const entry = document.cookie
    .split(";")
    .map((value) => value.trim())
    .find((value) => value.startsWith(`${name}=`));
  return entry ? decodeURIComponent(entry.slice(name.length + 1)) : "";
}

function setConsent(value) {
  document.cookie = `${CONSENT_COOKIE_NAME}=${encodeURIComponent(value)}; Max-Age=${CONSENT_MAX_AGE}; Path=/; SameSite=Lax; Secure`;
}

function removeAnalyticsCookies() {
  document.cookie.split(";").forEach((entry) => {
    const name = entry.trim().split("=")[0];
    if (/^_ga(?:_|$)/.test(name)) {
      document.cookie = `${name}=; Max-Age=0; Path=/; SameSite=Lax; Secure`;
    }
  });
}

function loadAnalytics() {
  window[`ga-disable-${ANALYTICS_MEASUREMENT_ID}`] = false;
  if (document.querySelector(`script[data-analytics-id="${ANALYTICS_MEASUREMENT_ID}"]`)) {
    if (typeof window.gtag === "function") window.gtag("consent", "update", { analytics_storage: "granted" });
    return;
  }

  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function gtag() {
    window.dataLayer.push(arguments);
  };
  window.gtag("consent", "default", { analytics_storage: "granted" });
  window.gtag("js", new Date());
  window.gtag("config", ANALYTICS_MEASUREMENT_ID, { anonymize_ip: true });

  const script = document.createElement("script");
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${ANALYTICS_MEASUREMENT_ID}`;
  script.dataset.analyticsId = ANALYTICS_MEASUREMENT_ID;
  document.head.append(script);
}

function createCookieControls() {
  const banner = document.createElement("section");
  banner.className = "cookie-banner";
  banner.setAttribute("aria-labelledby", "cookie-banner-title");
  banner.innerHTML = `
    <div class="cookie-banner-copy">
      <p class="cookie-banner-label">Preferenze cookie</p>
      <h2 id="cookie-banner-title">Cookies</h2>
      <p>Usiamo cookie tecnici necessari e, solo con il tuo consenso, Google Analytics per comprendere in forma aggregata come viene utilizzato il sito.</p>
    </div>
    <div class="cookie-banner-actions">
      <button class="cookie-button cookie-button-primary" type="button" data-cookie-action="accept">Accetta</button>
      <button class="cookie-button cookie-button-secondary" type="button" data-cookie-action="reject">Rifiuta</button>
      <button class="cookie-button cookie-button-secondary" type="button" data-cookie-action="preferences">Gestisci preferenze</button>
      <a href="/cookie-policy/">Cookie Policy</a>
    </div>`;

  cookiePreferencesDialog = document.createElement("section");
  cookiePreferencesDialog.className = "cookie-preferences";
  cookiePreferencesDialog.hidden = true;
  cookiePreferencesDialog.setAttribute("role", "dialog");
  cookiePreferencesDialog.setAttribute("aria-modal", "true");
  cookiePreferencesDialog.setAttribute("aria-labelledby", "cookie-preferences-title");
  cookiePreferencesDialog.innerHTML = `
    <div class="cookie-preferences-panel">
      <p class="cookie-banner-label">Preferenze cookie</p>
      <h2 id="cookie-preferences-title">Gestisci Analytics</h2>
      <p>I cookie tecnici necessari restano sempre attivi. Google Analytics viene caricato solo se selezioni questa opzione.</p>
      <label class="cookie-checkbox">
        <input type="checkbox" name="analytics-consent">
        <span>Consento l’uso di Google Analytics</span>
      </label>
      <div class="cookie-preferences-actions">
        <button class="cookie-button cookie-button-secondary" type="button" data-cookie-action="close">Chiudi</button>
        <button class="cookie-button cookie-button-primary" type="button" data-cookie-action="save">Salva preferenze</button>
      </div>
      <a href="/privacy-policy/">Leggi la Privacy Policy</a>
    </div>`;

  document.body.append(banner, cookiePreferencesDialog);

  const setChoice = (choice) => {
    setConsent(choice);
    banner.hidden = true;
    if (choice === "analytics") {
      loadAnalytics();
    } else {
      window[`ga-disable-${ANALYTICS_MEASUREMENT_ID}`] = true;
      if (typeof window.gtag === "function") window.gtag("consent", "update", { analytics_storage: "denied" });
      removeAnalyticsCookies();
    }
  };

  const openPreferences = () => {
    cookiePreferencesTrigger = document.activeElement;
    const checkbox = cookiePreferencesDialog.querySelector("input[name='analytics-consent']");
    if (checkbox instanceof HTMLInputElement) checkbox.checked = getCookie(CONSENT_COOKIE_NAME) === "analytics";
    cookiePreferencesDialog.hidden = false;
    document.body.classList.add("cookie-preferences-open");
    window.setTimeout(() => checkbox?.focus(), 0);
  };

  const closePreferences = () => {
    cookiePreferencesDialog.hidden = true;
    document.body.classList.remove("cookie-preferences-open");
    if (cookiePreferencesTrigger instanceof HTMLElement) cookiePreferencesTrigger.focus();
  };

  banner.addEventListener("click", (event) => {
    const action = event.target instanceof Element && event.target.closest("[data-cookie-action]")?.getAttribute("data-cookie-action");
    if (action === "accept") setChoice("analytics");
    if (action === "reject") setChoice("necessary");
    if (action === "preferences") openPreferences();
  });

  cookiePreferencesDialog.addEventListener("click", (event) => {
    const action = event.target instanceof Element && event.target.closest("[data-cookie-action]")?.getAttribute("data-cookie-action");
    if (action === "close") closePreferences();
    if (action === "save") {
      const checkbox = cookiePreferencesDialog.querySelector("input[name='analytics-consent']");
      setChoice(checkbox instanceof HTMLInputElement && checkbox.checked ? "analytics" : "necessary");
      closePreferences();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !cookiePreferencesDialog.hidden) {
      event.preventDefault();
      closePreferences();
    }
  });

  document.querySelectorAll(".footer-bottom").forEach((footer) => {
    const button = document.createElement("button");
    button.className = "cookie-preferences-trigger";
    button.type = "button";
    button.textContent = "Preferenze cookie";
    button.addEventListener("click", openPreferences);
    footer.append(button);
  });

  const consent = getCookie(CONSENT_COOKIE_NAME);
  if (consent === "analytics") {
    banner.hidden = true;
    loadAnalytics();
  } else if (consent === "necessary") {
    banner.hidden = true;
  }
}

createCookieControls();
