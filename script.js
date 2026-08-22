(() => {
  "use strict";

  const WEB_APP_URL = "https://script.google.com/macros/s/AKfycbxiHfl1I-xEvFK4c41OLd4IMY9CxH6CwP9xyQs7xCLCrM6OEu-J_VSE_RcHjI_2mbjTGA/exec";
  const TOKEN_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  const REDUCED_MOTION = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const FALLBACK_IMAGES = Object.freeze({
    A_BIG_MAC: "menu-big-mac.webp",
    A_CUARTO_LIBRA: "menu-cuarto-libra.png",
    A_BIG_TASTY: "menu-big-tasty.jpg",
    A_MCFIZZ_ROSA: "drink-mcfizz-rosa.jpg",
    A_MCFIZZ_AZUL: "drink-mcfizz-azul.jpg",
    A_MCFIZZ_VERDE: "drink-mcfizz-verde.jpg",
    N_CAJITA_QUESO: "menu-cajita-quesoburguesa.jpg",
    N_CAJITA_NUGGETS: "menu-cajita-nuggets.png",
    N_JAMAICA: "drink-jamaica.jpg",
    N_NARANJA: "drink-naranja.jpg",
    N_MANZANA: "drink-manzana.png"
  });

  const params = new URLSearchParams(window.location.search);
  const token = (params.get("i") || "").trim();

  const intro = document.getElementById("intro");
  const openInvitation = document.getElementById("openInvitation");
  const inviteWrap = document.getElementById("inviteWrap");
  const replayButton = document.getElementById("replayButton");
  const rsvpButton = document.getElementById("rsvpButton");
  const statusPill = document.getElementById("statusPill");
  const statusText = document.getElementById("statusText");

  const modal = document.getElementById("rsvpModal");
  const rsvpSheet = modal.querySelector(".rsvp-sheet");
  const modalClose = document.getElementById("modalClose");
  const rsvpLoading = document.getElementById("rsvpLoading");
  const rsvpContent = document.getElementById("rsvpContent");
  const rsvpMessage = document.getElementById("rsvpMessage");
  const familyNote = document.getElementById("familyNote");
  const currentAnswer = document.getElementById("currentAnswer");
  const rsvpProgress = document.getElementById("rsvpProgress");

  const attendanceStep = document.getElementById("attendanceStep");
  const menuStep = document.getElementById("menuStep");
  const summaryStep = document.getElementById("summaryStep");
  const counterList = document.getElementById("counterList");
  const adultRow = document.getElementById("adultRow");
  const childRow = document.getElementById("childRow");
  const adultLimit = document.getElementById("adultLimit");
  const childLimit = document.getElementById("childLimit");
  const adultCount = document.getElementById("adultCount");
  const childCount = document.getElementById("childCount");
  const toMenuButton = document.getElementById("toMenuButton");
  const declineButton = document.getElementById("declineButton");

  const guestProgressText = document.getElementById("guestProgressText");
  const guestTitle = document.getElementById("guestTitle");
  const guestTypePill = document.getElementById("guestTypePill");
  const foodOptions = document.getElementById("foodOptions");
  const drinkOptions = document.getElementById("drinkOptions");
  const menuBackButton = document.getElementById("menuBackButton");
  const menuNextButton = document.getElementById("menuNextButton");

  const summaryCounts = document.getElementById("summaryCounts");
  const summaryList = document.getElementById("summaryList");
  const editMenusButton = document.getElementById("editMenusButton");
  const confirmButton = document.getElementById("confirmButton");
  const rsvpHelp = document.getElementById("rsvpHelp");
  const toast = document.getElementById("toast");

  let opened = false;
  let state = null;
  let adults = 0;
  let children = 0;
  let catalog = [];
  let selections = new Map();
  let guestIndex = 0;
  let busy = false;
  let lastFocus = null;
  let toastTimer = null;

  function revealInvitation({ instant = false } = {}) {
    if (opened) return;
    opened = true;

    window.scrollTo({ top: 0, behavior: "auto" });

    if (instant || REDUCED_MOTION) {
      intro.classList.add("is-gone");
      inviteWrap.classList.add("is-visible");
      return;
    }

    intro.classList.add("opening");

    window.setTimeout(() => {
      intro.classList.add("is-gone");
      inviteWrap.classList.add("is-visible");
      window.scrollTo({ top: 0, behavior: "auto" });
    }, 1460);
  }

  function replayInvitation() {
    opened = false;
    inviteWrap.classList.remove("is-visible");
    window.scrollTo({ top: 0, behavior: "auto" });
    intro.classList.remove("is-gone", "is-hidden", "opening");
    void intro.offsetWidth;
    openInvitation.focus({ preventScroll: true });
  }

  function showToast(message) {
    clearTimeout(toastTimer);
    toast.textContent = message;
    toast.classList.add("show");
    toastTimer = window.setTimeout(() => toast.classList.remove("show"), 3300);
  }

  function isValidToken() {
    return TOKEN_RE.test(token);
  }

  function jsonpStatus() {
    return new Promise((resolve, reject) => {
      if (!isValidToken()) {
        reject(new Error("INVALID_TOKEN"));
        return;
      }

      const callbackName = "__mavisStatus_" + Date.now() + "_" + Math.floor(Math.random() * 100000);
      const script = document.createElement("script");
      let settled = false;

      const cleanup = () => {
        if (script.parentNode) script.parentNode.removeChild(script);
        try { delete window[callbackName]; } catch (_) { window[callbackName] = undefined; }
      };

      const timer = window.setTimeout(() => {
        if (settled) return;
        settled = true;
        cleanup();
        reject(new Error("STATUS_TIMEOUT"));
      }, 9000);

      window[callbackName] = (payload) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        cleanup();
        resolve(payload);
      };

      script.onerror = () => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        cleanup();
        reject(new Error("STATUS_NETWORK"));
      };

      const url = new URL(WEB_APP_URL);
      url.searchParams.set("action", "status");
      url.searchParams.set("i", token);
      url.searchParams.set("callback", callbackName);
      url.searchParams.set("_", Date.now().toString());
      script.src = url.toString();
      script.referrerPolicy = "no-referrer";
      document.head.appendChild(script);
    });
  }

  function updateCardStatus(payload) {
    if (payload && payload.code === "PREVIEW") {
      statusText.textContent = "Invitación digital";
      statusPill.classList.remove("is-error");
      rsvpButton.innerHTML = '<span aria-hidden="true">♥</span> Confirmar asistencia';
      return;
    }

    if (!payload || !payload.ok) {
      statusText.textContent = "Enlace de invitación no válido";
      statusPill.classList.add("is-error");
      rsvpButton.textContent = "Ver RSVP";
      return;
    }

    statusPill.classList.remove("is-error");

    if (!payload.rsvpOpen) {
      statusText.textContent = "RSVP cerrado";
      rsvpButton.textContent = "Ver respuesta";
      return;
    }

    if (payload.status === "CONFIRMADO") {
      statusText.textContent = "¡Gracias por confirmar!";
      rsvpButton.innerHTML = '<span aria-hidden="true">♥</span> Modificar respuesta';
      return;
    }

    if (payload.status === "NO_ASISTE") {
      statusText.textContent = "Respuesta registrada";
      rsvpButton.innerHTML = '<span aria-hidden="true">♥</span> Modificar respuesta';
      return;
    }

    statusText.textContent = "Confirma tu asistencia";
    rsvpButton.innerHTML = '<span aria-hidden="true">♥</span> Confirmar asistencia';
  }

  function setMessage(message = "", type = "") {
    rsvpMessage.textContent = message;
    rsvpMessage.className = "rsvp-message";
    if (type) rsvpMessage.classList.add("is-" + type);
  }

  function setBusy(value) {
    busy = value;
    const selectors = [
      ".step-btn", ".menu-option", "#toMenuButton", "#declineButton",
      "#menuBackButton", "#menuNextButton", "#editMenusButton", "#confirmButton"
    ];
    document.querySelectorAll(selectors.join(",")).forEach((button) => {
      button.disabled = value;
    });
    renderCounts();
    if (!menuStep.hidden) renderGuestChooser();
  }

  function normalizeCatalog(items) {
    if (!Array.isArray(items)) return [];
    return items
      .filter((item) => item && item.active !== false)
      .map((item) => ({
        id: String(item.id || "").trim(),
        category: String(item.category || "").trim().toUpperCase(),
        guestType: String(item.guestType || "").trim().toUpperCase(),
        name: String(item.name || "").trim(),
        image: String(item.image || FALLBACK_IMAGES[item.id] || "").trim(),
        order: Number(item.order || 0)
      }))
      .filter((item) => item.id && item.name && ["COMIDA", "BEBIDA"].includes(item.category))
      .sort((a, b) => a.order - b.order || a.name.localeCompare(b.name, "es"));
  }

  function optionById(id) {
    return catalog.find((item) => item.id === id) || null;
  }

  function catalogFor(guestType, category) {
    return catalog.filter((item) => item.guestType === guestType && item.category === category);
  }

  function buildGuests() {
    const guests = [];
    for (let i = 1; i <= adults; i++) {
      guests.push({ slot: "A" + i, type: "ADULTO", label: "Adulto " + i });
    }
    for (let i = 1; i <= children; i++) {
      guests.push({ slot: "N" + i, type: "NINO", label: "Niño " + i });
    }
    return guests;
  }

  function reconcileSelections() {
    const guests = buildGuests();
    const allowed = new Set(guests.map((guest) => guest.slot));

    Array.from(selections.keys()).forEach((slot) => {
      if (!allowed.has(slot)) selections.delete(slot);
    });

    guests.forEach((guest) => {
      const current = selections.get(guest.slot);
      if (!current) {
        selections.set(guest.slot, { type: guest.type, menuId: "", drinkId: "" });
        return;
      }
      current.type = guest.type;
    });
  }

  function seedSelections(payload) {
    selections = new Map();
    if (Array.isArray(payload.menuSelections)) {
      payload.menuSelections.forEach((item) => {
        const slot = String(item.slot || "").trim().toUpperCase();
        if (!slot) return;
        selections.set(slot, {
          type: String(item.type || "").trim().toUpperCase(),
          menuId: String(item.menuId || "").trim(),
          drinkId: String(item.drinkId || "").trim()
        });
      });
    }
    reconcileSelections();
  }

  function setCount(type, value) {
    if (!state || !state.ok || busy) return;

    const max = type === "adults" ? state.adultsMax : state.childrenMax;
    const clamped = Math.max(0, Math.min(max, value));

    if (type === "adults") adults = clamped;
    else children = clamped;

    reconcileSelections();
    renderCounts();
  }

  function renderCounts() {
    adultCount.value = adults;
    adultCount.textContent = adults;
    childCount.value = children;
    childCount.textContent = children;

    if (!state || !state.ok) return;

    adultRow.hidden = state.adultsMax === 0;
    childRow.hidden = state.childrenMax === 0;

    adultLimit.textContent = "Máximo " + state.adultsMax;
    childLimit.textContent = "Máximo " + state.childrenMax;

    document.querySelectorAll('[data-counter="adults"]').forEach((btn) => {
      const delta = Number(btn.dataset.delta);
      btn.disabled = busy || (delta < 0 ? adults <= 0 : adults >= state.adultsMax);
    });

    document.querySelectorAll('[data-counter="children"]').forEach((btn) => {
      const delta = Number(btn.dataset.delta);
      btn.disabled = busy || (delta < 0 ? children <= 0 : children >= state.childrenMax);
    });

    toMenuButton.disabled = busy || adults + children < 1 || !state.menuSelectionEnabled;
  }

  function seedCounts(payload) {
    if (payload.status === "CONFIRMADO") {
      adults = Number(payload.adultsConfirmed || 0);
      children = Number(payload.childrenConfirmed || 0);
      return;
    }

    adults = payload.adultsMax > 0 ? 1 : 0;
    children = adults === 0 && payload.childrenMax > 0 ? 1 : 0;
  }

  function renderCurrentAnswer(payload) {
    if (payload.status === "CONFIRMADO") {
      currentAnswer.hidden = false;
      currentAnswer.textContent =
        "Respuesta actual: " +
        payload.adultsConfirmed + " adulto" + (payload.adultsConfirmed === 1 ? "" : "s") +
        " y " +
        payload.childrenConfirmed + " niño" + (payload.childrenConfirmed === 1 ? "" : "s") +
        ". Los menús guardados aparecerán preseleccionados.";
      return;
    }

    if (payload.status === "NO_ASISTE") {
      currentAnswer.hidden = false;
      currentAnswer.textContent = "Respuesta actual: indicaron que no podrán asistir.";
      return;
    }

    currentAnswer.hidden = true;
    currentAnswer.textContent = "";
  }

  function showStep(name) {
    const panels = {
      attendance: attendanceStep,
      menus: menuStep,
      summary: summaryStep
    };
    const order = ["attendance", "menus", "summary"];
    const currentIndex = order.indexOf(name);

    Object.entries(panels).forEach(([key, panel]) => {
      panel.hidden = key !== name;
      panel.classList.toggle("is-active", key === name);
    });

    rsvpProgress.querySelectorAll("[data-progress]").forEach((item) => {
      const index = order.indexOf(item.dataset.progress);
      item.classList.toggle("is-active", index === currentIndex);
      item.classList.toggle("is-done", index < currentIndex);
    });

    if (name === "menus") renderGuestChooser();
    if (name === "summary") renderSummary();

    requestAnimationFrame(() => {
      try { rsvpSheet.scrollTo({ top: 0, behavior: REDUCED_MOTION ? "auto" : "smooth" }); } catch (_) {}
    });
  }

  function scrollGuestChooserToStart({ announce = false } = {}) {
    requestAnimationFrame(() => {
      try {
        const sheetRect = rsvpSheet.getBoundingClientRect();
        const menuRect = menuStep.getBoundingClientRect();
        const targetTop = Math.max(0, rsvpSheet.scrollTop + menuRect.top - sheetRect.top - 12);
        rsvpSheet.scrollTo({
          top: targetTop,
          behavior: REDUCED_MOTION ? "auto" : "smooth"
        });
      } catch (_) {
        try { rsvpSheet.scrollTop = 0; } catch (_) {}
      }

      const head = menuStep.querySelector(".guest-step-head");
      if (head) {
        head.classList.remove("guest-turn-cue");
        void head.offsetWidth;
        head.classList.add("guest-turn-cue");
        window.setTimeout(() => head.classList.remove("guest-turn-cue"), 850);
      }

      if (announce) {
        const guests = buildGuests();
        const guest = guests[guestIndex];
        if (guest) {
          guestTitle.setAttribute("aria-live", "polite");
        }
      }
    });
  }

  function optionImagePath(option) {
    const file = option && (option.image || FALLBACK_IMAGES[option.id]);
    return file ? "assets/" + file : "";
  }

  function renderOptionGrid(container, options, selectedId, fieldName, guest) {
    container.replaceChildren();

    options.forEach((option) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "menu-option" + (option.id === selectedId ? " is-selected" : "");
      button.dataset.optionId = option.id;
      button.setAttribute("aria-pressed", option.id === selectedId ? "true" : "false");
      button.disabled = busy;

      const img = document.createElement("img");
      img.src = optionImagePath(option);
      img.alt = "";
      img.loading = "lazy";
      img.decoding = "async";

      const label = document.createElement("span");
      label.className = "option-name";
      label.textContent = option.name;

      button.append(img, label);
      button.addEventListener("click", () => {
        if (busy) return;
        const choice = selections.get(guest.slot) || { type: guest.type, menuId: "", drinkId: "" };
        choice[fieldName] = option.id;
        selections.set(guest.slot, choice);
        setMessage("");
        renderGuestChooser();
      });

      container.appendChild(button);
    });
  }

  function guestChoiceComplete(guest) {
    const choice = selections.get(guest.slot);
    return Boolean(choice && choice.menuId && choice.drinkId);
  }

  function renderGuestChooser() {
    const guests = buildGuests();
    if (!guests.length) {
      showStep("attendance");
      setMessage("Selecciona al menos una persona para continuar.", "error");
      return;
    }

    guestIndex = Math.max(0, Math.min(guestIndex, guests.length - 1));
    const guest = guests[guestIndex];
    const choice = selections.get(guest.slot) || { type: guest.type, menuId: "", drinkId: "" };
    selections.set(guest.slot, choice);

    guestProgressText.textContent = (guestIndex + 1) + " de " + guests.length;
    guestTitle.textContent = guest.label;
    guestTypePill.textContent = guest.type === "ADULTO" ? "Adulto" : "Niño";

    renderOptionGrid(foodOptions, catalogFor(guest.type, "COMIDA"), choice.menuId, "menuId", guest);
    renderOptionGrid(drinkOptions, catalogFor(guest.type, "BEBIDA"), choice.drinkId, "drinkId", guest);

    menuBackButton.disabled = busy;
    menuNextButton.disabled = busy || !guestChoiceComplete(guest);
    if (guestIndex === guests.length - 1) {
      menuNextButton.textContent = "Revisar →";
    } else {
      menuNextButton.textContent = "Siguiente: " + guests[guestIndex + 1].label + " →";
    }
  }

  function createSummaryPick(label, option) {
    const wrap = document.createElement("div");
    wrap.className = "summary-pick";

    const img = document.createElement("img");
    img.src = optionImagePath(option);
    img.alt = "";
    img.loading = "lazy";

    const text = document.createElement("div");
    const small = document.createElement("small");
    small.textContent = label;
    const name = document.createElement("span");
    name.textContent = option ? option.name : "Sin seleccionar";
    text.append(small, name);

    wrap.append(img, text);
    return wrap;
  }

  function renderSummary() {
    const guests = buildGuests();
    summaryCounts.replaceChildren();

    const adultChip = document.createElement("span");
    adultChip.textContent = adults + " adulto" + (adults === 1 ? "" : "s");
    const childChip = document.createElement("span");
    childChip.textContent = children + " niño" + (children === 1 ? "" : "s");
    summaryCounts.append(adultChip, childChip);

    summaryList.replaceChildren();
    guests.forEach((guest) => {
      const choice = selections.get(guest.slot) || {};
      const person = document.createElement("div");
      person.className = "summary-person";

      const title = document.createElement("strong");
      title.textContent = guest.label;

      const picks = document.createElement("div");
      picks.className = "summary-picks";
      picks.append(
        createSummaryPick("Menú", optionById(choice.menuId)),
        createSummaryPick("Bebida", optionById(choice.drinkId))
      );

      person.append(title, picks);
      summaryList.appendChild(person);
    });

    confirmButton.disabled = busy || !allSelectionsComplete();
  }

  function allSelectionsComplete() {
    const guests = buildGuests();
    return guests.length > 0 && guests.every(guestChoiceComplete);
  }

  function canonicalSelectionsFromUi() {
    return buildGuests().map((guest) => {
      const choice = selections.get(guest.slot) || {};
      return {
        slot: guest.slot,
        type: guest.type,
        menuId: choice.menuId || "",
        drinkId: choice.drinkId || ""
      };
    });
  }

  function canonicalSelectionsFromPayload(payload) {
    if (!payload || !Array.isArray(payload.menuSelections)) return [];
    return payload.menuSelections
      .map((item) => ({
        slot: String(item.slot || "").trim().toUpperCase(),
        type: String(item.type || "").trim().toUpperCase(),
        menuId: String(item.menuId || "").trim(),
        drinkId: String(item.drinkId || "").trim()
      }))
      .sort((a, b) => a.slot.localeCompare(b.slot));
  }

  function selectionSignature(items) {
    return [...items]
      .sort((a, b) => a.slot.localeCompare(b.slot))
      .map((item) => [item.slot, item.type, item.menuId, item.drinkId].join("|"))
      .join(";");
  }

  function renderRsvp(payload) {
    state = payload;
    updateCardStatus(payload);

    rsvpLoading.hidden = true;
    rsvpContent.hidden = false;
    setMessage("");

    if (!payload || !payload.ok) {
      familyNote.hidden = true;
      rsvpProgress.hidden = true;
      attendanceStep.hidden = true;
      menuStep.hidden = true;
      summaryStep.hidden = true;
      rsvpHelp.textContent = "Este enlace no permite registrar una respuesta.";
      setMessage(payload && payload.message ? payload.message : "No pudimos consultar esta invitación.", "error");
      return;
    }

    familyNote.hidden = false;
    rsvpProgress.hidden = false;
    attendanceStep.hidden = false;
    catalog = normalizeCatalog(payload.catalog);

    seedCounts(payload);
    seedSelections(payload);
    renderCounts();
    renderCurrentAnswer(payload);
    guestIndex = 0;
    showStep("attendance");

    if (!payload.menuSelectionEnabled) {
      setBusy(true);
      rsvpHelp.textContent = "La selección de menús todavía no está habilitada en el servidor.";
      setMessage("Esta versión de la invitación necesita Mavis RSVP R4 para guardar menús y bebidas.", "error");
      return;
    }

    const catalogReady =
      catalogFor("ADULTO", "COMIDA").length >= 3 &&
      catalogFor("ADULTO", "BEBIDA").length >= 3 &&
      catalogFor("NINO", "COMIDA").length >= 2 &&
      catalogFor("NINO", "BEBIDA").length >= 3;

    if (!catalogReady) {
      setBusy(true);
      rsvpHelp.textContent = "El catálogo de menús está incompleto.";
      setMessage("No pudimos cargar todas las opciones de menú. Intenta nuevamente más tarde.", "error");
      return;
    }

    if (!payload.rsvpOpen) {
      setBusy(true);
      rsvpHelp.textContent = payload.deadline
        ? "El período de confirmación ya finalizó."
        : "El RSVP no está disponible.";
      setMessage("El período de confirmación ya está cerrado.", "error");
    } else {
      setBusy(false);
      rsvpHelp.textContent = "Puedes modificar la confirmación familiar mientras el RSVP esté abierto.";
    }
  }

  async function loadStatus({ silent = false } = {}) {
    if (!isValidToken()) {
      const previewPayload = {
        ok: false,
        code: token ? "INVALID_TOKEN" : "PREVIEW",
        message: token
          ? "Este enlace de invitación no es válido."
          : "Esta es la vista previa general. Para confirmar asistencia abre el enlace personalizado que recibió tu familia."
      };

      if (!silent) renderRsvp(previewPayload);
      updateCardStatus(previewPayload);
      return previewPayload;
    }

    try {
      const payload = await jsonpStatus();
      if (!silent) renderRsvp(payload);
      else {
        state = payload;
        updateCardStatus(payload);
      }
      return payload;
    } catch (_) {
      const payload = {
        ok: false,
        code: "NETWORK",
        message: "No pudimos conectarnos para consultar tu invitación. Intenta nuevamente."
      };
      if (!silent) renderRsvp(payload);
      return payload;
    }
  }

  function openModal() {
    lastFocus = document.activeElement;
    modal.hidden = false;
    document.body.classList.add("modal-open");
    rsvpLoading.hidden = false;
    rsvpContent.hidden = true;
    setMessage("");
    modalClose.focus({ preventScroll: true });
    loadStatus();
  }

  function closeModal() {
    modal.hidden = true;
    document.body.classList.remove("modal-open");
    if (lastFocus && typeof lastFocus.focus === "function") lastFocus.focus({ preventScroll: true });
  }

  function createRequestId() {
    const uuid = (window.crypto && crypto.randomUUID)
      ? crypto.randomUUID()
      : Math.random().toString(36).slice(2) + Date.now().toString(36);
    return "MAVISWEB-" + Date.now() + "-" + uuid;
  }

  function pendingKey() {
    return "mavis-rsvp-r4-pending";
  }

  function getPending(desired) {
    try {
      const raw = sessionStorage.getItem(pendingKey());
      if (!raw) return null;
      const item = JSON.parse(raw);
      const same =
        item &&
        item.token === token &&
        item.revision === desired.revision &&
        item.decision === desired.decision &&
        item.adults === desired.adults &&
        item.children === desired.children &&
        item.selectionSignature === desired.selectionSignature;

      return same ? item : null;
    } catch (_) {
      return null;
    }
  }

  function savePending(item) {
    try { sessionStorage.setItem(pendingKey(), JSON.stringify(item)); } catch (_) {}
  }

  function clearPending() {
    try { sessionStorage.removeItem(pendingKey()); } catch (_) {}
  }

  function postOpaque(formData) {
    return new Promise((resolve) => {
      const frameName = "mavisPostFrame_" + Date.now();
      const iframe = document.createElement("iframe");
      iframe.name = frameName;
      iframe.hidden = true;
      iframe.referrerPolicy = "no-referrer";

      const form = document.createElement("form");
      form.method = "POST";
      form.action = WEB_APP_URL;
      form.target = frameName;
      form.hidden = true;
      form.referrerPolicy = "no-referrer";

      Object.entries(formData).forEach(([name, value]) => {
        const input = document.createElement("input");
        input.type = "hidden";
        input.name = name;
        input.value = String(value);
        form.appendChild(input);
      });

      document.body.appendChild(iframe);
      document.body.appendChild(form);
      form.submit();

      window.setTimeout(() => {
        form.remove();
        iframe.remove();
        resolve();
      }, 850);
    });
  }

  function desiredMatches(payload, desired) {
    if (!payload || !payload.ok) return false;

    if (desired.decision === "NO_ASISTE") {
      return payload.status === "NO_ASISTE" &&
        Number(payload.adultsConfirmed || 0) === 0 &&
        Number(payload.childrenConfirmed || 0) === 0 &&
        canonicalSelectionsFromPayload(payload).length === 0;
    }

    if (
      payload.status !== "CONFIRMADO" ||
      Number(payload.adultsConfirmed || 0) !== desired.adults ||
      Number(payload.childrenConfirmed || 0) !== desired.children
    ) return false;

    return selectionSignature(canonicalSelectionsFromPayload(payload)) === desired.selectionSignature;
  }

  async function verifyWrite(desired) {
    const deadline = Date.now() + 10000;
    let latest = null;

    while (Date.now() < deadline) {
      await new Promise((resolve) => setTimeout(resolve, 650));

      try {
        latest = await jsonpStatus();
      } catch (_) {
        continue;
      }

      if (!latest || !latest.ok) continue;

      if (!latest.rsvpOpen) {
        return { kind: "closed", payload: latest };
      }

      if (desiredMatches(latest, desired) && latest.revision >= desired.revision) {
        return { kind: "saved", payload: latest };
      }

      if (latest.revision > desired.revision) {
        return { kind: "conflict", payload: latest };
      }
    }

    return { kind: "unknown", payload: latest };
  }

  async function submitDecision(decision) {
    if (busy || !state || !state.ok) return;

    if (!state.rsvpOpen) {
      setMessage("El período de confirmación ya está cerrado.", "error");
      return;
    }

    if (!state.menuSelectionEnabled) {
      setMessage("La selección de menús todavía no está habilitada en el servidor.", "error");
      return;
    }

    const desiredAdults = decision === "CONFIRMADO" ? adults : 0;
    const desiredChildren = decision === "CONFIRMADO" ? children : 0;
    const desiredSelections = decision === "CONFIRMADO" ? canonicalSelectionsFromUi() : [];

    if (decision === "CONFIRMADO" && desiredAdults + desiredChildren < 1) {
      showStep("attendance");
      setMessage("Selecciona al menos una persona para confirmar.", "error");
      return;
    }

    if (decision === "CONFIRMADO" && !allSelectionsComplete()) {
      const guests = buildGuests();
      const firstIncomplete = guests.findIndex((guest) => !guestChoiceComplete(guest));
      guestIndex = firstIncomplete >= 0 ? firstIncomplete : 0;
      showStep("menus");
      setMessage("Selecciona un menú y una bebida para cada persona.", "error");
      return;
    }

    const desired = {
      token,
      revision: Number(state.revision || 0),
      decision,
      adults: desiredAdults,
      children: desiredChildren,
      selections: desiredSelections,
      selectionSignature: selectionSignature(desiredSelections)
    };

    if (desiredMatches(state, desired)) {
      setMessage("Tu respuesta ya coincide con esos datos.", "success");
      return;
    }

    let pending = getPending(desired);
    if (!pending) {
      pending = { ...desired, requestId: createRequestId() };
      savePending(pending);
    }

    setBusy(true);
    setMessage("Guardando asistencia, menús y bebidas…");

    try {
      await postOpaque({
        action: "rsvp",
        i: token,
        requestId: pending.requestId,
        revision: pending.revision,
        decision: pending.decision,
        adults: pending.adults,
        children: pending.children,
        selections: JSON.stringify(pending.selections || [])
      });

      const verification = await verifyWrite(desired);

      if (verification.kind === "saved") {
        clearPending();
        renderRsvp(verification.payload);
        setMessage(
          decision === "CONFIRMADO"
            ? "¡Gracias por confirmar! Guardamos también los menús y bebidas de la familia."
            : "Tu respuesta quedó registrada. Gracias por avisarnos.",
          "success"
        );
        showToast("Confirmación guardada correctamente");
        return;
      }

      if (verification.kind === "conflict") {
        clearPending();
        renderRsvp(verification.payload);
        setMessage("La respuesta fue actualizada desde otro dispositivo. Te mostramos los datos más recientes.", "error");
        return;
      }

      if (verification.kind === "closed") {
        clearPending();
        renderRsvp(verification.payload);
        setMessage("El período de confirmación ya está cerrado.", "error");
        return;
      }

      const refreshed = await loadStatus({ silent: true });
      if (desiredMatches(refreshed, desired)) {
        clearPending();
        renderRsvp(refreshed);
        setMessage("¡Gracias! Tu confirmación y menús quedaron registrados.", "success");
        return;
      }

      setMessage("No pudimos verificar el guardado. Revisa tu conexión e intenta nuevamente; si el servidor ya lo recibió, reutilizaremos la misma solicitud.", "error");
    } catch (_) {
      setMessage("No pudimos completar la verificación. Intenta nuevamente.", "error");
    } finally {
      setBusy(false);
    }
  }

  openInvitation.addEventListener("click", () => revealInvitation());
  replayButton.addEventListener("click", replayInvitation);
  rsvpButton.addEventListener("click", openModal);
  modalClose.addEventListener("click", closeModal);

  modal.addEventListener("click", (event) => {
    if (event.target === modal) closeModal();
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !modal.hidden) closeModal();
  });

  document.querySelectorAll(".step-btn").forEach((button) => {
    button.addEventListener("click", () => {
      if (busy) return;
      const type = button.dataset.counter;
      const delta = Number(button.dataset.delta || 0);
      setMessage("");
      setCount(type, (type === "adults" ? adults : children) + delta);
    });
  });

  toMenuButton.addEventListener("click", () => {
    if (busy || !state || !state.ok) return;
    if (!state.menuSelectionEnabled) {
      setMessage("La selección de menús todavía no está habilitada en el servidor.", "error");
      return;
    }
    if (adults + children < 1) {
      setMessage("Selecciona al menos una persona para continuar.", "error");
      return;
    }
    reconcileSelections();
    guestIndex = 0;
    setMessage("");
    showStep("menus");
  });

  menuBackButton.addEventListener("click", () => {
    if (busy) return;
    if (guestIndex > 0) {
      guestIndex--;
      setMessage("");
      renderGuestChooser();
      scrollGuestChooserToStart({ announce: true });
      return;
    }
    setMessage("");
    showStep("attendance");
  });

  menuNextButton.addEventListener("click", () => {
    if (busy) return;
    const guests = buildGuests();
    const guest = guests[guestIndex];
    if (!guest || !guestChoiceComplete(guest)) {
      setMessage("Selecciona el menú y la bebida antes de continuar.", "error");
      return;
    }

    setMessage("");
    if (guestIndex < guests.length - 1) {
      guestIndex++;
      renderGuestChooser();
      scrollGuestChooserToStart({ announce: true });
    } else {
      showStep("summary");
    }
  });

  editMenusButton.addEventListener("click", () => {
    if (busy) return;
    setMessage("");
    showStep("attendance");
  });

  confirmButton.addEventListener("click", () => submitDecision("CONFIRMADO"));
  declineButton.addEventListener("click", () => submitDecision("NO_ASISTE"));

  window.setTimeout(() => {
    loadStatus({ silent: true });
  }, 700);

  if (REDUCED_MOTION) {
    openInvitation.querySelector(".tap-label").textContent = "Abrir invitación";
  }
})();
