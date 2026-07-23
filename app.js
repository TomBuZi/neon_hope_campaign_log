/* Neon Hope Campaign Log — application logic.
   Pure client-side: state lives in localStorage; sharing encodes the full
   log into the URL fragment. No server, no build step. */
(function () {
  "use strict";

  var SCHEMA_VERSION = 5;
  var TRACK_MAX = 15;
  var MAX_CHARACTERS = 4;
  var TRACK_KEYS = ["startingResources", "followers", "nubiconWatchesYou"];
  var STORE_LOGS = "neonhope:logs";
  var STORE_ACTIVE = "neonhope:activeId";
  var STORE_LANG = "neonhope:lang";
  var STORE_THEME = "neonhope:theme";

  // Character roster (from roster.js); empty fallback keeps the app usable.
  var ROSTER = window.ROSTER || [];
  function rosterBySlug(slug) {
    for (var i = 0; i < ROSTER.length; i++) if (ROSTER[i].slug === slug) return ROSTER[i];
    return null;
  }
  /* Find a tool side (front/back) within a roster entry by its slug. */
  function toolSlugOf(r, slug) {
    if (!r || !r.tools) return null;
    for (var i = 0; i < r.tools.length; i++) if (r.tools[i].slug === slug) return r.tools[i];
    return null;
  }
  /* Localised label for a tool side. */
  function sideLabel(side, language) {
    return side ? (language === "de" ? side.de : side.en) : "";
  }
  /* Legacy migration: map an old resolved tool string (either language) to a
     side slug; falls back to the front side. */
  function toolSlugFromLegacy(r, oldTool) {
    if (r && oldTool) {
      for (var i = 0; i < r.tools.length; i++) {
        if (r.tools[i].en === oldTool || r.tools[i].de === oldTool) return r.tools[i].slug;
      }
    }
    return r && r.tools[0] ? r.tools[0].slug : "";
  }
  /* Normalise one character to the v3 shape: { characterSlug, toolSlug, allies }.
     Accepts v3 (toolSlug) and legacy v1/v2 (name/tool strings). */
  function normalizeCharacter(c) {
    c = c || {};
    var slug = typeof c.characterSlug === "string" ? c.characterSlug : "";
    var r = rosterBySlug(slug);
    var toolSlug = "";
    if (r) {
      toolSlug = (typeof c.toolSlug === "string" && toolSlugOf(r, c.toolSlug))
        ? c.toolSlug
        : toolSlugFromLegacy(r, typeof c.tool === "string" ? c.tool : "");
    }
    return { characterSlug: slug, toolSlug: toolSlug, allies: coerceAllies(c.allies) };
  }

  // ---- State ---------------------------------------------------------------
  var logs = {};        // id -> log object
  var activeId = null;
  var lang = "de";
  var theme = null;     // "light" | "dark" | null (follow system)

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

  /* Normalise a value into a clean array of non-empty strings.
     opts.split: split a legacy string on newlines (else wrap it as one entry).
     opts.trim: trim each entry (for short names; off for free-text entries). */
  function coerceStringList(v, opts) {
    opts = opts || {};
    var arr = [];
    if (Array.isArray(v)) arr = v.slice();
    else if (typeof v === "string") arr = opts.split ? v.split(/\r?\n/) : [v];
    return arr
      .map(function (x) { return typeof x === "string" ? x : String(x); })
      .map(function (x) { return opts.trim ? x.trim() : x; })
      .filter(function (x) { return x.trim().length > 0; });
  }
  /* Story Allies: a list of short names (newline-split, trimmed). */
  function coerceAllies(v) { return coerceStringList(v, { split: true, trim: true }); }
  /* Notes / modifier updates: a list of free-text entries (legacy string
     becomes a single entry; internal formatting preserved). */
  function coerceEntries(v) { return coerceStringList(v, { split: false, trim: false }); }

  function emptyLog(title) {
    return {
      schemaVersion: SCHEMA_VERSION,
      id: uuid(),
      title: title || tr().newLogTitle,
      createdAt: nowISO(),
      updatedAt: nowISO(),
      characters: [{ characterSlug: "", toolSlug: "", allies: [] }], // new logs start with one
      tracks: { startingResources: 0, followers: 0, nubiconWatchesYou: 0 },
      campaignNotes: [],
      modifierPoolUpdates: [],
    };
  }

  /* Coerce arbitrary parsed JSON into a valid log; returns null if unusable. */
  function normalizeLog(obj) {
    if (!obj || typeof obj !== "object") return null;
    // Accept any known schema version; older ones are migrated below.
    if ([1, 2, 3, 4, 5].indexOf(obj.schemaVersion) === -1) return null;
    var base = emptyLog();
    var log = {
      schemaVersion: SCHEMA_VERSION,
      id: typeof obj.id === "string" ? obj.id : base.id,
      title: typeof obj.title === "string" && obj.title.trim() ? obj.title : base.title,
      createdAt: typeof obj.createdAt === "string" ? obj.createdAt : base.createdAt,
      updatedAt: typeof obj.updatedAt === "string" ? obj.updatedAt : nowISO(),
      characters: [],
      tracks: { startingResources: 0, followers: 0, nubiconWatchesYou: 0 },
      campaignNotes: coerceEntries(obj.campaignNotes),
      modifierPoolUpdates: coerceEntries(obj.modifierPoolUpdates),
    };
    // Keep the provided characters (1..MAX_CHARACTERS), defaulting to one.
    var srcChars = Array.isArray(obj.characters) ? obj.characters : [];
    var count = Math.min(MAX_CHARACTERS, Math.max(1, srcChars.length || 1));
    for (var i = 0; i < count; i++) {
      log.characters.push(normalizeCharacter(srcChars[i]));
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
    // Migrate stored logs to the current model (drop derived name/tool,
    // legacy tool string -> toolSlug, allies string -> array).
    Object.keys(logs).forEach(function (id) {
      var l = logs[id];
      if (l && Array.isArray(l.characters)) {
        l.characters = l.characters.slice(0, MAX_CHARACTERS).map(normalizeCharacter);
        if (l.characters.length === 0) l.characters.push(normalizeCharacter());
        l.campaignNotes = coerceEntries(l.campaignNotes);
        l.modifierPoolUpdates = coerceEntries(l.modifierPoolUpdates);
        l.schemaVersion = SCHEMA_VERSION;
      }
    });
    activeId = localStorage.getItem(STORE_ACTIVE);
    lang = localStorage.getItem(STORE_LANG) ||
      ((navigator.language || "de").toLowerCase().indexOf("en") === 0 ? "en" : "de");
    var storedTheme = localStorage.getItem(STORE_THEME);
    theme = (storedTheme === "light" || storedTheme === "dark") ? storedTheme : null;
  }

  function saveStorage() {
    try {
      localStorage.setItem(STORE_LOGS, JSON.stringify(logs));
      localStorage.setItem(STORE_ACTIVE, activeId || "");
      localStorage.setItem(STORE_LANG, lang);
      if (theme) localStorage.setItem(STORE_THEME, theme);
      else localStorage.removeItem(STORE_THEME);
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

  /* Resize a textarea to fit its content (no scrollbar, no manual handle). */
  function autoGrow(ta) {
    ta.style.height = "auto";
    var border = ta.offsetHeight - ta.clientHeight; // top+bottom border (border-box)
    ta.style.height = (ta.scrollHeight + border) + "px";
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

  // Pointer-based drag & drop (works with mouse, touch and pen). `entryLists`
  // maps each list id to its live array + metadata; `dragState` tracks the
  // source of the current drag.
  var dragState = null;          // { listId, index, group }
  var entryLists = {};           // listId -> { group, getArray, canReceive, redraw }
  var autoScrollRAF = null;
  var lastPointerY = 0;

  /* Reset all transient drag visuals and state. */
  function clearDragCues() {
    dragState = null;
    stopAutoScroll();
    document.body.className = document.body.className.split(/\s+/)
      .filter(function (c) { return c && c.indexOf("dnd-") !== 0; }).join(" ");
    document.querySelectorAll(".entry-row.dragging, .entry-row.drop-before, .entry-row.drop-after")
      .forEach(function (r) { r.classList.remove("dragging", "drop-before", "drop-after"); });
    document.querySelectorAll(".entry-list.drop-active")
      .forEach(function (l) { l.classList.remove("drop-active"); });
  }

  /* Move the dragged item into list `dstListId` at `targetIndex` (reorder
     within a list, or a cross-list move for the same group). */
  function moveEntry(dstListId, targetIndex) {
    if (!dragState) return;
    var src = entryLists[dragState.listId], dst = entryLists[dstListId];
    if (!src || !dst || src.group !== dst.group) return;
    if (dstListId === dragState.listId) {
      var arr = dst.getArray(), from = dragState.index;
      if (from < 0 || from >= arr.length) return;
      if (targetIndex > from) targetIndex--;
      if (targetIndex === from) return;
      arr.splice(targetIndex, 0, arr.splice(from, 1)[0]);
      dst.redraw();
    } else {
      if (!dst.canReceive()) return;
      var item = src.getArray().splice(dragState.index, 1)[0];
      if (item === undefined) return;
      dst.getArray().splice(targetIndex, 0, item);
      src.redraw();
      dst.redraw();
    }
    scheduleSave();
  }

  /* Resolve the drop target under a viewport point, or null. */
  function resolveTarget(x, y) {
    if (!dragState) return null;
    var elu = document.elementFromPoint(x, y);
    if (!elu || !elu.closest) return null;
    var listEl = elu.closest(".entry-list");
    if (!listEl) return null;
    var dstId = listEl.getAttribute("data-list-id");
    var dst = entryLists[dstId];
    if (!dst || dst.group !== dragState.group) return null;
    if (dstId !== dragState.listId && !dst.canReceive()) return null;
    var rows = Array.prototype.filter.call(listEl.children, function (c) {
      return c.classList && c.classList.contains("entry-row");
    });
    var row = elu.closest(".entry-row");
    if (row && rows.indexOf(row) !== -1) {
      var rect = row.getBoundingClientRect();
      var after = (y - rect.top) > rect.height / 2;
      return { listId: dstId, index: rows.indexOf(row) + (after ? 1 : 0), rowEl: row, after: after };
    }
    return { listId: dstId, index: dst.getArray().length, listEl: listEl };
  }

  /* Paint insertion cues for a resolved target (or clear them). */
  function paintCues(target) {
    document.querySelectorAll(".entry-row.drop-before, .entry-row.drop-after")
      .forEach(function (r) { r.classList.remove("drop-before", "drop-after"); });
    document.querySelectorAll(".entry-list.drop-active")
      .forEach(function (l) { l.classList.remove("drop-active"); });
    if (!target) return;
    if (target.rowEl) target.rowEl.classList.add(target.after ? "drop-after" : "drop-before");
    else if (target.listEl) target.listEl.classList.add("drop-active");
  }

  /* Auto-scroll the page while dragging near the top/bottom viewport edges. */
  function startAutoScroll() {
    if (autoScrollRAF || typeof requestAnimationFrame !== "function") return;
    var step = function () {
      var margin = 64, h = window.innerHeight || 0, dy = 0;
      if (lastPointerY < margin) dy = -Math.ceil((margin - lastPointerY) / 5);
      else if (lastPointerY > h - margin) dy = Math.ceil((lastPointerY - (h - margin)) / 5);
      if (dy) window.scrollBy(0, dy);
      autoScrollRAF = requestAnimationFrame(step);
    };
    autoScrollRAF = requestAnimationFrame(step);
  }
  function stopAutoScroll() {
    if (autoScrollRAF && typeof cancelAnimationFrame === "function") cancelAnimationFrame(autoScrollRAF);
    autoScrollRAF = null;
  }

  /* Generic editable string-list field: rows of text inputs (or textareas)
     with drag&drop reorder, per-row remove and an add button.
     Rules: the add button is disabled while an empty entry exists, and an
     entry that is emptied and blurred is removed. Items can be dragged within
     a list to reorder, or between lists of the same `group` when the target
     list's `canReceive()` allows it.
     cfg: { listId, group, getArray, placeholder, addLabel, removeLabel,
            dragLabel, label?, multiline?, fieldClass?, canReceive?, canAdd? } */
  function buildStringListField(cfg) {
    var field = el("div", "field " + (cfg.fieldClass || ""));
    if (cfg.label) {
      var label = el("label");
      label.textContent = cfg.label;
      field.appendChild(label);
    }

    var list = el("div", "entry-list",
      { "data-list-id": cfg.listId, "data-group": cfg.group });
    var inputSel = cfg.multiline ? "textarea" : "input";
    var canReceive = cfg.canReceive || function () { return true; };

    function sizeAll() {
      if (cfg.multiline) list.querySelectorAll("textarea").forEach(autoGrow);
    }
    function updateAddState() {
      var hasEmpty = cfg.getArray().some(function (v) { return !String(v).trim(); });
      add.disabled = hasEmpty || (cfg.canAdd ? !cfg.canAdd() : false);
    }

    function draw() {
      list.innerHTML = "";
      var arr = cfg.getArray();
      arr.forEach(function (val, i) {
        var row = el("div", "entry-row");

        var grip = el("span", "entry-drag", { title: cfg.dragLabel, "aria-hidden": "true" });
        grip.textContent = "⠿";
        grip.addEventListener("pointerdown", function (e) {
          if (e.button != null && e.button > 0) return;  // primary button / touch only
          e.preventDefault();
          dragState = { listId: cfg.listId, index: i, group: cfg.group };
          row.classList.add("dragging");
          document.body.classList.add("dnd-" + cfg.group); // reveal empty drop zones
          lastPointerY = e.clientY;
          startAutoScroll();
          var pointerId = e.pointerId;
          try { if (grip.setPointerCapture) grip.setPointerCapture(pointerId); } catch (_) {}
          var pending = null;
          function onMove(ev) {
            lastPointerY = ev.clientY;
            pending = resolveTarget(ev.clientX, ev.clientY);
            paintCues(pending);
          }
          function finish(apply) {
            grip.removeEventListener("pointermove", onMove);
            grip.removeEventListener("pointerup", onUp);
            grip.removeEventListener("pointercancel", onCancel);
            try { if (grip.releasePointerCapture) grip.releasePointerCapture(pointerId); } catch (_) {}
            if (apply && pending) moveEntry(pending.listId, pending.index);
            clearDragCues();
          }
          function onUp() { finish(true); }
          function onCancel() { finish(false); }
          grip.addEventListener("pointermove", onMove);
          grip.addEventListener("pointerup", onUp);
          grip.addEventListener("pointercancel", onCancel);
        });

        var input = el(inputSel, "entry-input");
        if (cfg.multiline) input.setAttribute("rows", "1");
        else input.setAttribute("type", "text");
        input.value = val;
        input.placeholder = cfg.placeholder;
        input.addEventListener("input", function () {
          cfg.getArray()[i] = input.value;
          if (cfg.multiline) autoGrow(input);
          updateAddState();
          if (cfg.onChange) cfg.onChange();
          scheduleSave();
        });
        input.addEventListener("blur", function () {
          var a = cfg.getArray();
          if (i < a.length && !String(a[i]).trim()) {
            a.splice(i, 1);
            scheduleSave();
            draw();
          }
        });

        var remove = el("button", "entry-remove",
          { type: "button", "aria-label": cfg.removeLabel, title: cfg.removeLabel });
        remove.textContent = "×";
        remove.addEventListener("click", function () {
          var arr = cfg.getArray();
          // Confirm only when there is actual content to lose.
          if (i < arr.length && String(arr[i]).trim() && cfg.removeConfirm &&
              !window.confirm(cfg.removeConfirm)) return;
          arr.splice(i, 1);
          scheduleSave();
          draw();
        });

        row.appendChild(grip);
        row.appendChild(input);
        row.appendChild(remove);
        list.appendChild(row);
      });

      updateAddState();
      if (cfg.onChange) cfg.onChange();
      sizeAll();
      if (cfg.multiline && typeof requestAnimationFrame === "function") {
        requestAnimationFrame(sizeAll);
      }
    }

    var add = el("button", "entry-add", { type: "button" });
    add.textContent = cfg.addLabel;
    add.addEventListener("click", function () {
      cfg.getArray().push("");
      scheduleSave();
      draw();
      var inputs = list.querySelectorAll(inputSel);
      if (inputs.length) inputs[inputs.length - 1].focus();
    });

    draw();
    field.appendChild(list);
    field.appendChild(add);

    entryLists[cfg.listId] = {
      group: cfg.group, getArray: cfg.getArray, canReceive: canReceive, redraw: draw,
    };
    return field;
  }

  /* Story Allies field for one character (short single-line names).
     Droppable from another character's list only when this character is set. */
  function buildAlliesField(idx, d, onChange) {
    return buildStringListField({
      listId: "allies-" + idx,
      group: "allies",
      fieldClass: "allies-field",
      label: d.allies,
      placeholder: d.alliesPlaceholder,
      addLabel: d.addAlly,
      removeLabel: d.removeAlly,
      removeConfirm: d.confirmRemoveEntry,
      dragLabel: d.dragReorder,
      multiline: false,
      getArray: function () { return activeLog().characters[idx].allies; },
      canReceive: function () { return !!activeLog().characters[idx].characterSlug; },
      canAdd: function () { return !!activeLog().characters[idx].characterSlug; },
      onChange: onChange,
    });
  }

  function renderCharacters() {
    var wrap = document.getElementById("characters");
    wrap.innerHTML = "";
    var log = activeLog();
    var d = tr();
    // Drop stale allies list registrations from a previous render/count.
    Object.keys(entryLists).forEach(function (k) {
      if (k.indexOf("allies-") === 0) delete entryLists[k];
    });
    var selects = [];
    // Disable, in each picker, characters already chosen in another slot.
    function syncCharacterOptions() {
      var chosen = activeLog().characters.map(function (c) { return c.characterSlug; });
      selects.forEach(function (sel, i) {
        var mine = chosen[i];
        sel.querySelectorAll("option").forEach(function (opt) {
          if (!opt.value) { opt.disabled = false; return; } // keep placeholder
          var usedElsewhere = chosen.some(function (s, j) { return j !== i && s === opt.value; });
          opt.disabled = usedElsewhere && opt.value !== mine;
        });
      });
    }
    log.characters.forEach(function (ch, idx) {
      var card = el("div", "character-card");
      var head = el("div", "card-head");
      var title = el("div", "card-title");
      title.textContent = d.character + " " + (idx + 1);
      head.appendChild(title);

      // Remove-character button: enabled only when this character has no
      // (non-empty) allies and is not the last remaining character; confirms.
      var del = el("button", "char-remove", { type: "button" });
      del.textContent = "×";
      del.setAttribute("aria-label", d.removeCharacter);
      function refreshRemove() {
        var c = activeLog().characters[idx];
        if (!c) return;
        var last = activeLog().characters.length <= 1;
        var hasAllies = c.allies.some(function (a) { return String(a).trim(); });
        del.disabled = last || hasAllies;
        del.title = hasAllies ? d.removeCharacterBlocked : d.removeCharacter;
      }
      refreshRemove();
      del.addEventListener("click", function () {
        if (del.disabled) return;
        if (!window.confirm(d.confirmRemoveCharacter)) return;
        activeLog().characters.splice(idx, 1);
        scheduleSave();
        renderCharacters();
      });
      head.appendChild(del);
      card.appendChild(head);

      // --- Character picker (this IS the character's name/identity) ---
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
      selects.push(select);
      var charSub = el("div", "char-subtitle");
      pickField.appendChild(pickLabel);
      pickField.appendChild(select);
      pickField.appendChild(charSub);
      card.appendChild(pickField);

      // Collapsed box shows only the name of the chosen character; other
      // options keep "Name – Subtitle" for picking, and the chosen one's
      // subtitle is shown on its own line below the box.
      function updateCharDisplay() {
        var slug = select.value;
        select.querySelectorAll("option").forEach(function (opt) {
          var r = opt.value && rosterBySlug(opt.value);
          if (!r) return;
          var nm = lang === "de" ? r.nameDe : r.nameEn;
          var sub = lang === "de" ? r.subtitleDe : r.subtitleEn;
          opt.textContent = opt.value === slug ? nm : nm + " – " + sub;
        });
        var cur = slug && rosterBySlug(slug);
        charSub.textContent = cur ? (lang === "de" ? cur.subtitleDe : cur.subtitleEn) : "";
      }
      updateCharDisplay();

      // --- Character Tool picker: the chosen character's tool, front/back
      //     offered as separate options ---
      var toolField = el("div", "field");
      var toolLabel = el("label");
      toolLabel.textContent = d.tool;
      var toolSelect = el("select", "char-select tool-select", { "data-char": idx });
      toolField.appendChild(toolLabel);
      toolField.appendChild(toolSelect);
      card.appendChild(toolField);

      // Rebuild the tool options (the chosen character's two tool sides).
      function refreshToolOptions() {
        toolSelect.innerHTML = "";
        var c = activeLog().characters[idx];
        var r = rosterBySlug(c.characterSlug);
        if (!r) {
          var ph = el("option");
          ph.value = "";
          ph.textContent = d.pickToolPlaceholder;
          toolSelect.appendChild(ph);
          toolSelect.value = "";
          toolSelect.disabled = true;
          return;
        }
        toolSelect.disabled = false;
        r.tools.forEach(function (side) {
          var opt = el("option");
          opt.value = side.slug;
          opt.textContent = sideLabel(side, lang);
          toolSelect.appendChild(opt);
        });
        // Default to the front side if none / an unknown slug is stored.
        if (!toolSlugOf(r, c.toolSlug)) c.toolSlug = r.tools[0].slug;
        toolSelect.value = c.toolSlug;
      }

      toolSelect.addEventListener("change", function () {
        activeLog().characters[idx].toolSlug = toolSelect.value;
        scheduleSave();
      });

      select.addEventListener("change", function () {
        var c = activeLog().characters[idx];
        c.characterSlug = select.value;
        var r = rosterBySlug(select.value);
        c.toolSlug = r ? r.tools[0].slug : ""; // default to front side
        refreshToolOptions();
        updateCharDisplay();    // collapse box to name only + show subtitle below
        syncCharacterOptions(); // update which options are taken in sibling pickers
        // Re-evaluate the allies "add" button (enabled only when a character is set).
        var allies = entryLists["allies-" + idx];
        if (allies) allies.redraw();
        scheduleSave();
      });
      refreshToolOptions();

      // Story Allies: dynamic list of names with add/remove.
      card.appendChild(buildAlliesField(idx, d, refreshRemove));
      wrap.appendChild(card);
    });
    syncCharacterOptions();
    var addChar = document.getElementById("btn-add-char");
    if (addChar) addChar.disabled = log.characters.length >= MAX_CHARACTERS;
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

  function renderEntryLists() {
    var d = tr();
    var notes = document.getElementById("campaignNotes-list");
    notes.innerHTML = "";
    notes.appendChild(buildStringListField({
      listId: "notes",
      group: "notes",
      placeholder: d.notesPlaceholder,
      addLabel: d.addNote,
      removeLabel: d.removeNote,
      removeConfirm: d.confirmRemoveEntry,
      dragLabel: d.dragReorder,
      multiline: true,
      getArray: function () { return activeLog().campaignNotes; },
    }));
    var mods = document.getElementById("modifierPoolUpdates-list");
    mods.innerHTML = "";
    mods.appendChild(buildStringListField({
      listId: "mods",
      group: "mods",
      placeholder: d.modifierPlaceholder,
      addLabel: d.addModifier,
      removeLabel: d.removeModifier,
      removeConfirm: d.confirmRemoveEntry,
      dragLabel: d.dragReorder,
      multiline: true,
      getArray: function () { return activeLog().modifierPoolUpdates; },
    }));
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

  /* Effective theme, resolving "follow system" (null) against the OS setting. */
  function effectiveTheme() {
    if (theme) return theme;
    var m = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)");
    return m && m.matches ? "dark" : "light";
  }
  /* Apply the chosen theme to the document root (or follow system if null). */
  function applyTheme() {
    if (theme) document.documentElement.setAttribute("data-theme", theme);
    else document.documentElement.removeAttribute("data-theme");
  }
  /* Reflect the current theme on the toggle button (icon + localised title). */
  function updateThemeToggle() {
    var btn = document.getElementById("btn-theme");
    if (!btn) return;
    var dark = effectiveTheme() === "dark";
    btn.textContent = dark ? "☀️" : "🌙";      // shows what a click switches to
    btn.title = dark ? tr().themeToLight : tr().themeToDark;
    btn.setAttribute("aria-label", btn.title);
  }

  function renderAll() {
    applyLanguage();
    updateThemeToggle();
    renderLogSelect();
    renderCharacters();
    renderTracks();
    renderEntryLists();
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

    document.getElementById("btn-add-char").addEventListener("click", function () {
      var log = activeLog();
      if (!log || log.characters.length >= MAX_CHARACTERS) return;
      log.characters.push({ characterSlug: "", toolSlug: "", allies: [] });
      scheduleSave();
      renderCharacters();
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

    document.getElementById("btn-theme").addEventListener("click", function () {
      theme = effectiveTheme() === "dark" ? "light" : "dark";
      applyTheme();
      saveStorage();
      updateThemeToggle();
    });
  }

  // ---- Boot ----------------------------------------------------------------
  async function init() {
    loadStorage();
    applyTheme();

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
