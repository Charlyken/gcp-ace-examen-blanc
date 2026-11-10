(function () {
  "use strict";

  /* ---------------- Réglages ---------------- */
  const CONFIG = {
    examSize: 50,          // nombre de questions de l'examen blanc
    examMinutes: 120,      // durée du chronomètre
    passPct: 70,           // seuil de réussite indicatif
    lowTimeMs: 10 * 60000  // le chrono passe en rouge sous ce délai
  };
  const KEYS = { exam: "ace.session.exam", practice: "ace.session.practice", history: "ace.history", stats: "ace.stats", version: "ace.version" };
  // À incrémenter dès que le format des données sauvegardées change : les anciennes données sont alors purgées.
  const STORAGE_VERSION = 1;
  const LETTERS = "ABCDE";
  const Q_BY_ID = Object.fromEntries(QUESTIONS.map(q => [q.id, q]));
  const REDUCED = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------------- Icônes (SVG en ligne) ---------------- */
  const svg = p => `<svg class="ic" viewBox="0 0 24 24" aria-hidden="true">${p}</svg>`;
  const IC = {
    clock: svg('<circle cx="12" cy="13" r="8"/><path d="M12 9v4l2.5 2.5M9 2h6"/>'),
    target: svg('<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>'),
    check: svg('<path d="M5 12.5l4.5 4.5L19 7.5"/>'),
    cross: svg('<path d="M6 6l12 12M18 6L6 18"/>'),
    flag: svg('<path d="M5 21V4h11l-1.5 4 1.5 4H5"/>'),
    next: svg('<path d="M5 12h14M13 6l6 6-6 6"/>'),
    prev: svg('<path d="M19 12H5M11 6l-6 6 6 6"/>')
  };

  /* ---------------- Stockage local (peut être indisponible) ---------------- */
  const store = {
    get(key) { try { return JSON.parse(localStorage.getItem(key)); } catch (e) { return null; } },
    set(key, value) { try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) { /* on continue en mémoire */ } },
    del(key) { try { localStorage.removeItem(key); } catch (e) {} }
  };

  try {
    if (store.get(KEYS.version) !== STORAGE_VERSION) {
      ["exam", "practice", "history", "stats"].forEach(k => store.del(KEYS[k]));
      store.set(KEYS.version, STORAGE_VERSION);
    }
  } catch (e) { /* stockage indisponible : on continue en mémoire */ }

  // Dernier résultat connu par question, toutes sessions confondues : { id: { n: essais, ok: bool } }
  let stats = store.get(KEYS.stats) || {};
  function record(id, ok) { const p = stats[id] || { n: 0 }; stats[id] = { n: p.n + 1, ok: !!ok }; }
  const saveStats = () => store.set(KEYS.stats, stats);

  /* ---------------- Utilitaires ---------------- */
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const fmt = s => esc(s).replace(/`([^`]+)`/g, "<code>$1</code>");   // `texte` -> <code>
  const shuffle = arr => { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const sameSet = (a, b) => a.length === b.length && a.slice().sort().join() === b.slice().sort().join();
  const clock = ms => { const t = Math.max(0, Math.ceil(ms / 1000)); const h = Math.floor(t / 3600), m = Math.floor(t % 3600 / 60), s = t % 60; return h + ":" + String(m).padStart(2, "0") + ":" + String(s).padStart(2, "0"); };
  const pct = (n, d) => d ? Math.round(n / d * 100) : 0;
  const isCorrect = (q, answer) => sameSet(q.correct, answer || []);

  /* ---------------- État ---------------- */
  let view = "home";       // home | quiz | results
  let session = null;      // session en cours d'affichage
  let timerId = null, endTime = 0;
  let reviewFilter = "wrong";
  let preFilter = "all";   // filtre de l'écran de vérification avant envoi
  let slide = "";          // sens de l'animation de la prochaine question : "next" | "prev" | ""
  let celebrate = false;   // lance compteur + confettis au premier affichage des résultats
  const app = document.getElementById("app");
  const overlay = document.getElementById("overlay");

  /* ---------------- Création de session ---------------- */
  // Tirage de l'examen : réparti par domaine selon DOMAINS[*].weight (méthode du plus fort reste).
  function drawExam() {
    const size = Math.min(CONFIG.examSize, QUESTIONS.length);
    const ids = Object.keys(DOMAINS).map(Number);
    const pools = Object.fromEntries(ids.map(d => [d, shuffle(QUESTIONS.filter(q => q.domain === d))]));
    const totalW = ids.reduce((s, d) => s + DOMAINS[d].weight, 0);
    const quota = {}; let used = 0;
    const rests = ids.map(d => {
      const exact = size * DOMAINS[d].weight / totalW;
      quota[d] = Math.min(Math.floor(exact), pools[d].length); used += quota[d];
      return { d, r: exact - Math.floor(exact) };
    }).sort((a, b) => b.r - a.r);
    let guard = 0;
    while (used < size && guard++ < 500) {
      const { d } = rests[(guard - 1) % rests.length];
      if (quota[d] < pools[d].length) { quota[d]++; used++; }
    }
    return shuffle(ids.flatMap(d => pools[d].slice(0, quota[d])));
  }

  function newSession(mode, questions, domains) {
    const order = {};
    questions.forEach(q => { order[q.id] = shuffle(q.options.map((_, i) => i)); });
    return {
      mode, ids: questions.map(q => q.id), order,
      answers: {}, validated: {}, flags: {}, current: 0,
      remainingMs: mode === "exam" ? CONFIG.examMinutes * 60000 : null,
      domains: domains || null, finished: false, startedAt: Date.now()
    };
  }
  // Ignore une session sauvegardée dont des questions ont été retirées de la banque.
  function loadSession(mode) {
    const s = store.get(KEYS[mode]);
    if (!s || !Array.isArray(s.ids) || !s.ids.length || s.ids.some(id => !Q_BY_ID[id] || !s.order || !s.order[id] || s.order[id].length !== Q_BY_ID[id].options.length)) return null;
    return s;
  }
  function save() {
    if (!session) return;
    if (session.mode === "exam" && !session.finished && endTime) session.remainingMs = Math.max(0, endTime - Date.now());
    store.set(KEYS[session.mode], session);
  }

  /* ---------------- Chronomètre ---------------- */
  function startTimer() {
    stopTimer();
    if (!session || session.mode !== "exam" || session.finished) return;
    endTime = Date.now() + session.remainingMs;
    let ticks = 0;
    timerId = setInterval(() => {
      const left = endTime - Date.now();
      const el = document.getElementById("timer"), txt = document.getElementById("timer-txt");
      if (txt) txt.textContent = clock(left);
      if (el) el.classList.toggle("low", left < CONFIG.lowTimeMs);
      if (++ticks % 5 === 0) save();
      if (left <= 0) finish(true);
    }, 1000);
  }
  function stopTimer() { if (timerId) clearInterval(timerId); timerId = null; endTime = 0; }

  /* ---------------- Calcul des résultats ---------------- */
  function compute(s) {
    // En entraînement, seules les questions validées comptent.
    const ids = s.mode === "exam" ? s.ids : s.ids.filter(id => s.validated[id]);
    const byDomain = {};
    Object.keys(DOMAINS).forEach(d => byDomain[d] = { ok: 0, total: 0 });
    const items = ids.map(id => {
      const q = Q_BY_ID[id], a = s.answers[id] || [];
      const status = !a.length ? "empty" : isCorrect(q, a) ? "ok" : "ko";
      byDomain[q.domain].total++; if (status === "ok") byDomain[q.domain].ok++;
      return { id, q, a, status, flagged: !!s.flags[id] };
    });
    const ok = items.filter(i => i.status === "ok").length;
    return { items, ok, total: items.length, pct: pct(ok, items.length), byDomain };
  }

  function finish(timeUp) {
    if (!session || session.finished) return;
    if (session.mode === "exam" && endTime) session.remainingMs = Math.max(0, endTime - Date.now());
    stopTimer();
    session.finished = true; session.timeUp = !!timeUp; session.finishedAt = Date.now();
    store.set(KEYS[session.mode], session);
    if (session.mode === "exam") {
      const r = compute(session);
      r.items.forEach(i => record(i.id, i.status === "ok")); saveStats();
      const h = store.get(KEYS.history) || [];
      h.unshift({ date: session.finishedAt, ok: r.ok, total: r.total, pct: r.pct });
      store.set(KEYS.history, h.slice(0, 10));
    }
    closeDialog();
    reviewFilter = "wrong"; celebrate = true;
    go("results");
  }

  /* ---------------- Navigation entre vues ---------------- */
  function go(v) {
    view = v;
    if (v !== "quiz" && v !== "review") stopTimer();
    render();
    window.scrollTo(0, 0);
  }
  function render() {
    // En examen, l'interface passe en version dépouillée (classe .exam).
    app.className = session && session.mode === "exam" && (view === "quiz" || view === "review") ? "exam" : "";
    if (view === "quiz" && session) renderQuiz();
    else if (view === "review" && session) renderReview();
    else if (view === "results" && session) renderResults();
    else renderHome();
  }

  /* ======================= VUE : ACCUEIL ======================= */
  function renderHome() {
    const exam = loadSession("exam"), prac = loadSession("practice");
    const history = store.get(KEYS.history) || [];
    const dkeys = Object.keys(DOMAINS);
    const counts = dkeys.map(d => QUESTIONS.filter(q => q.domain == d).length);
    const mast = dkeys.map(d => QUESTIONS.filter(q => q.domain == d && stats[q.id] && stats[q.id].ok).length);
    const errs = QUESTIONS.filter(q => stats[q.id] && !stats[q.id].ok);
    const multi = QUESTIONS.filter(q => q.correct.length > 1).length;
    const examSize = Math.min(CONFIG.examSize, QUESTIONS.length);
    const examLive = exam && !exam.finished, pracLive = prac && !prac.finished;

    const examBlock = examLive
      ? `<div class="note"><p class="small"><strong>Examen en cours</strong> : ${Object.keys(exam.answers).filter(k => exam.answers[k].length).length} réponse(s) sur ${exam.ids.length}, <span class="num">${clock(exam.remainingMs)}</span> restantes.</p>
         <div class="row"><button class="btn btn-primary" data-action="resume" data-mode="exam">Reprendre ${IC.next}</button>
         <button class="btn" data-action="ask-new-exam">Nouvel examen</button></div></div>`
      : `<div class="row"><button class="btn btn-primary" data-action="new-exam">Démarrer l'examen ${IC.next}</button>
         ${exam && exam.finished ? `<button class="btn" data-action="show-results" data-mode="exam">Dernier résultat</button>` : ""}</div>`;

    app.innerHTML = `
    <div class="strip"></div>
    <main class="wrap stagger">
      <header class="hero" id="hero">
        <div class="hero-text">
          <span class="badge-top"><i></i>Entraînement non officiel</span>
          <h1>Prépare ton Associate Cloud Engineer</h1>
          <p class="muted">${QUESTIONS.length} questions sur les 5 domaines de l'examen Google Cloud, dont ${multi} à réponses multiples. Ta progression reste enregistrée dans ce navigateur.</p>
          <div class="row">
            <button class="btn btn-primary" data-action="${examLive ? "resume" : "new-exam"}" data-mode="exam">${examLive ? "Reprendre l'examen" : "Lancer un examen blanc"} ${IC.next}</button>
          </div>
        </div>
        <div class="art" aria-hidden="true"><span class="shape s1"></span><span class="shape s2"></span><span class="shape s3"></span><span class="shape s4"></span><span class="shape s5"></span></div>
      </header>

      <div class="modes">
        <section class="card mode" aria-labelledby="h-exam">
          <span class="mode-ic">${IC.clock}</span>
          <h2 id="h-exam">Examen blanc</h2>
          <div class="facts"><span class="fact"><b>${examSize}</b> questions</span><span class="fact"><b>${CONFIG.examMinutes / 60} h</b> chrono</span><span class="fact">seuil <b>${CONFIG.passPct} %</b></span></div>
          <p class="small muted">Interface dépouillée comme le jour J : pas d'indication de domaine, aucune correction avant la fin, écran de vérification avant l'envoi.</p>
          ${examBlock}
        </section>

        <section class="card mode" aria-labelledby="h-prac">
          <span class="mode-ic green">${IC.target}</span>
          <h2 id="h-prac">Entraînement libre</h2>
          <p class="small muted">Correction et explication après chaque réponse. Choisis les domaines à travailler.</p>
          <div class="chips" id="domain-chips">
            ${dkeys.map((d, i) => `<label class="chip d${d}"><input type="checkbox" id="dom-${d}" value="${d}" checked><span>${esc(DOMAINS[d].short)} <span class="num">${counts[i]}</span></span></label>`).join("")}
          </div>
          <div class="row"><button class="btn btn-primary" data-action="new-practice" id="btn-practice">Commencer</button>
          ${pracLive ? `<button class="btn" data-action="resume" data-mode="practice">Reprendre (${Object.keys(prac.validated).length}/${prac.ids.length})</button>` : ""}
          ${errs.length ? `<button class="btn" data-action="new-errors">Revoir mes erreurs (${errs.length})</button>` : ""}</div>
        </section>
      </div>

      <section class="card" aria-labelledby="h-dom">
        <div class="row spread"><h2 id="h-dom">Ta maîtrise par domaine</h2><span class="small muted">Questions réussies à ta dernière tentative</span></div>
        <ul class="dlist">
          ${dkeys.map((d, i) => `<li class="drow d${d}"><span class="dnum">${d}</span><span>${esc(DOMAINS[d].name)}</span>
            <span class="num small muted">${mast[i]}/${counts[i]}</span>
            <span class="wbar"><i style="width:${pct(mast[i], counts[i])}%"></i></span></li>`).join("")}
        </ul>
      </section>

      ${history.length ? `<section class="card" aria-labelledby="h-hist">
        <h2 id="h-hist">Derniers examens blancs</h2>
        <div style="overflow-x:auto"><table>
          <thead><tr><th>Date</th><th class="r">Score</th><th class="r">Réussite</th><th>Résultat</th></tr></thead>
          <tbody>${history.map(h => `<tr><td>${new Date(h.date).toLocaleDateString("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</td><td class="r num">${h.ok}/${h.total}</td><td class="r num">${h.pct} %</td><td><span class="pill ${h.pct >= CONFIG.passPct ? "ok" : "ko"}">${h.pct >= CONFIG.passPct ? "Au-dessus du seuil" : "Sous le seuil"}</span></td></tr>`).join("")}</tbody>
        </table></div>
      </section>` : ""}

      <p class="small muted">Outil d'entraînement personnel, sans lien avec Google. Questions originales, non issues de l'examen officiel. Le seuil de ${CONFIG.passPct} % est indicatif : Google ne publie pas la note de passage.</p>
    </main>`;
    updatePracticeCount();
  }
  function selectedDomains() { return Array.from(document.querySelectorAll("#domain-chips input:checked")).map(i => Number(i.value)); }
  function updatePracticeCount() {
    const btn = document.getElementById("btn-practice"); if (!btn) return;
    const doms = selectedDomains();
    const n = QUESTIONS.filter(q => doms.includes(q.domain)).length;
    btn.textContent = n ? `Commencer (${n} questions)` : "Choisis au moins un domaine";
    btn.disabled = !n;
  }

  /* ======================= VUE : QUESTIONS ======================= */
  function counters() {
    const s = session;
    const done = s.mode === "exam"
      ? s.ids.filter(id => (s.answers[id] || []).length).length
      : s.ids.filter(id => s.validated[id]).length;
    return { done, left: s.ids.length - done, flagged: s.ids.filter(id => s.flags[id]).length };
  }
  // Le bandeau est construit une fois ; ensuite seules ses valeurs changent (la barre s'anime).
  function topbarHTML() {
    const s = session;
    return `
      <div class="row spread topline">
        <strong class="ttl">${s.mode === "exam" ? "Examen blanc" : "Entraînement"}</strong>
        ${s.mode === "exam" ? `<span class="timer ${s.remainingMs < CONFIG.lowTimeMs ? "low" : ""}" id="timer" aria-label="Temps restant">${IC.clock}<span id="timer-txt">${clock(endTime ? endTime - Date.now() : s.remainingMs)}</span></span>` : ""}
        <span class="row tools">
          <button class="btn btn-ghost" data-action="quit">Quitter</button>
          <button class="btn" data-action="ask-finish">${s.mode === "exam" ? `Vérifier<span class="hide-sm"> et terminer</span>` : "Terminer"}</button>
        </span>
      </div>
      <div class="bar" id="pbar" role="progressbar" aria-valuemin="0" aria-valuemax="${s.ids.length}" aria-label="Progression"><i id="pfill"></i></div>
      <div class="row spread small muted">
        <span>Question <span class="num" id="pcur"></span> sur <span class="num">${s.ids.length}</span></span>
        <span id="pleft"></span>
      </div>`;
  }
  function navHTML() {
    const s = session;
    return s.ids.map((id, i) => {
      const cls = [];
      if (s.mode === "practice" && s.validated[id]) cls.push(isCorrect(Q_BY_ID[id], s.answers[id]) ? "ok" : "ko");
      else if ((s.answers[id] || []).length) cls.push("answered");
      if (s.flags[id]) cls.push("flagged");
      if (i === s.current) cls.push("current");
      return `<button class="${cls.join(" ")}" data-action="goto" data-i="${i}" aria-label="Question ${i + 1}${s.flags[id] ? ", à revoir" : ""}"${i === s.current ? ' aria-current="true"' : ""}>${i + 1}</button>`;
    }).join("");
  }
  // Entraînement : score courant et série de bonnes réponses consécutives.
  function streakInfo() {
    const s = session, log = s.log || [];
    const good = id => isCorrect(Q_BY_ID[id], s.answers[id]);
    let streak = 0; for (let i = log.length - 1; i >= 0 && good(log[i]); i--) streak++;
    return { done: log.length, ok: log.filter(good).length, streak };
  }
  function refreshChrome() {     // met à jour bandeau + grille sans toucher à la question (garde le focus)
    const s = session, c = counters(), $ = id => document.getElementById(id);
    if ($("pfill")) {
      $("pfill").style.width = pct(c.done, s.ids.length) + "%";
      $("pbar").setAttribute("aria-valuenow", c.done);
      $("pcur").textContent = s.current + 1;
      const base = `<span class="num">${c.left}</span> restante${c.left > 1 ? "s" : ""}${c.flagged ? ` · <span class="num">${c.flagged}</span> à revoir` : ""}`;
      const st = s.mode === "practice" ? streakInfo() : null;
      $("pleft").innerHTML = st && st.done
        ? `<span class="num">${st.ok}/${st.done}</span> justes${st.streak >= 2 ? ` · série de <span class="num">${st.streak}</span>` : ""} · ${base}` : base;
    }
    if ($("nav-grid")) $("nav-grid").innerHTML = navHTML();
  }

  function renderQuiz() {
    const s = session, id = s.ids[s.current], q = Q_BY_ID[id];
    const multi = q.correct.length > 1;
    const sel = s.answers[id] || [];
    const locked = s.mode === "practice" && !!s.validated[id];
    const last = s.current === s.ids.length - 1;
    const good = locked && isCorrect(q, sel);

    const options = s.order[id].map((orig, pos) => {
      const chosen = sel.includes(orig), right = q.correct.includes(orig);
      let cls = "opt" + (multi ? " sq" : ""), verdict = "", mark = LETTERS[pos];
      if (locked) {
        cls += " locked";
        if (right) { cls += " is-correct"; mark = IC.check; verdict = `<span class="verdict">${chosen ? "Bonne réponse, tu l'as choisie" : "Bonne réponse"}</span>`; }
        else if (chosen) { cls += " is-wrong"; mark = IC.cross; verdict = `<span class="verdict">Ton choix, incorrect</span>`; }
      }
      return `<label class="${cls}">
        <input class="sr" type="${multi ? "checkbox" : "radio"}" name="opt" id="opt-${pos}" value="${orig}" aria-label="Option ${LETTERS[pos]}" ${chosen ? "checked" : ""} ${locked ? "disabled" : ""}>
        <span class="letter">${mark}</span>
        <span>${fmt(q.options[orig])}${verdict}</span>
      </label>`;
    }).join("");

    // Le squelette (bandeau + grille) n'est créé qu'une fois par session affichée.
    if (!document.getElementById("qslot")) {
      app.innerHTML = `
      <div class="topbar"><div class="strip"></div><div class="topbar-in">${topbarHTML()}</div></div>
      <main class="wrap">
        <div id="qslot"></div>
        <details class="card"${window.matchMedia("(max-width: 640px)").matches ? "" : " open"}>
          <summary>Toutes les questions</summary>
          <div class="nav-grid" id="nav-grid"></div>
          <div class="legend">
            ${s.mode === "exam"
              ? `<span><i style="background:var(--accent-soft)"></i>Répondue</span>`
              : `<span><i style="background:var(--good-soft)"></i>Juste</span><span><i style="background:var(--bad-soft)"></i>Fausse</span>`}
            <span><i style="background:var(--accent)"></i>En cours</span>
            <span><i style="background:var(--g-yellow)"></i>À revoir</span>
          </div>
        </details>
      </main>`;
    }

    document.getElementById("qslot").innerHTML = `
      <article class="card qcard ${slide ? "enter-" + slide : ""}">
        <div class="row">
          ${s.mode === "exam" ? "" : `<span class="tag dtag d${q.domain}">Domaine ${q.domain} · ${esc(DOMAINS[q.domain].short)}</span>`}
          ${multi ? `<span class="tag multi">Choisis ${q.correct.length} réponses</span>` : `<span class="tag">Une seule réponse</span>`}
        </div>
        <p class="qtext" id="qtext">${fmt(q.q)}</p>
        <fieldset class="options" aria-labelledby="qtext">${options}</fieldset>
        ${locked ? `<div class="feedback ${good ? "ok" : "ko"}" role="status">
            <strong>${good ? IC.check + "Correct" + (streakInfo().streak >= 3 ? " · " + streakInfo().streak + " d'affilée" : "") : IC.cross + "Pas tout à fait"}</strong>
            <p>${fmt(q.explain)}</p></div>` : ""}
        <div class="row spread actions sticky-bar">
          <button class="btn btn-ghost" data-action="prev" aria-label="Question précédente" ${s.current === 0 ? "disabled" : ""}>${IC.prev}<span class="hide-sm">Précédente</span></button>
          <button class="btn btn-flag" data-action="flag" aria-pressed="${!!s.flags[id]}">${IC.flag}<span>${s.flags[id] ? "Marquée" : "À revoir"}</span></button>
          ${s.mode === "practice" && !locked
            ? `<button class="btn btn-primary" data-action="validate" id="btn-validate" ${sel.length ? "" : "disabled"}>Valider ${IC.check}</button>`
            : last
              ? `<button class="btn btn-primary" data-action="ask-finish">Terminer ${IC.check}</button>`
              : `<button class="btn btn-primary" data-action="next">Suivante ${IC.next}</button>`}
        </div>
        <p class="small muted kbd-hint">Clavier : A à E pour répondre, Entrée pour ${s.mode === "practice" && !locked ? "valider" : "continuer"}, flèches pour naviguer.</p>
      </article>`;
    slide = "";
    refreshChrome();
  }

  /* ============ VUE : VÉRIFICATION AVANT ENVOI (examen uniquement) ============ */
  function renderReview() {
    const s = session, c = counters();
    const rows = s.ids.map((id, i) => ({ i, answered: (s.answers[id] || []).length > 0, flagged: !!s.flags[id] }));
    const list = preFilter === "empty" ? rows.filter(r => !r.answered) : preFilter === "flagged" ? rows.filter(r => r.flagged) : rows;
    app.innerHTML = `
    <div class="topbar"><div class="topbar-in"><div class="row spread">
      <strong>Vérification avant envoi</strong>
      <span class="timer ${s.remainingMs < CONFIG.lowTimeMs ? "low" : ""}" id="timer" aria-label="Temps restant">${IC.clock}<span id="timer-txt">${clock(endTime ? endTime - Date.now() : s.remainingMs)}</span></span>
    </div></div></div>
    <main class="wrap">
      <section class="card">
        <div class="facts"><span class="fact"><b>${c.done}</b> répondues</span><span class="fact${c.left ? " warn" : ""}"><b>${c.left}</b> sans réponse</span><span class="fact"><b>${c.flagged}</b> marquées</span></div>
        <p class="small muted">Clique sur une question pour y revenir. Une fois l'examen soumis, les réponses ne sont plus modifiables.</p>
        <div class="chips" role="group" aria-label="Filtrer les questions">
          ${[["all", "Toutes"], ["empty", "Sans réponse"], ["flagged", "Marquées"]].map(([k, l]) =>
            `<label class="chip"><input type="radio" name="pf" id="pf-${k}" value="${k}" ${preFilter === k ? "checked" : ""}><span>${l}</span></label>`).join("")}
        </div>
        <div class="legend" aria-hidden="true">
          <span><i style="background:var(--accent-soft)"></i>Répondue</span>
          <span><i class="dash"></i>Sans réponse</span>
          <span><i style="background:var(--g-yellow)"></i>Marquée</span>
        </div>
        ${list.length ? `<ul class="plist">${list.map(r => `<li><button class="${r.answered ? "answered" : "empty"}${r.flagged ? " flagged" : ""}" data-action="goto" data-i="${r.i}" aria-label="Question ${r.i + 1}, ${r.answered ? "répondue" : "sans réponse"}${r.flagged ? ", marquée" : ""}"><span class="num">${r.i + 1}</span>${r.flagged ? IC.flag : ""}</button></li>`).join("")}</ul>`
          : `<p class="muted">Aucune question dans ce filtre.</p>`}
        <div class="row spread sticky-bar">
          <button class="btn" data-action="back-quiz">${IC.prev} Revenir<span class="hide-sm"> aux questions</span></button>
          <button class="btn btn-primary" data-action="ask-submit">Soumettre l'examen</button>
        </div>
      </section>
    </main>`;
  }

  /* ======================= VUE : RÉSULTATS ======================= */
  function renderResults() {
    const s = session, r = compute(s);
    const passed = r.pct >= CONFIG.passPct;
    const usedMs = s.mode === "exam" ? CONFIG.examMinutes * 60000 - (s.remainingMs || 0) : 0;
    const empty = r.items.filter(i => i.status === "empty").length;
    const wrong = r.items.filter(i => i.status !== "ok");
    const flagged = r.items.filter(i => i.flagged);
    const list = reviewFilter === "wrong" ? wrong : reviewFilter === "flagged" ? flagged : r.items;
    const CIRC = 2 * Math.PI * 52;

    // Domaine le plus faible (parmi ceux qui ont des questions)
    const doms = Object.keys(DOMAINS).filter(d => r.byDomain[d].total);
    const weakest = doms.slice().sort((a, b) => pct(r.byDomain[a].ok, r.byDomain[a].total) - pct(r.byDomain[b].ok, r.byDomain[b].total))[0];
    const weakPct = weakest ? pct(r.byDomain[weakest].ok, r.byDomain[weakest].total) : 100;

    const reviewHTML = list.map(it => {
      const q = it.q, n = s.ids.indexOf(it.id) + 1;
      const opts = s.order[it.id].map(orig => {
        const chosen = it.a.includes(orig), right = q.correct.includes(orig);
        const cls = right ? "is-correct" : chosen ? "is-wrong" : "";
        const note = right ? (chosen ? "Bonne réponse, choisie" : "Bonne réponse") : chosen ? "Ton choix, incorrect" : "";
        return `<li class="${cls}">${note ? `<small>${note}</small>` : ""}${fmt(q.options[orig])}</li>`;
      }).join("");
      const st = it.status === "ok" ? ["ok", "Juste"] : it.status === "ko" ? ["ko", "Fausse"] : ["ko", "Sans réponse"];
      return `<details class="review-item">
        <summary><span class="num muted">${n}.</span><span style="flex:1">${fmt(q.q.length > 150 ? q.q.slice(0, 150) + "…" : q.q)}</span><span class="st ${st[0]}">${st[1]}${it.flagged ? " · à revoir" : ""}</span></summary>
        <div class="review-body">
          <span class="tag dtag d${q.domain}" style="align-self:flex-start">Domaine ${q.domain} · ${esc(DOMAINS[q.domain].short)}</span>
          <p>${fmt(q.q)}</p>
          <ul>${opts}</ul>
          <div class="feedback ${it.status === "ok" ? "ok" : "ko"}"><strong>Explication</strong><p>${fmt(q.explain)}</p></div>
        </div>
      </details>`;
    }).join("");

    app.innerHTML = `
    <div class="strip"></div>
    <main class="wrap ${celebrate ? "stagger" : ""}">
      <header style="display:flex;flex-direction:column;gap:8px;align-items:flex-start">
        <span class="tag">${s.mode === "exam" ? "Examen blanc" : "Entraînement libre"} · résultats</span>
        <h1>${s.timeUp ? "Temps écoulé" : passed ? "Bien joué" : "Session terminée"}</h1>
      </header>

      <section class="card" aria-label="Score global">
        <div class="score">
          <div class="ringbox">
            <svg viewBox="0 0 120 120" aria-hidden="true">
              <circle class="ring-bg" cx="60" cy="60" r="52"/>
              <circle class="ring-fg ${passed ? "ok" : "ko"}" cx="60" cy="60" r="52" stroke-dasharray="${CIRC}" stroke-dashoffset="${CIRC * (1 - r.pct / 100)}" style="--c:${CIRC}"/>
            </svg>
            <span class="big" id="big-pct">${r.pct} %</span>
          </div>
          <div class="score-side">
            <span class="pill ${passed ? "ok" : "ko"}">${passed ? IC.check + "Au-dessus du seuil" : IC.cross + "Sous le seuil"} de ${CONFIG.passPct} %</span>
            <span style="font:500 1.3rem var(--font-display)"><span class="num">${r.ok} / ${r.total}</span> bonnes réponses</span>
            <div class="facts">
              ${s.mode === "exam" ? `<span class="fact">Temps utilisé <b>${clock(usedMs)}</b></span>` : ""}
              ${empty ? `<span class="fact"><b>${empty}</b> sans réponse</span>` : ""}
              <span class="fact"><b>${flagged.length}</b> à revoir</span>
            </div>
          </div>
        </div>
      </section>

      <section class="card" aria-labelledby="h-bydom">
        <div class="row spread"><h2 id="h-bydom">Performance par domaine</h2><span class="small muted">Trait vertical : seuil de ${CONFIG.passPct} %</span></div>
        ${doms.map(d => { const b = r.byDomain[d], p = pct(b.ok, b.total); return `
          <div class="dom d${d}">
            <span class="dnum">${d}</span>
            <span>${esc(DOMAINS[d].name)}${d === weakest && p < CONFIG.passPct ? ` <span class="pill ko" style="font-size:.75rem;padding:2px 10px">Point faible</span>` : ""}</span>
            <span class="num res">${b.ok}/${b.total} · ${p} %</span>
            <div class="bar"><i class="${p >= CONFIG.passPct ? "ok" : "ko"}" style="width:${p}%"></i></div>
          </div>`; }).join("")}
        ${weakest && weakPct < CONFIG.passPct
          ? `<div class="row"><button class="btn" data-action="train-domain" data-domain="${weakest}">${IC.target} S'entraîner sur le domaine ${weakest}</button></div>` : ""}
      </section>

      <section class="card" aria-labelledby="h-review">
        <h2 id="h-review">Correction</h2>
        <div class="chips" role="group" aria-label="Filtrer la correction">
          ${[["wrong", `Ratées (${wrong.length})`], ["flagged", `Marquées (${flagged.length})`], ["all", `Toutes (${r.items.length})`]].map(([k, l]) =>
            `<label class="chip"><input type="radio" name="rf" id="rf-${k}" value="${k}" ${reviewFilter === k ? "checked" : ""}><span>${l}</span></label>`).join("")}
        </div>
        ${list.length ? reviewHTML : `<p class="muted">${reviewFilter === "wrong" ? "Aucune erreur sur cette session." : "Aucune question dans ce filtre."}</p>`}
      </section>

      <div class="row">
        <button class="btn btn-primary" data-action="${s.mode === "exam" ? "new-exam" : "home"}">${s.mode === "exam" ? "Nouvel examen blanc" : "Nouvelle session"} ${IC.next}</button>
        <button class="btn" data-action="home">Retour à l'accueil</button>
      </div>
    </main>`;

    if (celebrate) {
      celebrate = false;
      countUp(document.getElementById("big-pct"), r.pct, " %");
      if (passed && r.total >= 5) confetti();
    }
  }

  /* ---------------- Effets : compteur, confettis, onde au clic, parallaxe ---------------- */
  function countUp(el, to, suffix) {
    if (!el || REDUCED) return;
    const t0 = performance.now();
    (function frame(t) {
      const k = Math.min(1, (t - t0) / 700);
      el.textContent = Math.round(to * (1 - Math.pow(1 - k, 3))) + suffix;
      if (k < 1) requestAnimationFrame(frame);
    })(t0);
  }
  function confetti() {
    if (REDUCED) return;
    const c = document.createElement("canvas"); c.className = "confetti"; document.body.appendChild(c);
    const ctx = c.getContext("2d"), W = c.width = window.innerWidth, H = c.height = window.innerHeight;
    const cols = ["#4285f4", "#ea4335", "#fbbc04", "#34a853"];
    const P = Array.from({ length: 60 }, (_, i) => ({
      x: W / 2 + (Math.random() - .5) * W * .3, y: H * .4,
      vx: (Math.random() - .5) * 10, vy: -Math.random() * 10 - 3,
      s: 6 + Math.random() * 7, r: Math.random() * 6, vr: (Math.random() - .5) * .4,
      c: cols[i % 4], round: Math.random() < .4
    }));
    const t0 = performance.now(), LIFE = 2200;
    (function frame(t) {
      const el = t - t0;
      ctx.clearRect(0, 0, W, H);
      P.forEach(p => {
        p.vy += .32; p.vx *= .99; p.x += p.vx; p.y += p.vy; p.r += p.vr;
        ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.r);
        ctx.globalAlpha = Math.max(0, Math.min(1, (LIFE - el) / 800)); ctx.fillStyle = p.c;
        if (p.round) { ctx.beginPath(); ctx.arc(0, 0, p.s / 2, 0, 7); ctx.fill(); } else ctx.fillRect(-p.s / 2, -p.s / 3, p.s, p.s * .66);
        ctx.restore();
      });
      if (el < LIFE) requestAnimationFrame(frame); else c.remove();
    })(t0);
  }
  document.addEventListener("pointerdown", e => {          // onde Material au point de contact
    if (REDUCED) return;
    const el = e.target.closest(".btn, .opt:not(.locked), .nav-grid button, .chip span");
    if (!el || el.disabled) return;
    const r = el.getBoundingClientRect(), d = Math.max(r.width, r.height) * 2.2;
    const s = document.createElement("span"); s.className = "ripple";
    s.style.cssText = `width:${d}px;height:${d}px;left:${e.clientX - r.left - d / 2}px;top:${e.clientY - r.top - d / 2}px`;
    el.appendChild(s); s.addEventListener("animationend", () => s.remove());
  });
  document.addEventListener("pointermove", e => {          // les formes de l'accueil suivent le pointeur
    const hero = document.getElementById("hero"); if (!hero || REDUCED) return;
    const r = hero.getBoundingClientRect();
    hero.style.setProperty("--px", ((e.clientX - r.left) / r.width - .5).toFixed(3));
    hero.style.setProperty("--py", ((e.clientY - r.top) / r.height - .5).toFixed(3));
  });

  /* ---------------- Boîte de dialogue intégrée (confirm() est bloqué dans la page) ---------------- */
  let lastFocus = null;
  function openDialog(title, body, confirmLabel, action) {
    lastFocus = document.activeElement;
    overlay.innerHTML = `<div class="dialog" role="dialog" aria-modal="true" aria-labelledby="dlg-title">
      <h2 id="dlg-title">${title}</h2><p class="muted">${body}</p>
      <div class="row" style="justify-content:flex-end">
        <button class="btn btn-ghost" data-action="close-dialog">Annuler</button>
        <button class="btn btn-primary" data-action="${action}" id="dlg-ok">${confirmLabel}</button>
      </div></div>`;
    overlay.hidden = false;
    document.getElementById("dlg-ok").focus();
  }
  function closeDialog() { overlay.hidden = true; overlay.innerHTML = ""; if (lastFocus && document.contains(lastFocus)) lastFocus.focus(); lastFocus = null; }

  /* ---------------- Actions ---------------- */
  function startExam() {
    closeDialog();
    session = newSession("exam", drawExam());
    store.set(KEYS.exam, session);
    go("quiz"); startTimer();
  }
  function startPractice(domains) {
    const qs = shuffle(QUESTIONS.filter(q => domains.includes(q.domain)));
    if (!qs.length) return;
    session = newSession("practice", qs, domains);
    store.set(KEYS.practice, session);
    go("quiz");
  }
  function move(i) {
    const to = Math.max(0, Math.min(session.ids.length - 1, i));
    slide = to > session.current ? "next" : to < session.current ? "prev" : "";
    session.current = to;
    view = "quiz"; save(); render(); window.scrollTo(0, 0);
  }

  const actions = {
    "new-exam": startExam,
    "ask-new-exam": () => openDialog("Abandonner l'examen en cours ?", "Tes réponses actuelles seront effacées et un nouveau tirage de questions commencera.", "Nouvel examen", "new-exam"),
    "new-practice": () => startPractice(selectedDomains()),
    "new-errors": () => {                                    // rejoue les questions ratées à la dernière tentative
      const qs = shuffle(QUESTIONS.filter(q => stats[q.id] && !stats[q.id].ok));
      if (!qs.length) return;
      session = newSession("practice", qs); store.set(KEYS.practice, session); go("quiz");
    },
    "train-domain": el => startPractice([Number(el.dataset.domain)]),
    "resume": el => { session = loadSession(el.dataset.mode); if (!session || session.finished) { session = null; return renderHome(); } go("quiz"); startTimer(); },
    "show-results": el => { session = loadSession(el.dataset.mode); if (session) { reviewFilter = "wrong"; go("results"); } },
    "home": () => { session = null; go("home"); },
    "quit": () => { save(); session = null; go("home"); },   // la session reste enregistrée pour être reprise
    "prev": () => move(session.current - 1),
    "next": () => move(session.current + 1),
    "goto": el => move(Number(el.dataset.i)),
    "flag": el => {
      const id = session.ids[session.current];
      if (session.flags[id]) delete session.flags[id]; else session.flags[id] = true;
      save();
      el.setAttribute("aria-pressed", String(!!session.flags[id]));
      el.querySelector("span").textContent = session.flags[id] ? "Marquée" : "À revoir";
      refreshChrome();
    },
    "validate": () => {
      const id = session.ids[session.current];
      if (!(session.answers[id] || []).length) return;
      session.validated[id] = true; (session.log = session.log || []).push(id);
      record(id, isCorrect(Q_BY_ID[id], session.answers[id])); saveStats();
      save(); renderQuiz();
    },
    "ask-finish": () => {
      if (session.mode === "exam") { preFilter = "all"; return go("review"); }
      const c = counters();
      if (session.mode === "practice" && !Object.keys(session.validated).length) { store.del(KEYS.practice); session = null; return go("home"); }
      const body = session.mode === "exam"
        ? (c.left ? `Il reste <strong>${c.left}</strong> question${c.left > 1 ? "s" : ""} sans réponse` : "Tu as répondu à toutes les questions") +
          (c.flagged ? ` et <strong>${c.flagged}</strong> marquée${c.flagged > 1 ? "s" : ""} à revoir` : "") + ". Tu ne pourras plus modifier tes réponses."
        : `Les résultats porteront sur les <strong>${c.done}</strong> question${c.done > 1 ? "s" : ""} validée${c.done > 1 ? "s" : ""}.`;
      openDialog(session.mode === "exam" ? "Terminer l'examen ?" : "Terminer la session ?", body, "Voir les résultats", "finish");
    },
    "back-quiz": () => go("quiz"),
    "ask-submit": () => {
      const c = counters();
      openDialog("Soumettre l'examen ?", (c.left ? `Il reste <strong>${c.left}</strong> question${c.left > 1 ? "s" : ""} sans réponse. ` : "") + "Tu ne pourras plus modifier tes réponses.", "Soumettre", "finish");
    },
    "finish": () => finish(false),
    "close-dialog": closeDialog
  };

  document.addEventListener("click", e => {
    const el = e.target.closest("[data-action]");
    if (el && !el.disabled && actions[el.dataset.action]) actions[el.dataset.action](el);
    else if (e.target === overlay) closeDialog();
  });
  document.addEventListener("keydown", e => { if (e.key === "Escape" && !overlay.hidden) closeDialog(); });

  // Raccourcis clavier pendant les questions : A-E ou 1-5, Entrée, flèches.
  document.addEventListener("keydown", e => {
    if (view !== "quiz" || !session || !overlay.hidden || e.ctrlKey || e.metaKey || e.altKey) return;
    const tag = e.target.tagName, k = e.key.toLowerCase();
    if (k.length === 1) {
      const pos = "abcde".indexOf(k) >= 0 ? "abcde".indexOf(k) : "12345".indexOf(k);
      const input = document.querySelectorAll('input[name="opt"]')[pos];
      if (pos >= 0 && input && !input.disabled) { input.click(); e.preventDefault(); }
    } else if (k === "enter" && tag !== "BUTTON" && tag !== "SUMMARY") {
      const b = document.querySelector('#qslot [data-action="validate"]:not(:disabled), #qslot [data-action="next"]');
      if (b) { b.click(); e.preventDefault(); }
    } else if (tag !== "INPUT" && k === "arrowright") actions.next();
    else if (tag !== "INPUT" && k === "arrowleft") actions.prev();
  });

  document.addEventListener("change", e => {
    const t = e.target;
    if (t.name === "opt" && session && view === "quiz") {            // sélection d'une réponse
      const id = session.ids[session.current];
      session.answers[id] = Array.from(document.querySelectorAll('input[name="opt"]:checked')).map(i => Number(i.value));
      save(); refreshChrome();
      const v = document.getElementById("btn-validate"); if (v) v.disabled = !session.answers[id].length;
    } else if (t.closest && t.closest("#domain-chips")) updatePracticeCount();   // filtre par domaine
    else if (t.name === "pf") { preFilter = t.value; renderReview(); }           // filtre de vérification
    else if (t.name === "rf") { reviewFilter = t.value; renderResults(); }      // filtre de correction
  });

  // Sauvegarde du temps restant quand l'onglet est quitté ou masqué.
  window.addEventListener("pagehide", save);
  document.addEventListener("visibilitychange", () => { if (document.hidden) save(); });

  render();
})();
