(function () {
  const PRICE = {
    base: {
      id: "base",
      name: "Массаж, 1 час",
      description: "Базовый сеанс всегда входит в визит. Темп и силу подберём на месте, после короткого разговора о самочувствии.",
      price: 5500,
      duration: 60
    },
    addons: [
      {
        id: "extra-hour",
        name: "+1 час массажа",
        description: "Продлевает сеанс ещё на час.",
        price: 4500,
        duration: 60,
        type: "qty",
        max: 2
      },
      {
        id: "second-guest",
        name: "Массаж для второго гостя",
        description: "Параллельный сеанс в одном визите. Длительность не складывается.",
        price: 5500,
        duration: 0,
        type: "qty",
        max: 2
      },
      {
        id: "head",
        name: "Массаж головы",
        description: "Мягкая работа с кожей головы и шейно-воротниковой зоной.",
        price: 1500,
        duration: 20,
        type: "toggle"
      },
      {
        id: "face",
        name: "Массаж лица",
        description: "Бережный массаж лица, шеи и декольте.",
        price: 2500,
        duration: 30,
        type: "toggle"
      },
      {
        id: "scrub",
        name: "Скраб тела",
        description: "Готовит кожу и делает массаж мягче.",
        price: 2000,
        duration: 20,
        type: "toggle"
      },
      {
        id: "oils",
        name: "Аромамасла",
        description: "Подберём спокойный аромат под ваш запрос.",
        price: 700,
        duration: 0,
        type: "toggle"
      },
      {
        id: "tea",
        name: "Чайная церемония после сеанса",
        description: "Тихие 20 минут, чтобы не выходить сразу в город.",
        price: 900,
        duration: 20,
        type: "toggle"
      }
    ],
    outcall: {
      surcharge: 1500,
      label: "Выезд на дом",
      note: "в пределах МКАД"
    },
    presets: [
      {
        id: "relax",
        name: "Релакс",
        description: "Голова, масла и чай после сеанса",
        addons: { head: 1, oils: 1, tea: 1 }
      },
      {
        id: "couple",
        name: "Для двоих",
        description: "Второй гость, масла и чай",
        addons: { "second-guest": 1, oils: 1, tea: 1 }
      },
      {
        id: "reboot",
        name: "Полная перезагрузка",
        description: "Ещё час, лицо, скраб, масла и чай",
        addons: { "extra-hour": 1, face: 1, scrub: 1, oils: 1, tea: 1 }
      }
    ],
    upsellId: "face"
  };

  const MASTERS = {
    "Анна": { outcall: true },
    "Мария": { outcall: true },
    "Елена": { outcall: true },
    "Ольга": { outcall: true },
    "Ирина": { outcall: true },
    "Дарья": { outcall: true }
  };

  const addonById = Object.fromEntries(PRICE.addons.map(function (item) {
    return [item.id, item];
  }));

  const state = {
    qty: {},
    format: "salon"
  };

  PRICE.addons.forEach(function (item) {
    state.qty[item.id] = 0;
  });

  const body = document.body;
  const burger = document.querySelector(".burger");
  const nav = document.getElementById("site-nav");
  const backdrop = document.querySelector(".nav-backdrop");
  const modal = document.getElementById("booking-modal");
  const modalForm = document.getElementById("modal-form");
  const modalSuccess = document.getElementById("modal-success");
  const pageForm = document.getElementById("booking-form");
  const pageSuccess = document.getElementById("booking-success");
  const pageReset = document.getElementById("booking-reset");
  const masterSelects = document.querySelectorAll("#field-master, #modal-master");
  const builderBar = document.getElementById("builder-bar");
  const bookingSection = document.getElementById("zapis");

  function money(value) {
    return value.toLocaleString("ru-RU") + "\u00a0₽";
  }

  function durationLabel(minutes) {
    if (minutes <= 0) return "без доп. времени";
    if (minutes < 60) return minutes + " мин";
    const hours = Math.floor(minutes / 60);
    const rest = minutes % 60;
    if (!rest) return hours + " ч";
    return hours + " ч " + rest + " мин";
  }

  function formatLabel(format) {
    return format === "outcall" ? "С выездом" : "В салоне";
  }

  function getQuantity(id) {
    return state.qty[id] || 0;
  }

  function setQuantity(id, value) {
    const addon = addonById[id];
    if (!addon) return;
    const max = addon.type === "qty" ? addon.max : 1;
    state.qty[id] = Math.max(0, Math.min(max, value));
  }

  function compute() {
    const lines = [
      { name: PRICE.base.name, price: PRICE.base.price, duration: PRICE.base.duration }
    ];
    let total = PRICE.base.price;
    let duration = PRICE.base.duration;
    let extras = 0;

    PRICE.addons.forEach(function (addon) {
      const qty = getQuantity(addon.id);
      if (!qty) return;
      extras += qty;
      const linePrice = addon.price * qty;
      const lineDuration = addon.duration * qty;
      const name = qty > 1 ? addon.name + " × " + qty : addon.name;
      lines.push({ name: name, price: linePrice, duration: lineDuration });
      total += linePrice;
      duration += lineDuration;
    });

    if (state.format === "outcall") {
      lines.push({
        name: PRICE.outcall.label + " (" + PRICE.outcall.note + ")",
        price: PRICE.outcall.surcharge,
        duration: 0
      });
      total += PRICE.outcall.surcharge;
    }

    return { lines: lines, total: total, duration: duration, extras: extras };
  }

  function visitText() {
    const result = compute();
    const rows = result.lines.map(function (line) {
      return "• " + line.name + " — " + money(line.price);
    });
    rows.push("Формат: " + formatLabel(state.format).toLowerCase());
    if (state.format === "outcall") {
      rows.push("Адрес выезда укажите ниже. " + PRICE.outcall.note + ", цена примерная.");
    }
    rows.push("Итого: " + money(result.total) + " · " + durationLabel(result.duration) + " (цены примерные)");
    return rows.join("\n");
  }

  function matchingPresetId() {
    return PRICE.presets.reduce(function (found, preset) {
      if (found) return found;
      const matches = PRICE.addons.every(function (addon) {
        const wanted = preset.addons[addon.id] || 0;
        return getQuantity(addon.id) === wanted;
      });
      return matches ? preset.id : null;
    }, null);
  }

  function applyPreset(id) {
    const preset = PRICE.presets.find(function (item) {
      return item.id === id;
    });
    if (!preset) return;
    if (matchingPresetId() === id) {
      PRICE.addons.forEach(function (addon) {
        setQuantity(addon.id, 0);
      });
    } else {
      PRICE.addons.forEach(function (addon) {
        setQuantity(addon.id, preset.addons[addon.id] || 0);
      });
    }
    render();
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function renderBase() {
    const root = document.getElementById("builder-base");
    if (!root) return;
    root.innerHTML =
      '<span class="builder__base-label">Основа визита</span>' +
      "<h3>" + escapeHtml(PRICE.base.name) + "</h3>" +
      "<p>" + escapeHtml(PRICE.base.description) + "</p>" +
      '<div class="builder__base-meta">' +
        '<span class="time">' + durationLabel(PRICE.base.duration) + "</span>" +
        "<span>" + money(PRICE.base.price) + "</span>" +
      "</div>";
  }

  function renderPresets() {
    const root = document.getElementById("builder-presets");
    if (!root) return;
    const active = matchingPresetId();
    root.innerHTML = PRICE.presets.map(function (preset) {
      const pressed = preset.id === active ? "true" : "false";
      return (
        '<button type="button" class="preset" data-preset="' +
        escapeHtml(preset.id) +
        '" aria-pressed="' +
        pressed +
        '">' +
        escapeHtml(preset.name) +
        "<small>" +
        escapeHtml(preset.description) +
        "</small></button>"
      );
    }).join("");
  }

  function renderAddons() {
    const root = document.getElementById("builder-addons");
    if (!root) return;
    root.innerHTML = PRICE.addons.map(function (addon) {
      const qty = getQuantity(addon.id);
      const on = qty > 0 ? " is-on" : "";
      const time = addon.duration
        ? '<span class="addon__time">+' + durationLabel(addon.duration) + "</span>"
        : (addon.id === "second-guest" ? '<span class="addon__time">параллельно</span>' : "");
      const controls = addon.type === "qty"
        ? (
          '<div class="stepper" role="group" aria-label="Количество: ' + escapeHtml(addon.name) + '">' +
            '<button type="button" data-step="' + addon.id + '" data-dir="-1" aria-label="Уменьшить" ' + (qty <= 0 ? "disabled" : "") + ">−</button>" +
            '<span class="stepper__value" aria-live="polite">' + qty + "</span>" +
            '<button type="button" data-step="' + addon.id + '" data-dir="1" aria-label="Увеличить" ' + (qty >= addon.max ? "disabled" : "") + ">+</button>" +
          "</div>"
        )
        : (
          '<button type="button" class="addon__switch" data-toggle="' + addon.id + '" aria-pressed="' + (qty ? "true" : "false") + '">' +
          (qty ? "Добавлено" : "Добавить") +
          "</button>"
        );
      return (
        '<li class="addon' + on + '">' +
          "<h3>" + escapeHtml(addon.name) + "</h3>" +
          '<div class="addon__meta">' +
            time +
            '<span class="addon__price">+' + money(addon.price) + "</span>" +
          "</div>" +
          "<p>" + escapeHtml(addon.description) + "</p>" +
          '<div class="addon__controls">' + controls + "</div>" +
        "</li>"
      );
    }).join("");
  }

  function renderFormat() {
    document.querySelectorAll('input[name="visit-format"]').forEach(function (input) {
      input.checked = input.value === state.format;
    });
    document.querySelectorAll("[data-sync-format]").forEach(function (input) {
      input.checked = input.value === state.format;
    });
    const note = document.getElementById("builder-format-note");
    if (note) {
      if (state.format === "outcall") {
        note.hidden = false;
        note.textContent = "+" + money(PRICE.outcall.surcharge) + " за выезд, " + PRICE.outcall.note + ". Цена примерная.";
      } else {
        note.hidden = true;
        note.textContent = "";
      }
    }
    toggleAddress(state.format === "outcall");
  }

  function toggleAddress(show) {
    [
      { wrap: "field-address-wrap", input: "field-address" },
      { wrap: "modal-address-wrap", input: "modal-address" }
    ].forEach(function (pair) {
      const wrap = document.getElementById(pair.wrap);
      const input = document.getElementById(pair.input);
      if (!wrap || !input) return;
      wrap.hidden = !show;
      input.required = show;
      if (!show) input.removeAttribute("required");
    });
  }

  function renderSummary() {
    const result = compute();
    const list = document.getElementById("summary-list");
    if (list) {
      list.innerHTML = result.lines.map(function (line) {
        return "<li><span>" + escapeHtml(line.name) + "</span><span>" + money(line.price) + "</span></li>";
      }).join("");
    }
    const duration = document.getElementById("summary-duration");
    if (duration) duration.textContent = "Длительность: " + durationLabel(result.duration);
    const total = document.getElementById("summary-total");
    if (total) total.textContent = money(result.total);
    const barTotal = document.getElementById("bar-total");
    if (barTotal) barTotal.textContent = money(result.total);
    const barDuration = document.getElementById("bar-duration");
    if (barDuration) barDuration.textContent = durationLabel(result.duration);

    const upsell = document.getElementById("builder-upsell");
    const offer = addonById[PRICE.upsellId];
    if (upsell && offer) {
      if (result.extras === 0) {
        upsell.hidden = false;
        upsell.innerHTML =
          'Добавить ' + escapeHtml(offer.name.toLowerCase()) + " за +" + money(offer.price) + "? " +
          '<button type="button" data-upsell="' + offer.id + '">Добавить</button>';
      } else {
        upsell.hidden = true;
        upsell.innerHTML = "";
      }
    }

    const text = visitText();
    const serviceFields = document.querySelectorAll("#field-service, #modal-service");
    serviceFields.forEach(function (field) {
      field.value = text;
    });
  }

  function updateMasterNotes() {
    masterSelects.forEach(function (select) {
      const form = select.closest("form") || document;
      const note = form.querySelector("#field-master-note, #modal-master-note") ||
        document.getElementById(select.id === "modal-master" ? "modal-master-note" : "field-master-note");
      if (!note) return;
      const name = select.value;
      if (name && MASTERS[name] && MASTERS[name].outcall) {
        note.hidden = false;
        note.textContent = name + " выезжает на дом и в отель.";
      } else {
        note.hidden = true;
        note.textContent = "";
      }
    });
  }

  function render() {
    renderPresets();
    renderFormat();
    renderAddons();
    renderSummary();
    updateMasterNotes();
  }

  function setFormat(format, fromForm) {
    state.format = format === "outcall" ? "outcall" : "salon";
    if (!fromForm) render();
    else {
      renderFormat();
      renderSummary();
    }
  }

  function setNav(open) {
    body.classList.toggle("nav-open", open);
    if (burger) burger.setAttribute("aria-expanded", open ? "true" : "false");
    if (burger) burger.setAttribute("aria-label", open ? "Закрыть меню" : "Открыть меню");
    if (backdrop) backdrop.hidden = !open;
  }

  burger?.addEventListener("click", function () {
    setNav(!body.classList.contains("nav-open"));
  });
  backdrop?.addEventListener("click", function () {
    setNav(false);
  });
  nav?.querySelectorAll("a").forEach(function (link) {
    link.addEventListener("click", function () {
      setNav(false);
    });
  });

  function setMaster(name) {
    masterSelects.forEach(function (select) {
      if (!name) return;
      const has = Array.from(select.options).some(function (opt) {
        return opt.value === name;
      });
      if (has) select.value = name;
    });
    updateMasterNotes();
  }

  function openBooking(master) {
    setNav(false);
    renderSummary();
    if (master) setMaster(master);
    if (typeof modal.showModal === "function") {
      modalForm.classList.remove("is-hidden");
      modalSuccess.classList.remove("is-visible");
      modal.showModal();
      body.classList.add("is-locked");
      const first = modalForm.querySelector("input:not([type='hidden']):not([type='radio']), select, textarea");
      first?.focus();
    } else {
      document.getElementById("zapis")?.scrollIntoView({ behavior: "smooth" });
    }
  }

  function closeBooking() {
    if (modal.open) modal.close();
    body.classList.remove("is-locked");
  }

  document.querySelectorAll("[data-open-booking]").forEach(function (el) {
    el.addEventListener("click", function (event) {
      const master = el.getAttribute("data-master");
      if (master || el.tagName === "BUTTON") {
        event.preventDefault();
        openBooking(master);
      } else if (el.closest(".header, .nav")) {
        return;
      }
    });
  });

  document.querySelectorAll("[data-close-modal]").forEach(function (el) {
    el.addEventListener("click", closeBooking);
  });

  modal?.addEventListener("close", function () {
    body.classList.remove("is-locked");
  });

  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape") setNav(false);
  });

  function handleSubmit(form, success) {
    form.addEventListener("submit", function (event) {
      event.preventDefault();
      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }
      form.classList.add("is-hidden");
      success.classList.add("is-visible");
    });
  }

  handleSubmit(pageForm, pageSuccess);
  handleSubmit(modalForm, modalSuccess);

  pageReset?.addEventListener("click", function () {
    const snapshot = pageForm.querySelector("#field-service").value;
    const format = state.format;
    const address = document.getElementById("field-address")?.value;
    const master = document.getElementById("field-master")?.value;
    pageForm.reset();
    pageForm.classList.remove("is-hidden");
    pageSuccess.classList.remove("is-visible");
    setFormat(format);
    if (document.getElementById("field-service")) document.getElementById("field-service").value = snapshot;
    if (document.getElementById("field-address") && address) document.getElementById("field-address").value = address;
    if (document.getElementById("field-master") && master) document.getElementById("field-master").value = master;
    updateMasterNotes();
  });

  const builder = document.getElementById("visit-builder");
  builder?.addEventListener("click", function (event) {
    const preset = event.target.closest("[data-preset]");
    if (preset) {
      applyPreset(preset.getAttribute("data-preset"));
      return;
    }
    const step = event.target.closest("[data-step]");
    if (step) {
      const id = step.getAttribute("data-step");
      const dir = Number(step.getAttribute("data-dir"));
      setQuantity(id, getQuantity(id) + dir);
      render();
      return;
    }
    const toggle = event.target.closest("[data-toggle]");
    if (toggle) {
      const id = toggle.getAttribute("data-toggle");
      setQuantity(id, getQuantity(id) ? 0 : 1);
      render();
      return;
    }
    const upsell = event.target.closest("[data-upsell]");
    if (upsell) {
      setQuantity(upsell.getAttribute("data-upsell"), 1);
      render();
    }
  });

  document.querySelectorAll('input[name="visit-format"]').forEach(function (input) {
    input.addEventListener("change", function () {
      if (input.checked) setFormat(input.value);
    });
  });

  document.querySelectorAll("[data-sync-format]").forEach(function (input) {
    input.addEventListener("change", function () {
      if (input.checked) setFormat(input.value);
    });
  });

  masterSelects.forEach(function (select) {
    select.addEventListener("change", function () {
      setMaster(select.value);
    });
  });

  function updateBuilderBar() {
    if (!builderBar) return;
    const mobile = window.matchMedia("(max-width: 720px)").matches;
    const uslugi = document.getElementById("uslugi");
    let hide = !mobile;
    if (mobile && uslugi && bookingSection) {
      const reachedBuilder = uslugi.getBoundingClientRect().top < window.innerHeight * 0.85;
      const reachedForm = bookingSection.getBoundingClientRect().top < window.innerHeight * 0.7;
      hide = !reachedBuilder || reachedForm;
    }
    builderBar.hidden = hide;
    body.classList.toggle("has-builder-bar", mobile && !hide);
  }

  window.addEventListener("scroll", updateBuilderBar, { passive: true });
  window.addEventListener("resize", updateBuilderBar);
  const mobileMq = window.matchMedia("(max-width: 720px)");
  if (mobileMq.addEventListener) mobileMq.addEventListener("change", updateBuilderBar);
  else if (mobileMq.addListener) mobileMq.addListener(updateBuilderBar);
  updateBuilderBar();

  renderBase();
  render();

  window.SPA_PRICE = PRICE;
})();
