(() => {
  "use strict";

  const WEB_APP_URL = "https://script.google.com/macros/s/AKfycbxiHfl1I-xEvFK4c41OLd4IMY9CxH6CwP9xyQs7xCLCrM6OEu-J_VSE_RcHjI_2mbjTGA/exec";
  const TOKEN_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  const REDUCED_MOTION = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

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
  const modalClose = document.getElementById("modalClose");
  const rsvpLoading = document.getElementById("rsvpLoading");
  const rsvpContent = document.getElementById("rsvpContent");
  const rsvpMessage = document.getElementById("rsvpMessage");
  const currentAnswer = document.getElementById("currentAnswer");
  const adultRow = document.getElementById("adultRow");
  const childRow = document.getElementById("childRow");
  const adultLimit = document.getElementById("adultLimit");
  const childLimit = document.getElementById("childLimit");
  const adultCount = document.getElementById("adultCount");
  const childCount = document.getElementById("childCount");
  const confirmButton = document.getElementById("confirmButton");
  const declineButton = document.getElementById("declineButton");
  const rsvpHelp = document.getElementById("rsvpHelp");
  const toast = document.getElementById("toast");

  let opened = false;
  let state = null;
  let adults = 0;
  let children = 0;
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

    // V4.0: keep the invitation completely hidden while the physical
    // envelope opens. The handoff happens only after the paper has risen,
    // eliminating the card/Moana overlay visible in the previous video.
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
    confirmButton.disabled = value;
    declineButton.disabled = value;
    document.querySelectorAll(".step-btn").forEach((btn) => btn.disabled = value);
  }

  function setCount(type, value) {
    if (!state || !state.ok) return;

    const max = type === "adults" ? state.adultsMax : state.childrenMax;
    const clamped = Math.max(0, Math.min(max, value));

    if (type === "adults") adults = clamped;
    else children = clamped;

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
        payload.childrenConfirmed + " niño" + (payload.childrenConfirmed === 1 ? "" : "s") + ".";
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

  function renderRsvp(payload) {
    state = payload;
    updateCardStatus(payload);

    rsvpLoading.hidden = true;
    rsvpContent.hidden = false;
    setMessage("");

    if (!payload || !payload.ok) {
      document.getElementById("counterList").hidden = true;
      document.querySelector(".rsvp-actions").hidden = true;
      rsvpHelp.textContent = "Este enlace no permite registrar una respuesta.";
      setMessage(payload && payload.message ? payload.message : "No pudimos consultar esta invitación.", "error");
      return;
    }

    document.getElementById("counterList").hidden = false;
    document.querySelector(".rsvp-actions").hidden = false;

    seedCounts(payload);
    renderCounts();
    renderCurrentAnswer(payload);

    if (!payload.rsvpOpen) {
      setBusy(true);
      rsvpHelp.textContent = payload.deadline
        ? "El período de confirmación ya finalizó."
        : "El RSVP no está disponible.";
      setMessage("El período de confirmación ya está cerrado.", "error");
    } else {
      setBusy(false);
      rsvpHelp.textContent = "Por favor confirma cuántos adultos y niños asistirán. Podrás modificar tu respuesta mientras el RSVP esté abierto.";
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
    return "mavis-rsvp-pending";
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
        item.children === desired.children;

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
        Number(payload.childrenConfirmed || 0) === 0;
    }

    return payload.status === "CONFIRMADO" &&
      Number(payload.adultsConfirmed || 0) === desired.adults &&
      Number(payload.childrenConfirmed || 0) === desired.children;
  }

  async function verifyWrite(desired) {
    const deadline = Date.now() + 9000;
    let latest = null;

    while (Date.now() < deadline) {
      await new Promise((resolve) => setTimeout(resolve, 620));

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

    const desiredAdults = decision === "CONFIRMADO" ? adults : 0;
    const desiredChildren = decision === "CONFIRMADO" ? children : 0;

    if (decision === "CONFIRMADO" && desiredAdults + desiredChildren < 1) {
      setMessage("Selecciona al menos una persona para confirmar.", "error");
      return;
    }

    if (desiredMatches(state, {
      decision,
      adults: desiredAdults,
      children: desiredChildren
    })) {
      setMessage("Tu respuesta ya coincide con esos datos.", "success");
      return;
    }

    const desired = {
      token,
      revision: Number(state.revision || 0),
      decision,
      adults: desiredAdults,
      children: desiredChildren
    };

    let pending = getPending(desired);
    if (!pending) {
      pending = { ...desired, requestId: createRequestId() };
      savePending(pending);
    }

    setBusy(true);
    setMessage("Guardando tu respuesta…");

    try {
      await postOpaque({
        action: "rsvp",
        i: token,
        requestId: pending.requestId,
        revision: pending.revision,
        decision: pending.decision,
        adults: pending.adults,
        children: pending.children
      });

      const verification = await verifyWrite(desired);

      if (verification.kind === "saved") {
        clearPending();
        renderRsvp(verification.payload);
        setMessage(
          decision === "CONFIRMADO"
            ? "¡Gracias por confirmar! Nos dará mucho gusto compartir este día con ustedes."
            : "Tu respuesta quedó registrada. Gracias por avisarnos.",
          "success"
        );
        showToast("Respuesta guardada correctamente");
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
        setMessage("¡Gracias! Tu respuesta quedó registrada.", "success");
        return;
      }

      setMessage("No pudimos verificar el guardado. Revisa tu conexión e intenta nuevamente; si el servidor ya lo recibió, reutilizaremos la misma solicitud.", "error");
    } catch (_) {
      setMessage("No pudimos completar la verificación. Intenta nuevamente.", "error");
    } finally {
      setBusy(false);
      renderCounts();
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

  confirmButton.addEventListener("click", () => submitDecision("CONFIRMADO"));
  declineButton.addEventListener("click", () => submitDecision("NO_ASISTE"));

  window.setTimeout(() => {
    loadStatus({ silent: true });
  }, 700);

  if (REDUCED_MOTION) {
    openInvitation.querySelector(".tap-label").textContent = "Abrir invitación";
  }
})();
