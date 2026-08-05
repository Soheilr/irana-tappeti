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
