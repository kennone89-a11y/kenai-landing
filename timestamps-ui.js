(() => {
  const UI_BUILD = "ts-ui-v16-20260209-a1";
  console.log("UI_BUILD", UI_BUILD);

  // IMPORTANT: app.kenai.technology is STATIC UI. API must go to Node backend.
  const API_BASE = "https://api.kenai.technology";
  const $ = (id) => document.getElementById(id);

  const inputUrl = $("inputUrl");
  const btnGen = document.getElementById("btnGenerate") || document.getElementById("btnGen");
  const statusEl = $("statusText");

  const taChapters = $("taChapters");
  const taSummary = $("taSummary");
  const taDesc = $("taDesc");

  function setStatus(msg, kind) {
    if (!statusEl) return;
    statusEl.textContent = msg;
    statusEl.className = kind ? `status ${kind}` : "status";
  }

  function buildDescBox(chapters, summary, url) {
    if (!taDesc) return;
    const parts = [];
    parts.push("Kapitel:");
    parts.push((chapters || "").trim());
    parts.push("");
    parts.push("Sammanfattning:");
    parts.push((summary || "").trim());
    parts.push("");
    parts.push("Länk:");
    parts.push(url || "");
    taDesc.value = parts.join("\n");
  }

  async function postJSON(path, payload) {
  const BAD_JSON = (status, body) => {
    const msg = "HTTP " + status + (body ? (": " + body.slice(0, 200)) : "");
    throw new Error(msg);
  };
    const res = await fetch(`${API_BASE}${path}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });

    
    const bodyText = await res.text();
    if (!res.ok) BAD_JSON(res.status, bodyText);
    let data = {};
    try { data = bodyText ? JSON.parse(bodyText) : {}; } catch (e) { BAD_JSON(res.status, bodyText || "Invalid JSON"); }
    return data;
const txt = await res.text().catch(() => "");
    if (!txt || !txt.trim()) {
      throw new Error("Backend returnerade tomt svar.");
    }

    try {
      data = JSON.parse(txt);
    } catch (e) {
      throw new Error("Backend returnerade ogiltig JSON: " + txt.slice(0, 200));
    }

    if (!res.ok) {
      throw new Error((data && (data.error || data.message)) ? (data.error || data.message) : ("HTTP " + res.status));
    }

    return data;
  }

  async function generate() {
  alert("GEN_START");

    try {
      const url = (inputUrl && inputUrl.value ? String(inputUrl.value) : "").trim();
      if (!url) {
        setStatus("Klistra in en YouTube-länk först.", "bad");
        return;
      }

      btnGen && (btnGen.disabled = true);
      setStatus("AI jobbar…", "warn");


      const chapters =
        data.chapters ||
        data.timestamps ||
        (data.result && (data.result.chapters || data.result.timestamps)) ||
        "";

      const summary =
        data.summary ||
        (data.result && data.result.summary) ||
        "";

      if (taChapters) taChapters.value = String(chapters || "").trim();
      if (taSummary) taSummary.value = String(summary || "").trim();
      buildDescBox(chapters, summary, url);

      setStatus("Klart.", "ok");
    } catch (e) {
      console.error(e);
      setStatus(e && e.message ? e.message : "Misslyckades.", "bad");
    } finally {
      btnGen && (btnGen.disabled = false);
    }
  }

  try {
    if (btnGen) {
      btnGen.disabled = false;
      btnGen.addEventListener("click", generate);
      btnGen.onclick = generate;
      console.log("BIND_OK btnGenerate");
    } else {
      console.error("BIND_FAIL btnGenerate NOT FOUND");
    }
  } catch (e) { console.error("BIND_ERR", e); }

})();


try {
  if (typeof generate === 'function') {
    window.__tsGenerate = async function(){
      try { return await generate(); }
      catch (e) { alert('GEN_ERR ' + (e && e.message ? e.message : e)); throw e; }
    };
    console.log('TS_BIND_GLOBAL_OK');
  } else {
    console.log('TS_BIND_GLOBAL_NO_GENERATE');
  }
} catch (e) { console.log('TS_BIND_GLOBAL_ERR', e); }


function getPlan() {
  var el = document.getElementById("planSelect");
  return el ? String(el.value || "free") : "free";
}

function explainApiError(e) {
  var msg = String(e && e.message ? e.message : e);
  if (msg.indexOf("NO_TRANSCRIPT") !== -1) return "Videon saknar CC. Premium/Gold krävs för ljudanalys.";
  if (msg.indexOf("VIDEO_TOO_LONG") !== -1) return "Videon är för lång för din plan.";
  if (msg.indexOf("AUDIO_FALLBACK_NOT_IMPLEMENTED") !== -1) return "CC saknas. Ljudanalys kommer i nästa steg.";
  return msg;
}

/* KENAI_UI_ABCD_PATCH_BEGIN */
(() => {
  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => Array.from(document.querySelectorAll(sel));

  // Try to detect likely controls without knowing exact IDs
  const findGenerateButton = () =>
    $("#btnGenerate") || $("#btnGo") || $("#btnCreate") || $("button[data-action='generate']") ||
    $$("button").find(b => /generera|generate|skapa|build/i.test(b.textContent || ""));

  const findUrlInput = () =>
    $("#url") || $("#youtubeUrl") || $("#ytUrl") || $("input[type='url']") ||
    $$("input").find(i => /youtube|url/i.test(i.id || ""));

  const ensureToast = () => {
    let t = $("#kenaiToast");
    if (!t) {
      t = document.createElement("div");
      t.id = "kenaiToast";
      t.setAttribute("aria-live", "polite");
      document.body.appendChild(t);
    }
    return t;
  };

  let toastTimer = null;
  const toast = (msg) => {
    const t = ensureToast();
    t.textContent = msg;
    t.classList.add("show");
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove("show"), 1100);
  };

  const ensureHover = () => {
    let hp = $("#kenaiHoverPreview");
    if (!hp) {
      hp = document.createElement("div");
      hp.id = "kenaiHoverPreview";
      hp.innerHTML = `
        <img alt="Preview" />
        <div class="meta">
          <div class="t"></div>
          <div class="h"></div>
        </div>
      `;
      document.body.appendChild(hp);
    }
    return hp;
  };

  const ensureLoading = () => {
    let el = $("#kenaiLoading");
    if (!el) {
      el = document.createElement("div");
      el.id = "kenaiLoading";
      el.className = "kenai-loading";
      el.style.display = "none";
      el.innerHTML = `
        <span class="kenai-dot"></span>
        <span class="kenai-dot"></span>
        <span class="kenai-dot"></span>
        <span id="kenaiLoadingText">AI jobbar…</span>
      `;
      // Put it near top, inside main if possible
      const main = $("main") || document.body;
      main.prepend(el);
    }
    return el;
  };

  const setLoading = (on, msg) => {
    const el = ensureLoading();
    const btn = findGenerateButton();
    const text = $("#kenaiLoadingText");
    if (text && msg) text.textContent = msg;
    el.style.display = on ? "inline-flex" : "none";
    if (btn) btn.disabled = !!on;
  };

  const copyFrom = async (ta, label) => {
    if (!ta) return toast("Hittar inget att kopiera");
    const val = (ta.value || "").trim();
    if (!val) return toast("Inget att kopiera");
    try {
      await navigator.clipboard.writeText(val);
      toast(`${label}: kopierat`);
    } catch (e) {
      // fallback
      ta.focus();
      ta.select();
      const ok = document.execCommand("copy");
      toast(ok ? `${label}: kopierat` : "Kunde inte kopiera");
      window.getSelection && window.getSelection().removeAllRanges && window.getSelection().removeAllRanges();
    }
  };

  const fmtTime = (s) => {
    s = Math.max(0, Math.floor(Number(s) || 0));
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    const p2 = (n) => String(n).padStart(2, "0");
    return h > 0 ? `${h}:${p2(m)}:${p2(sec)}` : `${p2(m)}:${p2(sec)}`;
  };

  const parseVideoId = (raw) => {
    try {
      if (!raw) return null;
      const u = new URL(raw);
      // youtu.be/<id>
      if (u.hostname.includes("youtu.be")) return u.pathname.replace("/", "") || null;
      // youtube.com/watch?v=<id>
      const v = u.searchParams.get("v");
      if (v) return v;
      // shorts/<id>
      const parts = u.pathname.split("/").filter(Boolean);
      const shortsIdx = parts.indexOf("shorts");
      if (shortsIdx >= 0 && parts[shortsIdx + 1]) return parts[shortsIdx + 1];
      return null;
    } catch {
      return null;
    }
  };

  const getCurrentVideoId = () => {
    const inp = findUrlInput();
    const raw = inp ? inp.value : localStorage.getItem("kenai_ts_last_url");
    return parseVideoId(raw);
  };

  const showHover = (x, y, timeSec, title) => {
    const vid = getCurrentVideoId();
    if (!vid) return;
    const hp = ensureHover();
    const img = hp.querySelector("img");
    const t = hp.querySelector(".meta .t");
    const h = hp.querySelector(".meta .h");
    // v1: static thumbnail (fast win); time/title shown
    img.src = `https://i.ytimg.com/vi/${vid}/hqdefault.jpg`;
    if (t) t.textContent = fmtTime(timeSec);
    if (h) h.textContent = title || "";
    hp.style.display = "block";

    const pad = 12;
    let left = x + pad;
    let top = y + pad;
    const w = 260;
    const hh = 200;
    if (left + w > window.innerWidth - 8) left = x - w - pad;
    if (top + hh > window.innerHeight - 8) top = y - hh - pad;
    hp.style.left = `${Math.max(8, left)}px`;
    hp.style.top = `${Math.max(8, top)}px`;
  };

  const hideHover = () => {
    const hp = $("#kenaiHoverPreview");
    if (hp) hp.style.display = "none";
  };

  const wireCopyButtons = () => {
    const btnCh = $("#btnCopyChapters");
    const btnSum = $("#btnCopySummary");
    const btnAll = $("#btnCopyAll");

    const taCh = $("#chapters");
    const taSum = $("#summary");
    const taAll = $("#allBox");

    if (btnCh) btnCh.addEventListener("click", () => copyFrom(taCh, "Kapitel"));
    if (btnSum) btnSum.addEventListener("click", () => copyFrom(taSum, "Sammanfattning"));
    if (btnAll) btnAll.addEventListener("click", () => copyFrom(taAll, "Allt"));
  };

  const smallWins = () => {
    // D1) Persist URL
    const inp = findUrlInput();
    if (inp) {
      const saved = localStorage.getItem("kenai_ts_last_url");
      if (saved && !inp.value) inp.value = saved;
      inp.addEventListener("input", () => localStorage.setItem("kenai_ts_last_url", inp.value || ""));
      // D2) Enter to generate
      inp.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
          const btn = findGenerateButton();
          if (btn) btn.click();
        }
      });
    }

    // D3) Clickable chapter list -> seeks textarea cursor + scroll + quick copy feedback
    const list = $("#chapList");
    const taCh = $("#chapters");
    if (list && taCh) {
      list.addEventListener("click", (e) => {
        const item = e.target.closest("[data-time],[data-t],[data-start]") || e.target.closest(".chap") || e.target;
        if (!item) return;
        const tRaw = item.getAttribute("data-time") || item.getAttribute("data-t") || item.getAttribute("data-start") || "";
        const timeSec = Number(tRaw) || 0;
        const title = (item.getAttribute("data-title") || item.textContent || "").trim();
        toast(`Kapitel: ${fmtTime(timeSec)}`);
        // Ensure chapters textarea visible
        taCh.scrollIntoView({ behavior: "smooth", block: "center" });
        taCh.focus({ preventScroll: true });
      });

      // B) Hover preview
      list.addEventListener("mousemove", (e) => {
        const item = e.target.closest("[data-time],[data-t],[data-start]") || e.target.closest(".chap");
        if (!item) return hideHover();
        const tRaw = item.getAttribute("data-time") || item.getAttribute("data-t") || item.getAttribute("data-start") || "";
        const timeSec = Number(tRaw) || 0;
        const title = (item.getAttribute("data-title") || item.textContent || "").trim();
        showHover(e.clientX, e.clientY, timeSec, title);
      });
      list.addEventListener("mouseleave", hideHover);
    }
  };

  // A) Loading state hook: we monkey-patch fetch to toggle loading when calling /api/timestamps
  const patchFetchForLoading = () => {
    const _fetch = window.fetch;
    window.fetch = async (...args) => {
      try {
        const url = String(args[0] || "");
        const isTS = url.includes("/api/timestamps") || url.includes("/api/timestamps?");
        if (isTS) setLoading(true, "AI jobbar…");
        const res = await _fetch(...args);
        if (isTS) setLoading(false);
        return res;
      } catch (err) {
        setLoading(false);
        throw err;
      }
    };
  };

  const init = () => {
    ensureToast();
    ensureHover();
    ensureLoading();
    patchFetchForLoading();
    wireCopyButtons();
    smallWins();
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
/* KENAI_UI_ABCD_PATCH_END */
