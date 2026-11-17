(function () {
  "use strict";

  var CONFIG = {
    BUSINESS_PHONE: "(346) 899-1563",
    REQUIRE_PHOTOS: true,
    MAX_PHOTOS: 10,
    MAX_MB: 10,
    RESPONSE_TIME: "Within 1 business day:",
    INBOX: "https://formsubmit.co/estimatessovereignestatepainte@gmail.com",
    NEXT: "https://www.cisnerosco.com/?request=sent",
    TYPES: [
      { id: "interior", label: "Interior", desc: "Rooms, walls, ceilings, trim",
        hint: "Room length and width, plus ceiling height.",
        scope: [["walls", "Walls"], ["ceilings", "Ceilings"], ["trim_baseboards", "Trim and baseboards"], ["doors", "Doors"], ["drywall_repair", "Drywall repair"], ["color_consult", "Color consultation"]] },
      { id: "exterior", label: "Exterior", desc: "Siding, trim, doors",
        hint: "House length and width, plus wall height (about 10 ft per story).",
        scope: [["siding", "Siding"], ["trim_fascia", "Trim and fascia"], ["doors_shutters", "Doors and shutters"], ["pressure_wash", "Pressure washing"], ["wood_repair", "Wood rot repair"]] },
      { id: "cabinets", label: "Cabinets", desc: "Kitchen or bath refinishing",
        hint: "Length = total run of cabinets. Width and height can be skipped.",
        scope: [["cabinet_boxes", "Cabinet boxes"], ["doors_drawers", "Doors and drawer fronts"], ["cabinet_interiors", "Cabinet interiors"], ["new_hardware", "New hardware"]] },
      { id: "deck_fence", label: "Deck or fence", desc: "Staining and sealing",
        hint: "Deck: length × width. Fence: length × height.",
        scope: [["deck", "Deck"], ["fence", "Fence"], ["pressure_wash", "Pressure washing"], ["stain", "Stain"], ["seal", "Clear seal"]] },
      { id: "commercial", label: "Commercial", desc: "Offices, retail, warehouses, multi-unit",
        hint: "Space length and width, plus wall height.",
        scope: [["interior_walls", "Interior walls"], ["exterior", "Exterior"], ["doors_frames", "Doors and frames"], ["after_hours", "Nights or weekends only"], ["occupied_building", "Building stays open during work"]] }
    ],
    BUDGETS: [["under_5k", "Under $5k"], ["5k_15k", "$5k–$15k"], ["15k_30k", "$15k–$30k"], ["30k_plus", "$30k+"], ["not_sure", "Not sure yet"]],
    TIMELINES: [["immediate", "Immediately", "Ready to start now"], ["1_3_months", "In 1–3 months", "Getting quotes"], ["planning", "Just planning", "Gathering ideas"]]
  };

  var root = document.getElementById("cc-intake");
  if (!root) return;
  var q = function (s) { return root.querySelector(s); };
  var qa = function (s) { return Array.prototype.slice.call(root.querySelectorAll(s)); };
  var STEP_NAMES = ["Project", "Photos", "Size", "Budget", "Contact"];
  var state = { step: 1, type: null, unit: "ft", photos: [], seq: 0 };
  var ALLOWED = { "image/jpeg": 1, "image/png": 1, "image/heic": 1, "image/heif": 1 };
  var requestKey = "cisneros-request";

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function typeCfg() {
    for (var i = 0; i < CONFIG.TYPES.length; i++) if (CONFIG.TYPES[i].id === state.type) return CONFIG.TYPES[i];
    return null;
  }
  function say(msg) {
    var live = q("#cc-live");
    live.textContent = "";
    setTimeout(function () { live.textContent = msg; }, 30);
  }
  function setErr(id, msg, input) {
    var el = q("#cc-e-" + id);
    if (el) el.textContent = msg || "";
    if (input) input.setAttribute("aria-invalid", msg ? "true" : "false");
    if (input && msg) input.setAttribute("aria-describedby", "cc-e-" + id);
  }

  q("#cc-types").innerHTML = CONFIG.TYPES.map(function (t) {
    return '<button type="button" class="card" aria-pressed="false" data-type="' + t.id + '"><b>' + esc(t.label) + "</b><span>" + esc(t.desc) + "</span></button>";
  }).join("");
  q("#cc-budget").insertAdjacentHTML("beforeend", CONFIG.BUDGETS.map(function (b) {
    return '<option value="' + b[0] + '">' + esc(b[1]) + "</option>";
  }).join(""));
  q("#cc-timeline").innerHTML = CONFIG.TIMELINES.map(function (t) {
    return '<label class="radio"><input type="radio" name="cc-timeline" value="' + t[0] + '"><b>' + esc(t[1]) + "</b><span>" + esc(t[2]) + "</span></label>";
  }).join("");
  qa(".cc-max").forEach(function (el) { el.textContent = CONFIG.MAX_PHOTOS; });

  function renderScope() {
    var t = typeCfg();
    if (!t) return;
    var prev = qa("#cc-scope input:checked").map(function (i) { return i.value; });
    q("#cc-scope").innerHTML = t.scope.map(function (s) {
      return '<label class="check"><input type="checkbox" value="' + s[0] + '"' + (prev.indexOf(s[0]) > -1 ? " checked" : "") + ">" + esc(s[1]) + "</label>";
    }).join("");
    q("#cc-dim-hint").textContent = t.hint;
    q("#cc-biz-wrap").hidden = t.id !== "commercial";
  }

  function show(n) {
    state.step = n;
    qa("section[data-step]").forEach(function (s) { s.hidden = +s.getAttribute("data-step") !== n; });
    q(".prog-fill").style.width = (n * 20) + "%";
    qa(".prog-labels span").forEach(function (s, i) { s.classList.toggle("on", i === n - 1); });
    if (n === 5) renderSummary();
    var top = root.getBoundingClientRect().top;
    if (top < 100 || top > window.innerHeight * 0.4) {
      window.scrollTo({ top: window.scrollY + top - 110, behavior: "smooth" });
    }
    var heading = q("#cc-h" + n);
    if (heading) heading.focus({ preventScroll: true });
    say("Step " + n + " of 5: " + STEP_NAMES[n - 1]);
  }

  function validateStep(n) {
    if (n === 1) {
      setErr("type", state.type ? "" : "Pick a project type to continue.");
      return !!state.type;
    }
    if (n === 2) {
      var msg = CONFIG.REQUIRE_PHOTOS && !state.photos.length ? "Add at least one photo. A quick phone picture is perfect." : "";
      setErr("photos", msg);
      return !msg;
    }
    if (n === 3) {
      var bad = ["len", "wid", "hei"].filter(function (id) {
        var el = q("#cc-" + id);
        var value = el.value.trim();
        var ok = value === "" || (+value > 0 && +value < 100000);
        el.setAttribute("aria-invalid", ok ? "false" : "true");
        return !ok;
      });
      setErr("dims", bad.length ? "Measurements must be numbers greater than 0, or leave them blank." : "");
      return !bad.length;
    }
    if (n === 4) {
      var budget = q("#cc-budget");
      var timeline = q('input[name="cc-timeline"]:checked');
      setErr("budget", budget.value ? "" : 'Choose a budget range. "Not sure yet" is fine.', budget);
      setErr("timeline", timeline ? "" : "Choose when you'd like to start.");
      return !!(budget.value && timeline);
    }
    return true;
  }

  root.addEventListener("click", function (e) {
    var go = e.target.closest("[data-go]");
    if (go) {
      var to = +go.getAttribute("data-go");
      if (to > state.step) {
        for (var s = state.step; s < to; s++) {
          if (!validateStep(s)) { focusFirstError(); return; }
        }
      }
      show(to);
      return;
    }
    var card = e.target.closest(".card[data-type]");
    if (card) {
      state.type = card.getAttribute("data-type");
      qa(".card[data-type]").forEach(function (c) { c.setAttribute("aria-pressed", c === card ? "true" : "false"); });
      setErr("type", "");
      renderScope();
      return;
    }
    var unit = e.target.closest("[data-unit]");
    if (unit) {
      state.unit = unit.getAttribute("data-unit");
      qa("[data-unit]").forEach(function (b) { b.setAttribute("aria-pressed", b === unit ? "true" : "false"); });
      qa(".cc-u").forEach(function (u) { u.textContent = "(" + state.unit + ")"; });
      return;
    }
    var edit = e.target.closest("[data-edit]");
    if (edit) show(+edit.getAttribute("data-edit"));
  });

  function focusFirstError() {
    var sec = q('section[data-step="' + state.step + '"]');
    var bad = sec.querySelector('[aria-invalid="true"]') || sec.querySelector(".err:not(:empty)");
    if (!bad) return;
    bad.scrollIntoView({ behavior: "smooth", block: "center" });
    if (bad.focus) bad.focus({ preventScroll: true });
  }

  function guessType(file) {
    if (ALLOWED[file.type]) return file.type;
    var name = (file.name || "").toLowerCase();
    if (/\.heic$/.test(name)) return "image/heic";
    if (/\.heif$/.test(name)) return "image/heif";
    if (/\.jpe?g$/.test(name)) return "image/jpeg";
    if (/\.png$/.test(name)) return "image/png";
    return null;
  }

  function addFiles(list) {
    var errs = [];
    Array.prototype.forEach.call(list, function (file) {
      var type = guessType(file);
      if (state.photos.length >= CONFIG.MAX_PHOTOS) { errs.push("You can add up to " + CONFIG.MAX_PHOTOS + " photos."); return; }
      if (!type) { errs.push('"' + file.name + '" isn\'t a JPG, PNG or HEIC photo.'); return; }
      if (file.size > CONFIG.MAX_MB * 1048576) { errs.push('"' + file.name + '" is over ' + CONFIG.MAX_MB + " MB."); return; }
      var photo = { id: ++state.seq, file: file, type: type, url: null };
      try { photo.url = URL.createObjectURL(file); } catch (e) {}
      state.photos.push(photo);
    });
    setErr("photos", errs.filter(function (v, i, a) { return a.indexOf(v) === i; }).join(" "));
    renderThumbs();
  }

  function renderThumbs() {
    q("#cc-thumbs").innerHTML = state.photos.map(function (photo, i) {
      var canPreview = photo.url && !/heic|heif/.test(photo.type);
      var inner = canPreview
        ? '<img alt="Photo ' + (i + 1) + '" src="' + photo.url + '">'
        : '<div class="ph"><b>' + (photo.type.split("/")[1] || "").toUpperCase() + "</b>" + esc(photo.file.name) + "</div>";
      return '<div class="thumb done" data-id="' + photo.id + '">' + inner +
        '<button type="button" class="x" aria-label="Remove photo ' + (i + 1) + '">×</button></div>';
    }).join("");
    qa("#cc-thumbs img").forEach(function (img) {
      img.addEventListener("error", function () {
        var fallback = document.createElement("div");
        fallback.className = "ph";
        fallback.innerHTML = "<b>Photo</b>Preview not available";
        img.replaceWith(fallback);
      });
    });
    q("#cc-count").textContent = state.photos.length
      ? state.photos.length + " of " + CONFIG.MAX_PHOTOS + " photos, ready to send"
      : "";
  }

  q("#cc-thumbs").addEventListener("click", function (e) {
    var thumb = e.target.closest(".thumb");
    if (!thumb || !e.target.closest(".x")) return;
    var id = +thumb.getAttribute("data-id");
    var photo = state.photos.filter(function (item) { return item.id === id; })[0];
    if (photo && photo.url) URL.revokeObjectURL(photo.url);
    state.photos = state.photos.filter(function (item) { return item.id !== id; });
    renderThumbs();
    say("Photo removed");
    setErr("photos", "");
  });

  q("#cc-camera-btn").addEventListener("click", function () { q("#cc-camera").click(); });
  q("#cc-pick-btn").addEventListener("click", function () { q("#cc-files").click(); });
  ["#cc-camera", "#cc-files"].forEach(function (sel) {
    q(sel).addEventListener("change", function () { addFiles(this.files); this.value = ""; });
  });
  var drop = q("#cc-drop");
  ["dragenter", "dragover"].forEach(function (ev) {
    drop.addEventListener(ev, function (e) { e.preventDefault(); drop.classList.add("over"); });
  });
  ["dragleave", "drop"].forEach(function (ev) {
    drop.addEventListener(ev, function (e) { e.preventDefault(); drop.classList.remove("over"); });
  });
  drop.addEventListener("drop", function (e) {
    if (e.dataTransfer && e.dataTransfer.files) addFiles(e.dataTransfer.files);
  });

  function num(id) {
    var value = q("#cc-" + id).value.trim();
    return value === "" ? null : +value;
  }
  function labelOf(list, code) {
    for (var i = 0; i < list.length; i++) if (list[i][0] === code) return list[i][1];
    return "";
  }

  function renderSummary() {
    var t = typeCfg();
    var dims = [["L", num("len")], ["W", num("wid")], ["H", num("hei")]].filter(function (d) { return d[1] != null; })
      .map(function (d) { return d[0] + " " + d[1] + " " + state.unit; }).join(" × ");
    var scope = qa("#cc-scope input:checked").map(function (i) { return i.parentNode.textContent.trim(); }).join(", ");
    var timeline = q('input[name="cc-timeline"]:checked');
    var rows = [
      ["Project", t ? t.label : "", 1],
      ["Photos", state.photos.length ? state.photos.length + " added" : "None", 2],
      ["Size", dims || "Skipped", 3],
      ["Scope", scope || "Not specified", 3],
      ["Budget", labelOf(CONFIG.BUDGETS, q("#cc-budget").value), 4],
      ["Timing", timeline ? labelOf(CONFIG.TIMELINES, timeline.value) : "", 4]
    ];
    q("#cc-summary").innerHTML = rows.map(function (row) {
      return "<dt>" + row[0] + "</dt><dd>" + esc(row[1]) + '</dd><button type="button" class="edit" data-edit="' + row[2] + '" aria-label="Edit ' + row[0] + '">Edit</button>';
    }).join("");
  }

  var phone = q("#cc-phone");
  phone.addEventListener("input", function () {
    var digits = phone.value.replace(/\D/g, "");
    if (digits.length === 11 && digits[0] === "1") digits = digits.slice(1);
    digits = digits.slice(0, 10);
    phone.value = digits.length > 6
      ? "(" + digits.slice(0, 3) + ") " + digits.slice(3, 6) + "-" + digits.slice(6)
      : digits.length > 3 ? "(" + digits.slice(0, 3) + ") " + digits.slice(3) : digits;
  });
  ["len", "wid", "hei"].forEach(function (id) {
    q("#cc-" + id).addEventListener("input", function () {
      setErr("dims", "");
      this.setAttribute("aria-invalid", "false");
    });
  });
  qa("#cc-form input, #cc-form select").forEach(function (el) {
    el.addEventListener("input", function () {
      if (el.getAttribute("aria-invalid") !== "true") return;
      el.setAttribute("aria-invalid", "false");
      var err = q("#cc-e-" + el.id.replace("cc-", ""));
      if (err) err.textContent = "";
    });
  });

  function validateContact() {
    var ok = true;
    function chk(id, test, msg) {
      var el = q("#cc-" + id);
      var good = test(el.value.trim());
      setErr(id, good ? "" : msg, el);
      if (!good) ok = false;
    }
    chk("name", function (v) { return v.length >= 2; }, "Enter your name.");
    chk("phone", function (v) { return v.replace(/\D/g, "").length === 10; }, "Enter a 10-digit phone number.");
    chk("email", function (v) { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v); }, "Enter a valid email, like name@example.com.");
    chk("street", function (v) { return v.length >= 3; }, "Enter the street address of the job.");
    chk("city", function (v) { return v.length >= 2; }, "Enter the city.");
    chk("zip", function (v) { return /^\d{5}(-\d{4})?$/.test(v); }, "Enter a 5-digit ZIP code.");
    return ok;
  }

  function buildPayload() {
    var timeline = q('input[name="cc-timeline"]:checked');
    var pref = q('input[name="cc-pref"]:checked');
    var contact = {
      name: q("#cc-name").value.trim(),
      email: q("#cc-email").value.trim(),
      phone: q("#cc-phone").value.trim(),
      preferredContact: pref ? pref.value : "text",
      address: {
        street: q("#cc-street").value.trim(),
        city: q("#cc-city").value.trim(),
        state: "TX",
        zip: q("#cc-zip").value.trim()
      }
    };
    if (state.type === "commercial" && q("#cc-biz").value.trim()) contact.businessName = q("#cc-biz").value.trim();
    var dims = [["L", num("len")], ["W", num("wid")], ["H", num("hei")]].filter(function (d) { return d[1] != null; })
      .map(function (d) { return d[0] + " " + d[1] + " " + state.unit; }).join(" × ");
    return {
      project: typeCfg() ? typeCfg().label : "",
      photos: state.photos.length + " attached",
      dimensions: dims || "Skipped",
      scope: qa("#cc-scope input:checked").map(function (i) { return i.parentNode.textContent.trim(); }).join(", ") || "Not specified",
      notes: q("#cc-notes").value.trim(),
      budget: labelOf(CONFIG.BUDGETS, q("#cc-budget").value),
      timeline: timeline ? labelOf(CONFIG.TIMELINES, timeline.value) : "",
      contact: contact,
      website: q("#cc-website").value
    };
  }

  function sendToInbox(payload) {
    var form = document.createElement("form");
    form.method = "POST";
    form.action = CONFIG.INBOX;
    form.enctype = "multipart/form-data";
    form.hidden = true;
    function field(name, value) {
      var input = document.createElement("input");
      input.type = "hidden";
      input.name = name;
      input.value = value == null ? "" : String(value);
      form.appendChild(input);
    }
    var contact = payload.contact;
    var address = contact.address.street + ", " + contact.address.city + ", " + contact.address.state + " " + contact.address.zip;
    field("name", contact.name);
    field("email", contact.email);
    field("phone", contact.phone);
    field("Project", payload.project);
    field("Photos", payload.photos);
    field("Measurements", payload.dimensions);
    field("Scope", payload.scope);
    field("Notes", payload.notes || "None");
    field("Budget", payload.budget);
    field("Timing", payload.timeline);
    field("Job address", address);
    field("Preferred contact", contact.preferredContact);
    if (contact.businessName) field("Business", contact.businessName);
    field("_subject", "New estimate request — " + payload.project + " — Cisneros Co.");
    field("_template", "table");
    field("_next", CONFIG.NEXT);
    field("_autoresponse", "Thank you for contacting Cisneros Co.\n\nWe have your project details and photos. A member of our family will review them and reach out within 1 business day with a preliminary ballpark. A firm price needs a short on-site visit.\n\nIf you would like to reach us directly, call (346) 899-1563.\n\nCisneros Co.\nFine interior and exterior painting\n11426 Caesar Dr, Stafford, TX");
    field("_honey", payload.website || "");
    if (state.photos.length && typeof DataTransfer !== "undefined") {
      var files = document.createElement("input");
      files.type = "file";
      files.name = "attachment";
      files.multiple = true;
      var data = new DataTransfer();
      state.photos.forEach(function (photo) { data.items.add(photo.file); });
      files.files = data.files;
      form.appendChild(files);
    }
    document.body.appendChild(form);
    sessionStorage.setItem(requestKey, JSON.stringify({
      firstName: contact.name.split(" ")[0],
      pref: contact.preferredContact
    }));
    form.submit();
  }

  var submitting = false;
  q("#cc-form").addEventListener("submit", function (e) {
    e.preventDefault();
    if (submitting) return;
    q("#cc-banner").textContent = "";
    if ((q("#cc-website").value || "").trim()) return;
    for (var s = 1; s <= 4; s++) {
      if (!validateStep(s)) { show(s); focusFirstError(); return; }
    }
    if (!validateContact()) { focusFirstError(); return; }
    var btn = q("#cc-submit");
    var label = btn.innerHTML;
    submitting = true;
    btn.disabled = true;
    btn.innerHTML = '<span class="spin" aria-hidden="true"></span>Sending…';
    try {
      sendToInbox(buildPayload());
    } catch (err) {
      submitting = false;
      btn.disabled = false;
      btn.innerHTML = label;
      q("#cc-banner").textContent = "Couldn't send. Please call " + CONFIG.BUSINESS_PHONE + ".";
    }
  });

  var modal = q("#cc-modal");
  function openModal(res) {
    q("#cc-m-name").textContent = (res && res.firstName) || "there";
    q("#cc-m-when").textContent = CONFIG.RESPONSE_TIME;
    var how = { text: "text", call: "call", email: "email" };
    q("#cc-m-how").textContent = how[(res && res.pref) || "text"];
    var call = q("#cc-m-call");
    call.textContent = "Call " + CONFIG.BUSINESS_PHONE;
    call.href = "tel:+1" + CONFIG.BUSINESS_PHONE.replace(/\D/g, "");
    if (modal.showModal) modal.showModal();
    q("#cc-form").hidden = true;
    q(".prog").hidden = true;
    root.querySelector(".sub").textContent = "Your request is in. We'll be in touch soon.";
  }
  q("#cc-m-close").addEventListener("click", function () { if (modal.close) modal.close(); });

  var params = new URLSearchParams(window.location.search);
  if (params.get("request") === "sent") {
    var saved = {};
    try { saved = JSON.parse(sessionStorage.getItem(requestKey) || "{}"); } catch (e) { saved = {}; }
    sessionStorage.removeItem(requestKey);
    openModal(saved);
    params.delete("request");
    var next = window.location.pathname + (params.toString() ? "?" + params.toString() : "") + "#estimate";
    window.history.replaceState({}, "", next);
  }
})();
