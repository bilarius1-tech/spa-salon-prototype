(function () {
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
  }

  function openBooking(master) {
    setNav(false);
    if (master) setMaster(master);
    if (typeof modal.showModal === "function") {
      modalForm.classList.remove("is-hidden");
      modalSuccess.classList.remove("is-visible");
      modal.showModal();
      body.classList.add("is-locked");
      const first = modalForm.querySelector("input, select");
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
      // Header/hero "Записаться" can go to the section; master cards open the modal.
      const master = el.getAttribute("data-master");
      if (master || el.tagName === "BUTTON") {
        event.preventDefault();
        openBooking(master);
      } else if (el.closest(".header, .nav")) {
        // Let in-page anchors scroll; do not force the modal from the menu.
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

  function handleSubmit(form, success, after) {
    form.addEventListener("submit", function (event) {
      event.preventDefault();
      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }
      form.classList.add("is-hidden");
      success.classList.add("is-visible");
      if (typeof after === "function") after();
    });
  }

  handleSubmit(pageForm, pageSuccess);
  handleSubmit(modalForm, modalSuccess);

  pageReset?.addEventListener("click", function () {
    pageForm.reset();
    pageForm.classList.remove("is-hidden");
    pageSuccess.classList.remove("is-visible");
  });
})();
