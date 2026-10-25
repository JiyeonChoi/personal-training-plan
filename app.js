(function () {
  const workouts = window.WORKOUTS || [];
  const components = window.COMPONENTS || {};
  const order = Object.keys(components);

  const $ = (id) => document.getElementById(id);
  const esc = (s) =>
    String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

  const ICONS = {
    check: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12l5 5L20 7"/></svg>`,
    clock: `<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>`,
    play: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg>`,
    repeat: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M17 2l4 4-4 4"/><path d="M3 11V9a3 3 0 0 1 3-3h15"/><path d="M7 22l-4-4 4-4"/><path d="M21 13v2a3 3 0 0 1-3 3H3"/></svg>`,
    close: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>`,
    left: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 18l-6-6 6-6"/></svg>`,
    right: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 6l6 6-6 6"/></svg>`,
  };

  // Ticked-off exercises are remembered on her phone only.
  const store = {
    get(k) { try { return JSON.parse(localStorage.getItem(k)) || {}; } catch { return {}; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* private mode */ } },
  };

  // Exercises in display order, used by focus mode.
  let steps = [];
  let focusIdx = 0;
  let setsDone = {};

  function current() {
    const id = decodeURIComponent(location.hash.slice(1));
    return workouts.find((w) => w.id === id) || workouts[0];
  }

  function dose(ex) {
    if (ex.sets && ex.reps) return `${ex.sets} × ${ex.reps}`;
    if (ex.sets) return `${ex.sets} sets`;
    if (ex.reps) return `${ex.reps} reps`;
    return "";
  }

  function videoHtml(url) {
    if (!url) return "";
    let m = url.match(/(?:youtube\.com\/(?:watch\?v=|shorts\/|embed\/)|youtu\.be\/)([\w-]{11})/);
    if (m) {
      return `<div class="video embed"><iframe loading="lazy" allowfullscreen
        allow="accelerometer; encrypted-media; gyroscope; picture-in-picture"
        src="https://www.youtube-nocookie.com/embed/${m[1]}?playsinline=1&rel=0"></iframe></div>`;
    }
    m = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
    if (m) {
      return `<div class="video embed"><iframe loading="lazy" allowfullscreen allow="fullscreen; picture-in-picture"
        src="https://player.vimeo.com/video/${m[1]}"></iframe></div>`;
    }
    return `<div class="video"><video src="${esc(url)}" controls playsinline preload="metadata"></video></div>`;
  }

  function mediaHtml(ex) {
    const images = [].concat(ex.image || []).filter(Boolean);
    const gallery = images.length
      ? `<div class="gallery${images.length > 1 ? " multi" : ""}">${images
          .map((src) => `<img src="${esc(src)}" alt="${esc(ex.name)}" loading="lazy">`).join("")}</div>`
      : "";
    return gallery + videoHtml(ex.video);
  }

  function hasMedia(ex) {
    return [].concat(ex.image || []).filter(Boolean).length > 0 || !!ex.video;
  }

  function cardHtml(ex, key) {
    const media = hasMedia(ex);
    const expandable = media || !!ex.notes;
    const d = dose(ex);
    const details = [
      d && `<span class="dose">${esc(d)}</span>`,
      ex.min && `<span>${ICONS.clock}${esc(ex.min)} min</span>`,
      ex.target && `<span class="target">${esc(ex.target)}</span>`,
      media && `<span class="has-media">${ICONS.play}Demo</span>`,
    ].filter(Boolean).join("");

    return `
      <article class="card" data-key="${esc(key)}">
        <div class="row">
          <span class="no">${esc(ex.no)}</span>
          <button class="main" type="button" ${expandable ? 'aria-expanded="false"' : "disabled"}>
            <span class="name">${esc(ex.name)}</span>
            ${details ? `<span class="details">${details}</span>` : ""}
          </button>
          <button class="check" type="button" aria-label="Mark ${esc(ex.name)} done">${ICONS.check}</button>
        </div>
        ${expandable ? `<div class="body">
          ${mediaHtml(ex)}
          ${ex.notes ? `<p class="notes">${esc(ex.notes)}</p>` : ""}
        </div>` : ""}
      </article>`;
  }

  function render() {
    const w = current();
    const tabs = $("tabs");
    tabs.innerHTML = workouts.length > 1
      ? workouts.map((x) => `<a class="tab" href="#${encodeURIComponent(x.id)}" aria-current="${x === w}">${esc(x.title || x.id)}</a>`).join("")
      : "";

    if (!w) {
      $("plan").innerHTML = `<p class="empty">No workouts yet.</p>`;
      $("start").hidden = true;
      return;
    }
    $("eyebrow").textContent = w.title || "Workout Plan";
    $("title").textContent = w.heading || "Today’s session";
    document.title = w.title || "Workout Plan";

    const exercises = w.exercises.filter((e) => e && e.name);
    const sections = {};
    exercises.forEach((ex, i) => {
      const c = ex.component || "other";
      (sections[c] = sections[c] || []).push({ ex, key: `${ex.no || ""}|${ex.name}|${i}` });
    });
    const keys = Object.keys(sections).sort((a, b) => {
      const ia = order.indexOf(a), ib = order.indexOf(b);
      return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib);
    });

    const totalMin = exercises.reduce((n, ex) => n + (Number(ex.min) || 0), 0);
    const stats = [
      totalMin && [`~${totalMin}`, "minutes"],
      [exercises.length, exercises.length === 1 ? "exercise" : "exercises"],
      [keys.length, keys.length === 1 ? "section" : "sections"],
    ].filter(Boolean);
    $("stats").innerHTML = stats.map(([v, l]) => `<div class="stat"><b>${esc(v)}</b><span>${esc(l)}</span></div>`).join("");

    steps = [];
    let html = w.intro ? `<p class="intro">${esc(w.intro)}</p>` : "";
    keys.forEach((c, si) => {
      const info = components[c] || { label: c, color: "#888888" };
      const items = sections[c];
      const mins = items.reduce((n, { ex }) => n + (Number(ex.min) || 0), 0);
      html += `<section class="section" style="--c:${esc(info.color)}">
        <div class="section-head">
          <div class="section-title">
            <span class="section-num">${String(si + 1).padStart(2, "0")}</span>
            <h2>${esc(info.label)}</h2>
            <span class="dot" aria-hidden="true"></span>
          </div>
          ${mins ? `<span class="meta">~${mins} min</span>` : ""}
        </div>`;

      // Group 7.1 / 7.2 / 7.3 into one superset block.
      for (let i = 0; i < items.length; ) {
        const group = String(items[i].ex.no || "").includes(".") ? String(items[i].ex.no).split(".")[0] : null;
        let j = i + 1;
        if (group) while (j < items.length && String(items[j].ex.no || "").split(".")[0] === group && String(items[j].ex.no).includes(".")) j++;
        const chunk = items.slice(i, j);
        const isSuperset = group && chunk.length > 1;
        const rounds = Math.max(...chunk.map(({ ex }) => Number(ex.sets) || 0));
        chunk.forEach(({ ex, key }, k) => {
          steps.push({ ex, key, info, superset: isSuperset ? { group, pos: k + 1, len: chunk.length } : null });
        });
        if (isSuperset) {
          html += `<div class="superset">
            <p class="superset-label"><b>${ICONS.repeat}Superset ${esc(group)}</b><span>back to back${rounds ? ` · ${rounds} rounds` : ""}</span></p>
            ${chunk.map(({ ex, key }) => cardHtml(ex, key)).join("")}</div>`;
        } else {
          html += chunk.map(({ ex, key }) => cardHtml(ex, key)).join("");
        }
        i = j;
      }
      html += `</section>`;
    });
    html += `<p class="footnote">Ticks are saved on this phone only.</p>`;
    $("plan").innerHTML = html;
    $("start").hidden = steps.length === 0;
    applyDone();
  }

  function doneKey() { return "workout-done:" + (current()?.id ?? ""); }

  function applyDone() {
    const done = store.get(doneKey());
    const cards = document.querySelectorAll(".card");
    let count = 0;
    cards.forEach((card) => {
      const on = !!done[card.dataset.key];
      card.classList.toggle("done", on);
      card.querySelector(".check").setAttribute("aria-pressed", on);
      if (on) count++;
    });
    const total = cards.length;
    $("bar-fill").style.width = total ? `${(count / total) * 100}%` : "0";
    $("progress-text").textContent = total ? (count === total ? "All done" : `${count} of ${total} done`) : "";
    $("start-label").textContent = count === 0 ? "Start workout" : count === total ? "Go again" : "Continue workout";
  }

  // ── Focus mode: one exercise at a time ─────────────────
  function renderFocus() {
    const s = steps[focusIdx];
    if (!s) return;
    const { ex, info, superset } = s;
    const segs = steps.map((_, i) => `<span class="${i < focusIdx ? "past" : i === focusIdx ? "now" : ""}"></span>`).join("");
    const stat = (v, l) => (v ? `<div><b>${esc(v)}</b><span>${l}</span></div>` : "");
    const last = focusIdx === steps.length - 1;
    const setCount = Number(ex.sets) || 0;
    const sets = Array.from({ length: setCount }, (_, i) =>
      `<button class="set" type="button" data-set="${i}" aria-pressed="false">Set ${i + 1}</button>`).join("");

    $("focus").innerHTML = `<div class="focus-inner" style="--c:${esc(info.color)}">
      <div class="focus-top">
        <button class="icon-btn" type="button" data-act="close" aria-label="Back to plan">${ICONS.close}</button>
        <span class="focus-section"><span class="dot" aria-hidden="true"></span>${esc(info.label)}</span>
        <span class="focus-pos">${focusIdx + 1} / ${steps.length}</span>
      </div>
      <div class="segs" aria-hidden="true">${segs}</div>
      ${mediaHtml(ex)}
      <div class="focus-head">
        ${superset ? `<span class="pill">Superset ${esc(superset.group)} · ${superset.pos} of ${superset.len}</span>` : ""}
        <h2>${esc(ex.name)}</h2>
        ${ex.target ? `<span class="focus-target">Target · <b>${esc(ex.target)}</b></span>` : ""}
        ${ex.notes ? `<p class="notes">${esc(ex.notes)}</p>` : ""}
      </div>
      <div class="focus-stats">${stat(ex.sets, "sets")}${stat(ex.reps, "reps")}${stat(ex.min, "minutes")}</div>
      ${setCount ? `<div class="sets"><span>Tap each set as you finish it</span><div class="set-row">${sets}</div></div>` : ""}
      <div class="focus-nav">
        <button class="prev" type="button" data-act="prev" aria-label="Previous exercise" ${focusIdx === 0 ? "disabled" : ""}>${ICONS.left}</button>
        <button class="next" type="button" data-act="next">${last ? "Finish workout" : "Done, next"}${ICONS.right}</button>
      </div>
    </div>`;
    applySets();
    $("focus").scrollTop = 0;
  }

  function applySets() {
    const n = setsDone[steps[focusIdx]?.key] || 0;
    $("focus").querySelectorAll(".set").forEach((b, i) => {
      b.setAttribute("aria-pressed", i < n);
      b.textContent = `Set ${i + 1}${i < n ? " ✓" : ""}`;
    });
  }

  function openFocus() {
    if (!steps.length) return;
    const done = store.get(doneKey());
    const next = steps.findIndex((s) => !done[s.key]);
    focusIdx = next < 0 ? 0 : next;
    setsDone = {};
    renderFocus();
    $("focus").hidden = false;
    document.body.classList.add("locked");
    $("focus").querySelector('[data-act="close"]').focus();
  }

  function closeFocus() {
    $("focus").hidden = true;
    $("focus").innerHTML = "";
    document.body.classList.remove("locked");
    applyDone();
    $("start").focus();
  }

  $("focus").addEventListener("click", (e) => {
    const set = e.target.closest(".set");
    if (set) {
      const i = Number(set.dataset.set);
      const key = steps[focusIdx].key;
      const n = setsDone[key] || 0;
      setsDone[key] = n === i + 1 ? i : i + 1;
      applySets();
      return;
    }
    const act = e.target.closest("[data-act]")?.dataset.act;
    if (act === "close") closeFocus();
    else if (act === "prev" && focusIdx > 0) { focusIdx--; renderFocus(); }
    else if (act === "next") {
      const done = store.get(doneKey());
      done[steps[focusIdx].key] = true;
      store.set(doneKey(), done);
      if (focusIdx === steps.length - 1) closeFocus();
      else { focusIdx++; renderFocus(); }
    }
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !$("focus").hidden) closeFocus();
  });

  $("start").addEventListener("click", openFocus);

  // ── Plan list ──────────────────────────────────────────
  $("plan").addEventListener("click", (e) => {
    const card = e.target.closest(".card");
    if (!card) return;
    if (e.target.closest(".check")) {
      const done = store.get(doneKey());
      done[card.dataset.key] = !done[card.dataset.key];
      store.set(doneKey(), done);
      applyDone();
    } else if (e.target.closest(".main:not(:disabled)")) {
      const open = card.classList.toggle("open");
      card.querySelector(".main").setAttribute("aria-expanded", open);
      if (!open) card.querySelectorAll("video").forEach((v) => v.pause());
    }
  });

  $("reset").addEventListener("click", () => {
    store.set(doneKey(), {});
    applyDone();
  });

  window.addEventListener("hashchange", () => { render(); window.scrollTo(0, 0); });
  render();
})();
