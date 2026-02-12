/* UI_BUILD: ts-ui-v17-20260212-a1 */
(function () {
  const API_BASE = "https://api.kenai.technology";
  const $ = (id) => document.getElementById(id);

  const elUrl = $("url");
  const elRun = $("run");
  const elOut = $("out");
  const elCopy = $("copy");

  let lastChapters = "";

  function setBusy(isBusy, msg) {
    elRun.disabled = isBusy;
    if (msg) elOut.textContent = msg;
  }

  function formatChapters(input) {
    if (!input) return "";
    const s = String(input).trim();
    if (!s) return "";
    return s;
  }

  async function run() {
    const url = (elUrl.value || "").trim();
    if (!url) {
      elOut.textContent = "Fyll i en URL.";
      return;
    }

    setBusy(true, "AI jobbar…");
    elCopy.disabled = true;
    lastChapters = "";

    try {
      const r = await fetch(API_BASE + "/api/timestamps", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ url })
      });

      const raw = await r.text();
      let data;
      try { data = JSON.parse(raw); } catch (e) { data = { ok: false, error: "Non-JSON från API", raw: raw.slice(0, 800) }; }

      if (!r.ok || !data || data.ok === false) {
        const err = (data && (data.error || data.message)) ? (data.error || data.message) : ("HTTP " + r.status);
        elOut.textContent = "Fel: " + err + (data && data.raw ? ("\n\nRAW:\n" + data.raw) : "");
        return;
      }

      const chapters = formatChapters(data.chapters || data.timestamps || "");
      const summary = (data.summary ? String(data.summary).trim() : "");

      lastChapters = chapters;
      elCopy.disabled = !chapters;

      const parts = [];
      parts.push("URL: " + (data.url || url));
      if (summary) {
        parts.push("");
        parts.push("SUMMARY:");
        parts.push(summary);
      }
      if (chapters) {
        parts.push("");
        parts.push("KAPITEL:");
        parts.push(chapters);
      }
      if (!summary && !chapters) {
        parts.push("");
        parts.push("Svar OK, men inget innehåll returnerades.");
      }

      elOut.textContent = parts.join("\n");
    } catch (e) {
      elOut.textContent = "Fel: " + (e && e.message ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  async function copyChapters() {
    if (!lastChapters) return;
    try {
      await navigator.clipboard.writeText(lastChapters);
      elOut.textContent = "Kopierat.\n\n" + lastChapters;
    } catch (e) {
      elOut.textContent = "Kunde inte kopiera (browser block). Markera manuellt:\n\n" + lastChapters;
    }
  }

  elRun.addEventListener("click", run);
  elCopy.addEventListener("click", copyChapters);
  elUrl.addEventListener("keydown", (e) => {
    if (e.key === "Enter") run();
  });

  console.log("UI_BUILD ts-ui-v17-20260212-a1", "API_BASE", API_BASE);
})();
