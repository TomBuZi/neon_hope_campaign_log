/* Neon Hope Campaign Log — application logic.
   Pure client-side: state lives in localStorage; sharing encodes the full
   log into the URL fragment. No server, no build step. */
(function () {
  "use strict";

  var SCHEMA_VERSION = 2;
  var TRACK_MAX = 15;
  var TRACK_KEYS = ["startingResources", "followers", "nubiconWatchesYou"];
  var STORE_LOGS = "neonhope:logs";
  var STORE_ACTIVE = "neonhope:activeId";
  var STORE_LANG = "neonhope:lang";

  // Character roster (from roster.js); empty fallback keeps the app usable.
  var ROSTER = window.ROSTER || [];
  function rosterBySlug(slug) {
    for (var i = 0; i < ROSTER.length; i++) if (ROSTER[i].slug === slug) return ROSTER[i];
    return null;
  }

  // ---- State ---------------------------------------------------------------
  var logs = {};        // id -> log object
  var activeId = null;
  var lang = "de";

  // ---- Utilities -----------------------------------------------------------
  function uuid() {
    if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
    // Fallback for older browsers.
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
      var r = (Math.random() * 16) | 0;
      var v = c === "x" ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  function nowISO() {
    return new Date().toISOString();
  }

  function debounce(fn, ms) {
    var timer = null;
    return function () {
      var args = arguments, ctx = this;
      clearTimeout(timer);
      timer = setTimeout(function () { fn.apply(ctx, args); }, ms);
    };
  }

  function tr() { return window.t(lang); }

  /* Normalise the "Story Allies" value into a clean array of names.
     Accepts either an array (current model) or a string (legacy / free text). */
  function coerceAllies(v) {
    var arr = [];
    if (Array.isArray(v)) arr = v;
    else if (typeof v === "string") arr = v.split(/\r?\n/);
    return arr
      .map(function (x) { return typeof x === "string" ? x : String(x); })
      .map(function (x) { return x.trim(); })
      .filter(function (x) { return x.length > 0; });
  }

  function emptyLog(title) {
    return {
      schemaVersion: SCHEMA_VERSION,
      id: uuid(),
      title: title || tr().newLogTitle,
      createdAt: nowISO(),
      updatedAt: nowISO(),
      characters: [
        { name: "", tool: "", allies: [], characterSlug: "" },
        { name: "", tool: "", allies: [], characterSlug: "" },
        { name: "", tool: "", allies: [], characterSlug: "" },
        { name: "", tool: "", allies: [], characterSlug: "" },
      ],
      tracks: { startingResources: 0, followers: 0, nubiconWatchesYou: 0 },
      campaignNotes: "",
      modifierPoolUpdates: "",
    };
  }

  /* Coerce arbitrary parsed JSON into a valid log; returns null if unusable. */
  function normalizeLog(obj) {
    if (!obj || typeof obj !== "object") return null;
    // Accept any known schema version; older ones are migrated below.
    if (obj.schemaVersion !== 1 && obj.schemaVersion !== 2) return null;
    var base = emptyLog();
    var log = {
      schemaVersion: SCHEMA_VERSION,
      id: typeof obj.id === "string" ? obj.id : base.id,
      title: typeof obj.title === "string" && obj.title.trim() ? obj.title : base.title,
      createdAt: typeof obj.createdAt === "string" ? obj.createdAt : base.createdAt,
      updatedAt: typeof obj.updatedAt === "string" ? obj.updatedAt : nowISO(),
      characters: [],
      tracks: { startingResources: 0, followers: 0, nubiconWatchesYou: 0 },
      campaignNotes: typeof obj.campaignNotes === "string" ? obj.campaignNotes : "",
      modifierPoolUpdates:
        typeof obj.modifierPoolUpdates === "string" ? obj.modifierPoolUpdates : "",
    };
    for (var i = 0; i < 4; i++) {
      var c = (obj.characters && obj.characters[i]) || {};
      log.characters.push({
        name: typeof c.name === "string" ? c.name : "",
        tool: typeof c.tool === "string" ? c.tool : "",
        allies: coerceAllies(c.allies),
        characterSlug: typeof c.characterSlug === "string" ? c.characterSlug : "",
      });
    }
    TRACK_KEYS.forEach(function (k) {
      var v = obj.tracks ? Number(obj.tracks[k]) : 0;
      if (!isFinite(v)) v = 0;
      log.tracks[k] = Math.max(0, Math.min(TRACK_MAX, Math.round(v)));
    });
    return log;
  }

  function activeLog() { return logs[activeId]; }

  // ---- Persistence ---------------------------------------------------------
  function loadStorage() {
    try {
      var raw = localStorage.getItem(STORE_LOGS);
      logs = raw ? JSON.parse(raw) : {};
    } catch (e) { logs = {}; }
    if (!logs || typeof logs !== "object") logs = {};
    // Migrate stored logs to the current model (allies string -> array).
    Object.keys(logs).forEach(function (id) {
      var l = logs[id];
      if (l && Array.isArray(l.characters)) {
        l.characters.forEach(function (c) {
          if (!c) return;
          c.allies = coerceAllies(c.allies);
          if (typeof c.characterSlug !== "string") c.characterSlug = "";
        });
        l.schemaVersion = SCHEMA_VERSION;
      }
    });
    activeId = localStorage.getItem(STORE_ACTIVE);
    lang = localStorage.getItem(STORE_LANG) ||
      ((navigator.language || "de").toLowerCase().indexOf("en") === 0 ? "en" : "de");
  }

  function saveStorage() {
    try {
      localStorage.setItem(STORE_LOGS, JSON.stringify(logs));
      localStorage.setItem(STORE_ACTIVE, activeId || "");
      localStorage.setItem(STORE_LANG, lang);
    } catch (e) { /* quota or private mode — ignore */ }
  }

  var scheduleSave = debounce(function () {
    var log = activeLog();
    if (log) log.updatedAt = nowISO();
    saveStorage();
    showToast(tr().savedNotice);
  }, 350);

  // ---- Share link (compress state into URL fragment) -----------------------
  function toBase64Url(bytes) {
    var bin = "";
    for (var i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
    return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  }
  function fromBase64Url(str) {
    str = str.replace(/-/g, "+").replace(/_/g, "/");
    while (str.length % 4) str += "=";
    var bin = atob(str);
    var bytes = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return bytes;
  }

  async function encodeLog(log) {
    var json = JSON.stringify(log);
    var input = new TextEncoder().encode(json);
    if (typeof CompressionStream === "function") {
      try {
        var cs = new CompressionStream("deflate-raw");
        var stream = new Blob([input]).stream().pipeThrough(cs);
        var buf = await new Response(stream).arrayBuffer();
        return "d" + toBase64Url(new Uint8Array(buf)); // "d" = deflated
      } catch (e) { /* fall through to raw */ }
    }
    return "r" + toBase64Url(input); // "r" = raw
  }

  async function decodeLog(payload) {
    if (!payload) return null;
    var flag = payload.charAt(0);
    var bytes = fromBase64Url(payload.slice(1));
    var json;
    if (flag === "d") {
      var ds = new DecompressionStream("deflate-raw");
      var stream = new Blob([bytes]).stream().pipeThrough(ds);
      var buf = await new Response(stream).arrayBuffer();
      json = new TextDecoder().decode(buf);
    } else {
      json = new TextDecoder().decode(bytes);
    }
    return normalizeLog(JSON.parse(json));
  }

  async function shareLink() {
    var log = activeLog();
    if (!log) return;
    var payload = await encodeLog(log);
    var url = location.origin + location.pathname + "#log=" + payload;
    try {
      await navigator.clipboard.writeText(url);
      showToast(tr().linkCopied);
    } catch (e) {
      window.prompt(tr().linkCopyManual, url);
    }
  }

  // ---- Export / Import (JSON file) -----------------------------------------
  function exportLog() {
    var log = activeLog();
    if (!log) return;
    var blob = new Blob([JSON.stringify(log, null, 2)], { type: "application/json" });
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    var safe = (log.title || "campaign-log").replace(/[^\w\-]+/g, "_").slice(0, 60);
    a.href = url;
    a.download = safe + ".json";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function importFromFile(file) {
    var reader = new FileReader();
    reader.onload = function () {
      try {
        var log = normalizeLog(JSON.parse(reader.result));
        if (!log) throw new Error("invalid");
        adoptLog(log);
        showToast(tr().importSuccess);
      } catch (e) {
        alert(tr().importError);
      }
    };
    reader.readAsText(file);
  }

  /* Add a log (from import or link) under a fresh id, make it active. */
  function adoptLog(log) {
    if (logs[log.id]) log.id = uuid(); // avoid clobbering an existing log
    logs[log.id] = log;
    activeId = log.id;
    saveStorage();
    renderAll();
  }

  // ---- Rendering -----------------------------------------------------------
  function el(tag, cls, attrs) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (attrs) Object.keys(attrs).forEach(function (k) { e.setAttribute(k, attrs[k]); });
    return e;
  }

  function renderLogSelect() {
    var sel = document.getElementById("log-select");
    sel.innerHTML = "";
    var ids = Object.keys(logs).sort(function (a, b) {
      return (logs[b].updatedAt || "").localeCompare(logs[a].updatedAt || "");
    });
    ids.forEach(function (id) {
      var opt = el("option");
      opt.value = id;
      opt.textContent = logs[id].title || tr().untitled;
      if (id === activeId) opt.selected = true;
      sel.appendChild(opt);
    });
  }

  /* Build the "Story Allies" field: a list of name inputs with per-row
     remove buttons and an add button. Only this list re-renders on
     add/remove, so name/tool inputs keep their focus. */
  function buildAlliesField(idx, d) {
    var field = el("div", "field allies-field");
    var label = el("label");
    label.textContent = d.allies;
    field.appendChild(label);

    var list = el("div", "ally-list");

    function draw() {
      list.innerHTML = "";
      var arr = activeLog().characters[idx].allies;
      arr.forEach(function (val, ai) {
        var row = el("div", "ally-row");
        var input = el("input", null,
          { type: "text", "data-char": idx, "data-ally": ai });
        input.value = val;
        input.placeholder = d.alliesPlaceholder;
        input.addEventListener("input", function () {
          activeLog().characters[idx].allies[ai] = input.value;
          scheduleSave();
        });
        var remove = el("button", "ally-remove",
          { type: "button", "aria-label": d.removeAlly, title: d.removeAlly });
        remove.textContent = "×";
        remove.addEventListener("click", function () {
          activeLog().characters[idx].allies.splice(ai, 1);
          scheduleSave();
          draw();
        });
        row.appendChild(input);
        row.appendChild(remove);
        list.appendChild(row);
      });
    }
    draw();
    field.appendChild(list);

    var add = el("button", "ally-add", { type: "button" });
    add.textContent = d.addAlly;
    add.addEventListener("click", function () {
      activeLog().characters[idx].allies.push("");
      scheduleSave();
      draw();
      var inputs = list.querySelectorAll("input");
      if (inputs.length) inputs[inputs.length - 1].focus();
    });
    field.appendChild(add);
    return field;
  }

  function renderCharacters() {
    var wrap = document.getElementById("characters");
    wrap.innerHTML = "";
    var log = activeLog();
    var d = tr();
    log.characters.forEach(function (ch, idx) {
      var card = el("div", "character-card");
      var title = el("div", "card-title");
      title.textContent = d.character + " " + (idx + 1);
      card.appendChild(title);

      // --- Character picker: fills Name + Character Tool from the roster ---
      var pickField = el("div", "field");
      var pickLabel = el("label");
      pickLabel.textContent = d.pickCharacter;
      var select = el("select", "char-select");
      var placeholder = el("option");
      placeholder.value = "";
      placeholder.textContent = d.pickCharacterPlaceholder;
      select.appendChild(placeholder);
      [["base", d.groupBase], ["alt", d.groupAlt], ["expansion", d.groupExpansion]]
        .forEach(function (grp) {
          var og = el("optgroup");
          og.label = grp[1];
          ROSTER.filter(function (r) { return r.group === grp[0]; }).forEach(function (r) {
            var opt = el("option");
            opt.value = r.slug;
            var nm = lang === "de" ? r.nameDe : r.nameEn;
            var sub = lang === "de" ? r.subtitleDe : r.subtitleEn;
            opt.textContent = nm + " – " + sub;
            og.appendChild(opt);
          });
          select.appendChild(og);
        });
      select.value = ch.characterSlug || "";
      pickField.appendChild(pickLabel);
      pickField.appendChild(select);
      card.appendChild(pickField);

      // --- Name + Character Tool (editable text; auto-filled by the picker) ---
      var nameField = el("div", "field");
      var nameLabel = el("label");
      nameLabel.textContent = d.name;
      var nameInput = el("input", null, { type: "text", "data-char": idx, "data-key": "name" });
      nameInput.value = ch.name;
      nameInput.placeholder = d.namePlaceholder;
      nameField.appendChild(nameLabel);
      nameField.appendChild(nameInput);
      card.appendChild(nameField);

      var toolField = el("div", "field");
      var toolLabel = el("label");
      toolLabel.textContent = d.tool;
      var toolInput = el("input", null, { type: "text", "data-char": idx, "data-key": "tool" });
      toolInput.value = ch.tool;
      toolInput.placeholder = d.toolPlaceholder;
      toolInput.addEventListener("input", function () {
        activeLog().characters[idx].tool = toolInput.value;
        scheduleSave();
      });
      var note = el("div", "tool-note");
      note.hidden = true;
      toolField.appendChild(toolLabel);
      toolField.appendChild(toolInput);
      toolField.appendChild(note);
      card.appendChild(toolField);

      // Show a hint when the German tool name is an unofficial translation.
      function updateNote() {
        var r = rosterBySlug(activeLog().characters[idx].characterSlug);
        var provisional = r && lang === "de" && !r.toolDeOfficial;
        note.textContent = provisional ? d.toolDeProvisional : "";
        note.hidden = !provisional;
      }

      // Typing a custom name clears the roster selection.
      nameInput.addEventListener("input", function () {
        activeLog().characters[idx].name = nameInput.value;
        activeLog().characters[idx].characterSlug = "";
        select.value = "";
        updateNote();
        scheduleSave();
      });

      select.addEventListener("change", function () {
        var c = activeLog().characters[idx];
        c.characterSlug = select.value;
        var r = rosterBySlug(select.value);
        if (r) {
          c.name = lang === "de" ? r.nameDe : r.nameEn;
          c.tool = lang === "de" ? r.toolDe : r.toolEn;
          nameInput.value = c.name;
          toolInput.value = c.tool;
        }
        updateNote();
        scheduleSave();
      });
      updateNote();

      // Story Allies: dynamic list of names with add/remove.
      card.appendChild(buildAlliesField(idx, d));
      wrap.appendChild(card);
    });
  }

  function renderTracks() {
    var wrap = document.getElementById("tracks");
    wrap.innerHTML = "";
    var log = activeLog();
    var d = tr();
    TRACK_KEYS.forEach(function (key) {
      var row = el("div", "track-row");
      var label = el("div", "track-label");
      label.textContent = d[key];
      row.appendChild(label);

      var boxes = el("div", "track-boxes");
      var value = log.tracks[key];
      for (var g = 0; g < 3; g++) {
        var group = el("div", "group");
        for (var b = 0; b < 5; b++) {
          var n = g * 5 + b + 1; // 1..15
          var box = el("button", "box" + (n <= value ? " filled" : ""),
            { type: "button", "aria-label": d[key] + " " + n, "data-n": n });
          box.addEventListener("click", (function (target, num) {
            return function () {
              var cur = activeLog().tracks[key];
              // Click the current top box to lower by one; otherwise set to num.
              activeLog().tracks[key] = cur === num ? num - 1 : num;
              renderTracks();
              scheduleSave();
            };
          })(box, n));
          group.appendChild(box);
        }
        boxes.appendChild(group);
      }
      row.appendChild(boxes);

      var val = el("div", "track-value");
      val.textContent = value + "/" + TRACK_MAX;
      row.appendChild(val);
      wrap.appendChild(row);
    });
  }

  function renderNotes() {
    var log = activeLog();
    document.getElementById("campaignNotes").value = log.campaignNotes;
    document.getElementById("modifierPoolUpdates").value = log.modifierPoolUpdates;
  }

  /* Apply the current language to every element flagged with data-i18n*. */
  function applyLanguage() {
    var d = tr();
    document.documentElement.lang = d.htmlLang;
    document.querySelectorAll("[data-i18n]").forEach(function (node) {
      var key = node.getAttribute("data-i18n");
      if (d[key] != null) node.textContent = d[key];
    });
    document.querySelectorAll("[data-i18n-title]").forEach(function (node) {
      var key = node.getAttribute("data-i18n-title");
      if (d[key] != null) node.title = d[key];
    });
    document.querySelectorAll("[data-i18n-placeholder]").forEach(function (node) {
      var key = node.getAttribute("data-i18n-placeholder");
      if (d[key] != null) node.placeholder = d[key];
    });
  }

  function renderAll() {
    applyLanguage();
    renderLogSelect();
    renderCharacters();
    renderTracks();
    renderNotes();
  }

  // ---- Toast ---------------------------------------------------------------
  var toastTimer = null;
  function showToast(msg) {
    var toast = document.getElementById("toast");
    toast.textContent = msg;
    toast.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toast.hidden = true; }, 1800);
  }

  // ---- Wiring --------------------------------------------------------------
  function bind() {
    document.getElementById("log-select").addEventListener("change", function (e) {
      activeId = e.target.value;
      saveStorage();
      renderAll();
    });

    document.getElementById("btn-new").addEventListener("click", function () {
      var log = emptyLog();
      logs[log.id] = log;
      activeId = log.id;
      saveStorage();
      renderAll();
    });

    document.getElementById("btn-rename").addEventListener("click", function () {
      var log = activeLog();
      if (!log) return;
      var name = window.prompt(tr().renamePrompt, log.title);
      if (name && name.trim()) {
        log.title = name.trim();
        scheduleSave();
        renderLogSelect();
      }
    });

    document.getElementById("btn-delete").addEventListener("click", function () {
      if (!activeLog()) return;
      if (!window.confirm(tr().deleteConfirm)) return;
      delete logs[activeId];
      var ids = Object.keys(logs);
      if (ids.length === 0) {
        var log = emptyLog();
        logs[log.id] = log;
        activeId = log.id;
      } else {
        activeId = ids[0];
      }
      saveStorage();
      renderAll();
    });

    document.getElementById("btn-export").addEventListener("click", exportLog);

    document.getElementById("btn-import").addEventListener("click", function () {
      document.getElementById("file-import").click();
    });
    document.getElementById("file-import").addEventListener("change", function (e) {
      if (e.target.files && e.target.files[0]) importFromFile(e.target.files[0]);
      e.target.value = "";
    });

    document.getElementById("btn-share").addEventListener("click", shareLink);

    document.getElementById("btn-lang").addEventListener("click", function () {
      lang = lang === "de" ? "en" : "de";
      saveStorage();
      renderAll();
    });

    ["campaignNotes", "modifierPoolUpdates"].forEach(function (id) {
      document.getElementById(id).addEventListener("input", function (e) {
        activeLog()[id] = e.target.value;
        scheduleSave();
      });
    });
  }

  // ---- Boot ----------------------------------------------------------------
  async function init() {
    loadStorage();

    // A shared log in the URL fragment takes precedence (with confirmation).
    var m = location.hash.match(/(?:^#|[#&])log=([^&]+)/);
    if (m) {
      try {
        var shared = await decodeLog(decodeURIComponent(m[1]));
        if (shared && window.confirm(tr().loadFromLinkConfirm)) {
          if (Object.keys(logs).length === 0) { logs[shared.id] = shared; activeId = shared.id; saveStorage(); }
          else adoptLog(shared);
        }
      } catch (e) { /* malformed link — ignore */ }
      history.replaceState(null, "", location.pathname + location.search);
    }

    if (!activeId || !logs[activeId]) {
      var ids = Object.keys(logs);
      if (ids.length) {
        activeId = ids[0];
      } else {
        var first = emptyLog();
        logs[first.id] = first;
        activeId = first.id;
        saveStorage();
      }
    }

    bind();
    renderAll();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
