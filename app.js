(function () {
  const workouts = window.WORKOUTS || [];
  const components = window.COMPONENTS || {};
  const order = Object.keys(components);

  const $ = (id) => document.getElementById(id);
  const esc = (s) =>
    String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

  // Ticked-off exercises are remembered on her phone only.
  const store = {
    get(k) { try { return JSON.parse(localStorage.getItem(k)) || {}; } catch { return {}; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* private mode */ } },
  };

  function current() {
    const id = decodeURIComponent(location.hash.slice(1));
    return workouts.find((w) => w.id === id) || workouts[0];
  }

  function dose(ex) {
    const parts = [];
    if (ex.sets && ex.reps) parts.push(`${ex.sets} × ${ex.reps}`);
    else if (ex.sets) parts.push(`${ex.sets} sets`);
    else if (ex.reps) parts.push(`${ex.reps} reps`);
    return parts.join("");
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

  function cardHtml(ex, key) {
    const images = [].concat(ex.image || []).filter(Boolean);
    const hasMedia = images.length > 0 || !!ex.video;
    const expandable = hasMedia || !!ex.notes;
    const d = dose(ex);
    const details = [
      d && `<span class="dose">${esc(d)}</span>`,
      ex.min && `<span>${esc(ex.min)} min</span>`,
      ex.target && `<span class="target">${esc(ex.target)}</span>`,
      hasMedia && `<span class="has-media">▶ Demo</span>`,
    ].filter(Boolean).join("");

    const gallery = images.length
      ? `<div class="gallery${images.length > 1 ? " multi" : ""}">${images
          .map((src) => `<img src="${esc(src)}" alt="${esc(ex.name)}" loading="lazy">`).join("")}</div>`
      : "";

    return `
      <article class="card" data-key="${esc(key)}">
        <div class="row">
          <span class="no">${esc(ex.no)}</span>
          <button class="main" type="button" ${expandable ? 'aria-expanded="false"' : "disabled"}>
            <span class="name">${esc(ex.name)}</span>
            ${details ? `<span class="details">${details}</span>` : ""}
          </button>
          <button class="check" type="button" aria-label="Mark ${esc(ex.name)} done">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12l5 5L20 7"/></svg>
          </button>
        </div>
        ${expandable ? `<div class="body">
          ${ex.notes ? `<p class="notes">${esc(ex.notes)}</p>` : ""}
          ${gallery}
          ${videoHtml(ex.video)}
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
      return;
    }
    $("title").textContent = w.title || "Workout Plan";
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

    let html = w.intro ? `<p class="intro">${esc(w.intro)}</p>` : "";
    for (const c of keys) {
      const info = components[c] || { label: c, color: "#888" };
      const items = sections[c];
      const mins = items.reduce((n, { ex }) => n + (Number(ex.min) || 0), 0);
      html += `<section class="section" style="--c:${esc(info.color)}">
        <div class="section-head"><h2>${esc(info.label)}</h2>${mins ? `<span class="meta">~${mins} min</span>` : ""}</div>`;

      // Group 7.1 / 7.2 / 7.3 into one superset block.
      for (let i = 0; i < items.length; ) {
        const group = String(items[i].ex.no || "").includes(".") ? String(items[i].ex.no).split(".")[0] : null;
        let j = i + 1;
        if (group) while (j < items.length && String(items[j].ex.no || "").split(".")[0] === group && String(items[j].ex.no).includes(".")) j++;
        const chunk = items.slice(i, j);
        if (group && chunk.length > 1) {
          html += `<div class="superset"><p class="superset-label">Superset · do back to back, then repeat</p>
            ${chunk.map(({ ex, key }) => cardHtml(ex, key)).join("")}</div>`;
        } else {
          html += chunk.map(({ ex, key }) => cardHtml(ex, key)).join("");
        }
        i = j;
      }
      html += `</section>`;
    }
    $("plan").innerHTML = html;
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
    $("progress-text").textContent = total ? (count === total ? "All done 🎉" : `${count} / ${total} done`) : "";
  }

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
