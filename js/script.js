/* script.js — builds every page from CONFIG (js/config.js). You normally don't edit this. */
(() => {
  const C = CONFIG;
  const PAGES = ["entry", "welcome", "memories", "letter", "final"];
  const FILES = ["index.html", "welcome.html", "memories.html", "letter.html", "final.html"];
  const i = PAGES.indexOf(document.body.dataset.page);
  const app = document.getElementById("app");
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

  // Soft placeholder shown when a photo file is missing
  window.PH = () => "data:image/svg+xml," + encodeURIComponent(
    "<svg xmlns='http://www.w3.org/2000/svg' width='600' height='600'><rect width='600' height='600' fill='#efd9dc'/>" +
    "<text x='300' y='310' font-size='30' text-anchor='middle' fill='#8a5a63' font-family='serif'>your photo here ✨</text></svg>");

  const photo = (src, alt, cls = "") =>
    `<figure class="polaroid ${cls}"><img src="${esc(src)}" alt="${esc(alt)}" loading="lazy" onerror="this.onerror=null;this.src=PH()"></figure>`;
  const next = t => `<div class="center"><button class="btn" data-go="${FILES[i + 1]}">${t}</button></div>`;

  /* ---------- page transitions + music state ---------- */
  const audio = C.music ? new Audio(C.music) : null;
  const go = file => {
    if (audio) sessionStorage.setItem("music", JSON.stringify({ on: !audio.paused, t: audio.currentTime }));
    if (document.body.classList.contains("zoom")) sessionStorage.setItem("arrive", "1");   // lets the next page fade in softly
    document.body.classList.add("leaving");
    setTimeout(() => (location.href = file), 450);
  };
  document.addEventListener("click", e => { const b = e.target.closest("[data-go]"); if (b) go(b.dataset.go); });

  /* ---------- pages ---------- */
  const views = {
    /* ★ NEW — countdown → 17 burns → 18 → curtains open → lock(). Birthday comes ONLY from config.js */
    entry() {
      const K = C.countdown, target = new Date(C.birthdayDate).getTime();
      const wait = ms => new Promise(r => setTimeout(r, ms)), two = n => String(n).padStart(2, "0");
      const seen = { get: () => { try { return sessionStorage.getItem("bday"); } catch (_) { return null; } },
                     set: () => { try { sessionStorage.setItem("bday", "1"); } catch (_) {} } };
      const bulbs = Array.from({ length: 15 }, (_, n) =>
        `<i style="left:${n * 100 / 14}%;--y:${Math.sin(Math.PI * n / 14) * 26}px;animation-delay:${(n % 5) * .4}s"></i>`).join("");
      app.innerHTML = `<div class="theatre" id="theatre">
        <div class="backdrop" aria-hidden="true"><div class="lights">${bulbs}</div></div>
        <div class="scene" id="scene"></div>
        <div class="curtain l" aria-hidden="true"><div class="cloth"></div></div><div class="curtain r" aria-hidden="true"><div class="cloth"></div></div>
        <div class="hud" id="hud">
          <div class="pre"><p class="hand">${esc(K.curtainTitle)}</p><h1>${esc(K.title)}</h1>
            <div class="clock" role="timer">${K.labels.map(l => `<div class="unit"><b>00</b><span>${esc(l)}</span></div>`).join("")}</div>
            <p class="hand" id="early">${esc(K.earlyMessage)}</p><p class="small">${esc(K.unlockMessage)}</p><p class="eyebrow">${esc(K.curtainSub)}</p></div>
          <div class="post"><div class="age"><b class="old" id="o17">${esc(K.oldAge)}</b><div class="nw" id="n18"><b>${esc(K.newAge)}</b><span>✨</span></div></div>
            <h2 class="bday" id="bday">${esc(K.birthdayMessage)}</h2><p class="hand oline" id="oline">${esc(K.openLine)}</p></div>
          <i class="flare"></i></div></div>`;
      const $ = id => document.getElementById(id);
      const th = $("theatre"), hud = $("hud"), scene = $("scene"), o17 = $("o17"), n18 = $("n18");
      const units = [...hud.querySelectorAll(".unit b")], show = el => el.classList.add("show");
      let started = false;

      const star = n => {                                    // gold sparkles for the 18 reveal
        if (reduced) return;
        for (let k = 0; k < n; k++) {
          const s = document.createElement("span"), a = Math.random() * 6.28, d = 90 + Math.random() * 300;
          s.className = "out gold"; s.textContent = ["✦", "✧", "·"][k % 3];
          s.style.cssText = `--dx:${Math.cos(a) * d}px;--dy:${Math.sin(a) * d}px`;
          document.body.appendChild(s); setTimeout(() => s.remove(), 1700);
        }
      };
      const embers = () => {                                 // ember + smoke particles around the 17
        if (reduced) return; let h = "";
        for (let k = 0; k < 38; k++) h += `<i class="ember" style="--l:${20 + Math.random() * 60}%;--t:${25 + Math.random() * 50}%;--x:${Math.random() * 90 - 45}px;--y:${-70 - Math.random() * 150}px;--d:${1.2 + Math.random() * 1.2}s;--w:${Math.random() * 2}s"></i>`;
        for (let k = 0; k < 5; k++) h += `<i class="smoke" style="--l:${22 + k * 14}%;--w:${.4 + k * .35}s"></i>`;
        o17.parentNode.insertAdjacentHTML("beforeend", h);
      };
      const tick = d => {                                    // d = ms left; ceil so 00:00:00:00 appears only at true zero
        const s = Math.ceil(Math.max(0, d) / 1000), v = [Math.floor(s / 86400), Math.floor(s % 86400 / 3600), Math.floor(s % 3600 / 60), s % 60];
        units.forEach((u, n) => { const t = two(v[n]); if (u.textContent !== t) { u.textContent = t; u.classList.remove("tick"); void u.offsetWidth; u.classList.add("tick"); } });
        if (d < 36e5) $("early").textContent = K.almostMessage;
      };

      // ★ CURTAINS OPEN, then the existing password experience starts (lock() is the old entry page, unchanged)
      const open = async instant => {
        seen.set(); th.classList.add("open"); if (instant) th.classList.add("instant");
        await wait(instant ? 0 : 1300);                      // curtains part first, envelope fades in behind them
        views.lock(scene); scene.classList.add("in");
      };
      // ★ 17 → 18 SEQUENCE: edit the wait() times (ms) to speed up / slow down
      const reveal = async instant => {
        if (started) return; started = true; th.classList.add("bright");
        if (!instant) await wait(900);                       // zeros hold, everything glows brighter
        hud.classList.add("reveal"); await wait(900);        // countdown fades, age block appears
        if (!instant) { show(o17); await wait(1400); o17.classList.add("burn"); embers(); await wait(3100); }   // 17 burns away
        show(n18); hud.classList.add("flash"); star(26); await wait(1700);                                       // 18 appears
        show($("bday")); await wait(1400); show($("oline")); await wait(instant ? 1500 : 2400);
        open(false);
      };
      const loop = () => {                                   // self-correcting 1-second tick, always recomputed from the clock
        const d = target - Date.now();
        if (!(d > 0)) { tick(0); return reveal(false); }
        tick(d); setTimeout(loop, d % 1000 + 20);
      };

      if (target > Date.now()) loop();                       // before birthday: countdown only, no password in the DOM
      else if (seen.get()) open(true);                       // already revealed this session (e.g. pressed "back")
      else { tick(0); reveal(true); }                        // opened after the birthday: brief 18, then curtains
    },

    lock(app) {                                              // the ORIGINAL opening page (envelope + password), now mounted into #scene
      const code = String(C.secretCode), len = code.length;
      const SUBMIT = C.submitKey || "😂";                  // the bottom-right key
      const bad = C.wrongMessages && C.wrongMessages.length ? C.wrongMessages : ["Nope."];
      const fill = s => esc(s).replaceAll("{her}", esc(C.herName));
      // intro letter: blank line = new paragraph; single line breaks just reflow
      const lines = C.introLetter.trim().split(/\n\s*\n/)
        .map(p => `<p>${fill(p.split("\n").map(x => x.trim()).join(" "))}</p>`).join("");
      const lock = `<svg viewBox="0 0 24 24" aria-hidden="true"><path class="shackle" d="M8 11V8a4 4 0 0 1 8 0v3" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><rect x="5" y="11" width="14" height="10" rx="3" fill="currentColor"/></svg>`;
      app.innerHTML = `<div class="gift">
        <header class="top"><p class="hand">${esc(C.topLabel)}</p><h1>${esc(C.heading).replace(/\n/g, "<br> ")}</h1><p class="lead">${esc(C.subheading)}</p></header>
        <div class="stage" id="stage">
          <div class="float" id="float"><div class="env">
            <div class="back"></div>
            <div class="letter" id="letter" aria-hidden="true">${lines}</div>
            <div class="front"><i></i></div><div class="flap"><i></i></div>
            <div class="seal">${lock}</div>
            <div class="tags"><p class="hand">${fill(C.envelopeLabel)}</p><p class="hand small">${esc(C.lockedMessage)}</p></div>
            <p class="note hand">${esc(C.envelopeNote)}<svg viewBox="0 0 30 36" aria-hidden="true"><path d="M24 2C6 6 4 20 12 31M5 25l7 7 6-8" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></p>
            <figure class="polaroid"><img src="${esc(C.entryPhoto)}" alt="A photo for you" onerror="this.onerror=null;this.src=PH()"><figcaption class="hand">${esc(C.photoCaption)}</figcaption></figure>
          </div></div>
          <p class="say hand" id="say" role="status" aria-live="polite"></p>
        </div>
        <section class="panel" id="panel">
          <p class="eyebrow">${esc(C.passwordIntro)}</p><h2>${esc(C.passwordTitle)}</h2><p class="hand locked">${esc(C.passwordSubtitle)}</p>
          <p class="msg" id="msg" role="status" aria-live="polite">${esc(C.promptMessage)}</p>
          <div class="dots" aria-hidden="true">${"<i></i>".repeat(len)}</div>
          <div class="pad" id="pad">${[1, 2, 3, 4, 5, 6, 7, 8, 9, "⌫", 0, SUBMIT].map(k =>
            `<button class="key${k === SUBMIT ? " go" : ""}" data-k="${k}" aria-label="${k === "⌫" ? "delete" : k === SUBMIT ? "unlock" : k}">${k}</button>`).join("")}</div>
        </section></div>`;

      const $ = id => document.getElementById(id);
      const stage = $("stage"), fl = $("float"), panel = $("panel"), msg = $("msg"), say = $("say"), pad = $("pad"), letter = $("letter");
      const dots = panel.querySelectorAll(".dots i");
      let v = "", busy = false, lastBad = -1, tPrompt, done = false;
      const show = (el, s) => { el.textContent = s; el.classList.remove("on"); void el.offsetWidth; el.classList.add("on"); };
      const paint = () => dots.forEach((d, n) => d.classList.toggle("on", n < v.length));

      // sparkles that fly outward from the centre of the screen
      const sparkle = n => {
        if (reduced) return;
        for (let k = 0; k < n; k++) {
          const s = document.createElement("span"), a = Math.random() * 6.28, d = 120 + Math.random() * 280;
          s.className = "out"; s.textContent = ["✦", "✧", "·"][k % 3];
          s.style.cssText = `--dx:${Math.cos(a) * d}px;--dy:${Math.sin(a) * d}px`;
          document.body.appendChild(s); setTimeout(() => s.remove(), 1700);
        }
      };

      const press = k => {
        if (busy) return;
        if (k === SUBMIT) return submit();                    // submit
        if (k === "⌫") v = v.slice(0, -1); else if (v.length < len) v += k;   // never more than the code length
        paint();
      };
      const submit = () => {
        if (v.length < len) return show(msg, C.incompleteMessage);
        busy = true;
        v === code ? unlock() : wrong();
      };
      const wrong = () => {
        let n; do n = Math.floor(Math.random() * bad.length); while (n === lastBad && bad.length > 1);   // never the same joke twice in a row
        lastBad = n; show(msg, bad[n]);
        fl.classList.add("shake"); pad.classList.add("wiggle");
        setTimeout(() => { fl.classList.remove("shake"); pad.classList.remove("wiggle"); v = ""; paint(); busy = false; }, 500);
        clearTimeout(tPrompt); tPrompt = setTimeout(() => { if (!busy) show(msg, C.promptMessage); }, 2800);
      };

      // zoom + fade out, then open the next page (also runs if she taps the letter to skip the wait)
      const finish = () => {
        if (done) return; done = true;
        document.body.classList.add("zoom"); sparkle(30);
        setTimeout(() => go(C.nextPage), 1000);
      };

      // The unlocking story. Times are in milliseconds from the moment the code is right — tweak freely.
      const unlock = () => {
        // make the letter tall enough for however much text you wrote
        stage.style.setProperty("--lh", Math.max(128, Math.ceil(letter.scrollHeight / stage.querySelector(".env").clientHeight * 100) + 4) + "%");
        msg.textContent = ""; panel.classList.add("glow"); show(say, C.waitMessage);                 // dots glow, "WAIT..."
        stage.scrollIntoView({ block: "center", behavior: "smooth" });
        [[900,  () => stage.classList.add("unlocked")],                        // lock opens
         [1400, () => stage.classList.add("opened")],                          // flap opens
         [1950, () => stage.classList.add("rise")],                            // letter slides up
         [2700, () => { stage.classList.add("read"); letter.removeAttribute("aria-hidden"); show(say, C.successMessage); sparkle(16); }],
         [4100, () => { show(say, C.moreMessage); letter.style.cursor = "pointer"; letter.addEventListener("click", finish); }],
         [4100 + (C.holdTime || 6500), finish]                                 // pause so she can read, then transition
        ].forEach(([ms, fn]) => setTimeout(fn, ms));
        mountMusic();                                                          // music button appears only after unlocking
      };

      panel.addEventListener("click", ev => { const b = ev.target.closest(".key"); if (b) press(b.dataset.k); });
      document.addEventListener("keydown", ev => {
        if (ev.ctrlKey || ev.metaKey || ev.altKey) return;                     // leave browser shortcuts alone
        const k = /^\d$/.test(ev.key) ? ev.key : ev.key === "Backspace" ? "⌫" : ev.key === "Enter" ? SUBMIT : null;
        if (k) { ev.preventDefault(); press(k); }                              // preventDefault stops Enter from also clicking a focused key
      });
    },

    welcome() {
      const w = C.welcome;
      app.innerHTML = `<section class="card center"><p class="hand">${w.label}</p><h1>Hey, ${C.herName} ✨</h1>
        <p class="sub">${w.subtitle}</p>${photo(w.photo, "A photo for you", "big tilt")}
        <p class="lead">${w.line}</p><p class="msg">${w.message.join("<br>")}</p>${next(w.button)}</section>`;
    },

    memories() {
      const m = C.memories, tilt = [-3, 2, -1.5, 3, -2, 1.5];
      app.innerHTML = `<header class="head center"><p class="hand">${m.label}</p><h1>${m.title}</h1><p class="sub">${m.subtitle}</p></header>
        <div class="grid">${m.items.map((it, n) => `<article class="mem" style="--r:${tilt[n % 6]}deg">
          ${photo(it.photo, it.title)}<p class="hand date">${it.date}</p><h2>${it.title}</h2><p>${it.caption}</p></article>`).join("")}</div>${next("Continue →")}`;
    },

    letter() {
      const l = C.letter;
      const total = l.paragraphs.join(" ").split(" ").length, step = Math.min(0.06, 7 / total);
      let n = 0;
      const words = t => t.split(" ").map(w => `<span class="w" style="animation-delay:${(n++ * step).toFixed(2)}s">${w}</span>`).join(" ");
      app.innerHTML = `<header class="head center"><p class="hand">${l.label}</p><h1>${l.title}</h1></header>
        <article class="paper"><p>Hey ${C.herName},</p>${l.paragraphs.map(p => `<p>${words(p)}</p>`).join("")}
        <p class="sign">— ${C.yourName}</p></article><p class="hand more center">${l.next}</p>${next(l.button)}`;
    },

    final() {
      const f = C.final;
      app.innerHTML = `<section class="card center"><div class="heart" aria-hidden="true">✨</div><h1>${f.heading}</h1>
        <p class="sub">${f.sub}</p><p class="msg">${f.message}</p>${photo(f.photo, "A final photo", "tilt")}
        <p class="hand foot">${f.footer}</p></section>`;
      setTimeout(() => burst(26), 3000);                // stars appear after a few seconds
    }
  };

  /* ---------- floating stars / hearts ---------- */
  const sky = document.getElementById("sky");
  function burst(n) {
    if (reduced) return;
    for (let k = 0; k < n; k++) {
      const s = document.createElement("span");
      s.textContent = ["✦", "✧", "·", "✦", "✧", "·", "♡"][k % 7];
      s.style.cssText = `left:${Math.random() * 100}%;font-size:${10 + Math.random() * 16}px;` +
        `animation-duration:${12 + Math.random() * 14}s;animation-delay:${-Math.random() * 14}s;--x:${Math.random() * 80 - 40}px`;
      sky.appendChild(s);
    }
  }

  /* ---------- music button ---------- */
  window.mountMusic = () => {
    if (!audio || audio.error || document.querySelector(".music")) return;   // audio.error = music file is missing
    audio.loop = true;
    const btn = document.createElement("button");
    btn.className = "music"; btn.setAttribute("aria-label", "Toggle music"); btn.setAttribute("aria-pressed", "false"); btn.textContent = "♪";
    const sync = () => { btn.classList.toggle("on", !audio.paused); btn.setAttribute("aria-pressed", String(!audio.paused)); };
    btn.onclick = () => { audio.paused ? audio.play().catch(() => {}) : audio.pause(); };
    audio.addEventListener("play", sync); audio.addEventListener("pause", sync);
    audio.addEventListener("error", () => btn.remove());   // no music file → hide button
    document.body.appendChild(btn);
    try {                                                   // resume from the previous page if she had it on
      const s = JSON.parse(sessionStorage.getItem("music") || "null");
      if (s) { audio.currentTime = s.t || 0; if (s.on) audio.play().catch(() => {}); }
    } catch (_) {}
  };
  if (PAGES[i] !== "entry") mountMusic();

  /* ---------- back button, cursor sparkles ---------- */
  if (i > 0) app.insertAdjacentHTML("beforebegin", `<button class="backbtn" data-go="${FILES[i - 1]}">← back</button>`);
  if (matchMedia("(pointer: fine)").matches && !reduced) {
    let last = 0;
    document.addEventListener("mousemove", e => {
      if (Date.now() - last < 70) return; last = Date.now();
      const s = document.createElement("span");
      s.className = "spark"; s.textContent = "✦"; s.style.left = e.clientX + "px"; s.style.top = e.clientY + "px";
      document.body.appendChild(s); setTimeout(() => s.remove(), 800);
    });
  }

  if (sessionStorage.getItem("arrive")) { document.body.classList.add("arrive"); sessionStorage.removeItem("arrive"); }
  views[PAGES[i]]();
  burst(i === 5 ? 8 : 16);
})();