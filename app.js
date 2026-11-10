(function () {
  "use strict";

  /* ---------------- Réglages ---------------- */
  const CONFIG = {
    examSize: 50,          // nombre de questions de l'examen blanc
    examMinutes: 120,      // durée du chronomètre
    passPct: 70,           // seuil de réussite indicatif
    lowTimeMs: 10 * 60000  // le chrono passe en rouge sous ce délai
  };
  const KEYS = { exam: "ace.session.exam", practice: "ace.session.practice", history: "ace.history", stats: "ace.stats", activity: "ace.activity", profile: "ace.profile", version: "ace.version" };
  const HISTORY_MAX = 20;    // nombre d'examens blancs conservés dans l'historique
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
    prev: svg('<path d="M19 12H5M11 6l-6 6 6 6"/>'),
    cloud: svg('<path d="M7 18a4 4 0 0 1-.5-7.97A6 6 0 0 1 18 8.5 3.5 3.5 0 0 1 17.5 18Z"/>'),
    cal: svg('<rect x="3" y="5" width="18" height="16" rx="3"/><path d="M3 10h18M8 3v4M16 3v4"/>'),
    fire: svg('<path d="M12 21c-4 0-6.5-2.7-6.5-6.2 0-2.6 1.6-4.4 2.8-5.8.3 1.3 1 2.1 1.9 2.4C10.3 8.8 11 5.5 14 3c0 3 1.4 4.3 2.6 5.8 1.3 1.6 1.9 3 1.9 5 0 4-2.6 7.2-6.5 7.2z"/>'),
    edit: svg('<path d="M4 20h4l10.5-10.5a2.1 2.1 0 0 0-3-3L5 17v3zM13.5 6.5l3 3"/>'),
    download: svg('<path d="M12 4v11M7 10l5 5 5-5M5 20h14"/>'),
    upload: svg('<path d="M12 15V4M7 9l5-5 5 5M5 20h14"/>')
  };

  /* ---------------- Stockage local (peut être indisponible) ---------------- */
  const store = {
    get(key) { try { return JSON.parse(localStorage.getItem(key)); } catch (e) { return null; } },
    set(key, value) { try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) { /* on continue en mémoire */ } },
    del(key) { try { localStorage.removeItem(key); } catch (e) {} }
  };

  try {
    if (store.get(KEYS.version) !== STORAGE_VERSION) {
      ["exam", "practice", "history", "stats", "activity"].forEach(k => store.del(KEYS[k]));
      store.set(KEYS.version, STORAGE_VERSION);
    }
  } catch (e) { /* stockage indisponible : on continue en mémoire */ }

  // Dernier résultat connu par question, toutes sessions confondues : { id: { n: essais, ok: bool } }
  let stats = store.get(KEYS.stats) || {};
  // Activité par jour : { "AAAA-MM-JJ": { n: réponses validées, ok: bonnes réponses } }
  let activity = store.get(KEYS.activity) || {};
  const dayKey = d => { d = d || new Date(); return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); };
  function record(id, ok) {
    const p = stats[id] || { n: 0 }; stats[id] = { n: p.n + 1, ok: !!ok };
    const k = dayKey(), a = activity[k] || { n: 0, ok: 0 }; a.n++; if (ok) a.ok++; activity[k] = a;
  }
  const saveStats = () => { store.set(KEYS.stats, stats); store.set(KEYS.activity, activity); };

  /* ---------------- Profil : identité, objectifs et préférences ---------------- */
  const DEFAULT_PROFILE = { name: "", color: 1, target: 80, examDate: "", daily: 10, theme: "auto" };
  const AVATAR_COLORS = [1, 2, 3, 4, 5];                       // réutilise les couleurs des domaines (.d1 à .d5)
  const THEMES = { auto: "Système", light: "Clair", dark: "Sombre" };
  const clamp = (n, lo, hi) => Math.min(hi, Math.max(lo, n));
  const num = (v, def, lo, hi) => { const n = Number(v); return v === "" || v == null || !Number.isFinite(n) ? def : clamp(Math.round(n), lo, hi); };
  // Ne conserve que des valeurs valides : utilisé au chargement, à la saisie et à l'import.
  function sanitizeProfile(p) {
    p = p && typeof p === "object" ? p : {};
    return {
      name: String(p.name || "").trim().slice(0, 30),
      color: AVATAR_COLORS.includes(Number(p.color)) ? Number(p.color) : DEFAULT_PROFILE.color,
      target: num(p.target, DEFAULT_PROFILE.target, 50, 100),
      examDate: /^\d{4}-\d{2}-\d{2}$/.test(p.examDate || "") ? p.examDate : "",
      daily: num(p.daily, DEFAULT_PROFILE.daily, 1, 200),
      theme: THEMES[p.theme] ? p.theme : "auto"
    };
  }
  let profile = sanitizeProfile(store.get(KEYS.profile));
  const saveProfile = () => store.set(KEYS.profile, profile);
  const initials = () => (profile.name.split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0]).join("") || "?").toUpperCase();
  function applyTheme() {
    if (profile.theme === "auto") document.documentElement.removeAttribute("data-theme");
    else document.documentElement.setAttribute("data-theme", profile.theme);
  }

  /* ---------------- Utilitaires ---------------- */
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const fmt = s => esc(s).replace(/`([^`]+)`/g, "<code>$1</code>");   // `texte` -> <code>
  const shuffle = arr => { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const sameSet = (a, b) => a.length === b.length && a.slice().sort().join() === b.slice().sort().join();
  const clock = ms => { const t = Math.max(0, Math.ceil(ms / 1000)); const h = Math.floor(t / 3600), m = Math.floor(t % 3600 / 60), s = t % 60; return h + ":" + String(m).padStart(2, "0") + ":" + String(s).padStart(2, "0"); };
  const pct = (n, d) => d ? Math.round(n / d * 100) : 0;
  const isCorrect = (q, answer) => sameSet(q.correct, answer || []);

  /* ---------------- État ---------------- */
  let view = "home";       // home | dashboard | profile | quiz | review | results
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
  // Nombre de questions par domaine, selon les poids (méthode du plus fort reste) ; `lens` = taille de chaque réserve.
  function examQuota(lens) {
    const size = Math.min(CONFIG.examSize, QUESTIONS.length);
    const ids = Object.keys(DOMAINS).map(Number);
    const totalW = ids.reduce((s, d) => s + DOMAINS[d].weight, 0);
    const quota = {}; let used = 0;
    const rests = ids.map(d => {
      const exact = size * DOMAINS[d].weight / totalW;
      quota[d] = Math.min(Math.floor(exact), lens[d]); used += quota[d];
      return { d, r: exact - Math.floor(exact) };
    }).sort((a, b) => b.r - a.r);
    let guard = 0;
    while (used < size && guard++ < 500) {
      const { d } = rests[(guard - 1) % rests.length];
      if (quota[d] < lens[d]) { quota[d]++; used++; }
    }
    return quota;
  }
  function drawExam() {
    const ids = Object.keys(DOMAINS).map(Number);
    const pools = Object.fromEntries(ids.map(d => [d, shuffle(QUESTIONS.filter(q => q.domain === d))]));
    const quota = examQuota(Object.fromEntries(ids.map(d => [d, pools[d].length])));
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
      h.unshift({ date: session.finishedAt, ok: r.ok, total: r.total, pct: r.pct, usedMs: CONFIG.examMinutes * 60000 - (session.remainingMs || 0) });
      store.set(KEYS.history, h.slice(0, HISTORY_MAX));
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
    else if (view === "dashboard") renderDashboard();
    else if (view === "profile") renderProfile();
    else renderHome();
  }

  /* ---------------- Barre de navigation (accueil, tableau de bord, profil) ---------------- */
  const NAV = [["home", "Accueil"], ["dashboard", "Tableau de bord"], ["profile", "Profil"]];
  function appbarHTML(active) {
    return `<div class="strip"></div>
    <nav class="appbar" aria-label="Navigation principale"><div class="appbar-in">
      <span class="brand">${IC.cloud}<span>GCP ACE</span></span>
      <div class="navlinks">${NAV.map(([v, l]) => `<button class="navlink${active === v ? " on" : ""}" data-action="nav" data-view="${v}"${active === v ? ' aria-current="page"' : ""}>${l}</button>`).join("")}</div>
      <button class="avatar-btn" data-action="nav" data-view="profile" aria-label="Ouvrir le profil"><span class="avatar d${profile.color}">${esc(initials())}</span></button>
    </div></nav>`;
  }
  // Jours restants avant la date d'examen du profil (null si non renseignée, négatif si passée).
  function daysToExam() {
    if (!profile.examDate) return null;
    return Math.round((new Date(profile.examDate + "T12:00:00") - new Date(dayKey() + "T12:00:00")) / 86400000);
  }
  function countdownText() {
    const d = daysToExam();
    return d === null ? "" : d > 1 ? `J-${d} avant ton examen` : d === 1 ? "Examen demain" : d === 0 ? "Examen aujourd'hui" : `Examen passé il y a ${-d} jour${-d > 1 ? "s" : ""}`;
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
    const tried = dkeys.map(d => QUESTIONS.filter(q => q.domain == d && stats[q.id]).length);
    const hasStats = tried.some(n => n > 0);
    const quota = examQuota(Object.fromEntries(dkeys.map((d, i) => [d, counts[i]])));
    // Domaine à travailler en priorité : plus faible taux de réussite parmi ceux déjà abordés.
    let weak = -1;
    dkeys.forEach((d, i) => { if (tried[i] && (weak < 0 || mast[i] / counts[i] < mast[weak] / counts[weak])) weak = i; });
    // Action recommandée affichée dans le bandeau (un seul bouton principal).
    const hero = examLive ? { a: "resume", m: "exam", t: "Reprendre l'examen" }
      : pracLive ? { a: "resume", m: "practice", t: "Reprendre l'entraînement" }
      : !hasStats ? { a: "practice-all", m: "", t: "Commencer l'entraînement" }
      : errs.length ? { a: "new-errors", m: "", t: `Revoir mes erreurs (${errs.length})` }
      : { a: "new-exam", m: "", t: "Lancer un examen blanc" };

    const examBlock = examLive
      ? `<div class="note"><p class="small"><strong>Examen en cours</strong> : ${Object.keys(exam.answers).filter(k => exam.answers[k].length).length} réponse(s) sur ${exam.ids.length}, <span class="num">${clock(exam.remainingMs)}</span> restantes.</p>
         <div class="row"><button class="btn btn-primary" data-action="resume" data-mode="exam">Reprendre ${IC.next}</button>
         <button class="btn" data-action="ask-new-exam">Nouvel examen</button></div></div>`
      : `<div class="row"><button class="btn btn-primary" data-action="new-exam">Démarrer l'examen ${IC.next}</button>
         ${exam && exam.finished ? `<button class="btn" data-action="show-results" data-mode="exam">Dernier résultat</button>` : ""}</div>`;

    const countdown = countdownText();
    app.innerHTML = `
    ${appbarHTML("home")}
    <main class="wrap stagger">
      <header class="hero" id="hero">
        <div class="hero-text">
          <span class="badge-top"><i></i>${profile.name ? `Bonjour ${esc(profile.name)}` : "Entraînement non officiel"}${countdown ? ` · ${countdown}` : ""}</span>
          <h1>Prépare ton Associate Cloud Engineer</h1>
          <p class="muted">${QUESTIONS.length} questions sur les 5 domaines de l'examen Google Cloud, dont ${multi} à réponses multiples. Ta progression reste enregistrée dans ce navigateur.</p>
          <div class="row">
            <button class="btn btn-primary" data-action="${hero.a}"${hero.m ? ` data-mode="${hero.m}"` : ""}>${hero.t} ${IC.next}</button>
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
          <div class="mix" aria-label="Répartition des questions par domaine">
            <div class="mixbar" aria-hidden="true">${dkeys.map(d => `<i class="d${d}" style="flex:${quota[d]}"></i>`).join("")}</div>
            <ul class="mixlist">${dkeys.map(d => `<li class="d${d}"><b class="num">${quota[d]}</b> ${esc(DOMAINS[d].short)}</li>`).join("")}</ul>
          </div>
          <div class="mode-cta">${examBlock}</div>
        </section>

        <section class="card mode" aria-labelledby="h-prac">
          <span class="mode-ic green">${IC.target}</span>
          <h2 id="h-prac">Entraînement libre</h2>
          <p class="small muted">Correction et explication après chaque réponse. Choisis les domaines à travailler.</p>
          <div class="chips" id="domain-chips">
            ${dkeys.map((d, i) => `<label class="chip d${d}"><input type="checkbox" id="dom-${d}" value="${d}" checked><span>${esc(DOMAINS[d].short)} <span class="num">${counts[i]}</span></span></label>`).join("")}
          </div>
          <button class="btn btn-ghost btn-sm" data-action="toggle-domains" id="btn-toggle-domains" type="button">Tout désélectionner</button>
          <div class="row mode-cta"><button class="btn btn-primary" data-action="new-practice" id="btn-practice">Commencer</button>
          ${pracLive ? `<button class="btn" data-action="resume" data-mode="practice">Reprendre (${Object.keys(prac.validated).length}/${prac.ids.length})</button>` : ""}
          ${errs.length ? `<button class="btn" data-action="new-errors">Revoir mes erreurs (${errs.length})</button>` : ""}</div>
        </section>
      </div>

      <section class="card" aria-labelledby="h-dom">
        <div class="row spread"><h2 id="h-dom">Ta maîtrise par domaine</h2>${hasStats ? `<span class="small muted">Questions réussies à ta dernière tentative</span>` : ""}</div>
        ${hasStats ? `<div class="note focus"><p class="small"><strong>À travailler en priorité :</strong> ${esc(DOMAINS[dkeys[weak]].name)} <span class="num muted">(${mast[weak]}/${counts[weak]})</span></p>
          <button class="btn btn-primary btn-sm" data-action="practice-domain" data-d="${dkeys[weak]}">S'entraîner sur ce domaine ${IC.next}</button></div>`
        : `<div class="note empty"><p class="small"><strong>Pas encore de données.</strong> Fais un premier entraînement : ta progression par domaine s'affichera ici, avec le domaine à travailler en priorité.</p></div>`}
        <ul class="dlist${hasStats ? "" : " idle"}">
          ${dkeys.map((d, i) => `<li class="drow d${d}"><span class="dnum">${d}</span><span>${esc(DOMAINS[d].name)}</span>
            <span class="num small muted">${hasStats ? `${mast[i]}/${counts[i]}` : `${counts[i]} questions`}</span>
            <span class="wbar"><i style="width:${pct(mast[i], counts[i])}%"></i></span></li>`).join("")}
        </ul>
      </section>

      ${history.length ? `<section class="card" aria-labelledby="h-hist">
        <div class="row spread"><h2 id="h-hist">Derniers examens blancs</h2><button class="btn btn-sm" data-action="nav" data-view="dashboard">Tableau de bord ${IC.next}</button></div>
        <div class="tscroll"><table>
          <thead><tr><th>Date</th><th class="r">Score</th><th class="r">Réussite</th><th>Résultat</th></tr></thead>
          <tbody>${history.slice(0, 5).map(h => `<tr><td>${new Date(h.date).toLocaleDateString("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</td><td class="r num">${h.ok}/${h.total}</td><td class="r num">${h.pct} %</td><td><span class="pill ${h.pct >= CONFIG.passPct ? "ok" : "ko"} mini">${h.pct >= CONFIG.passPct ? "Au-dessus du seuil" : "Sous le seuil"}</span></td></tr>`).join("")}</tbody>
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
    const t = document.getElementById("btn-toggle-domains");
    if (t) t.textContent = doms.length === Object.keys(DOMAINS).length ? "Tout désélectionner" : "Tout sélectionner";
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
              ? `<span><i class="sw-answered"></i>Répondue</span>`
              : `<span><i class="sw-ok"></i>Juste ✓</span><span><i class="sw-ko"></i>Fausse ✕</span>`}
            <span><i class="sw-current"></i>En cours</span>
            <span><i class="sw-flag"></i>À revoir</span>
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
          <span><i class="sw-answered"></i>Répondue</span>
          <span><i class="dash"></i>Sans réponse</span>
          <span><i class="sw-flag"></i>Marquée</span>
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

  /* ======================= VUE : TABLEAU DE BORD ======================= */
  function dashData() {
    const history = store.get(KEYS.history) || [];
    const doms = Object.keys(DOMAINS).map(d => {
      const qs = QUESTIONS.filter(q => q.domain == d), tried = qs.filter(q => stats[q.id]), ok = tried.filter(q => stats[q.id].ok);
      return { d, total: qs.length, tried: tried.length, ok: ok.length, rate: pct(ok.length, tried.length), mastery: pct(ok.length, qs.length) };
    });
    const tried = QUESTIONS.filter(q => stats[q.id]);
    const errs = tried.filter(q => !stats[q.id].ok).sort((a, b) => stats[b.id].n - stats[a.id].n);
    const days = Object.values(activity);
    const attempts = Object.values(stats).reduce((s, v) => s + (v.n || 0), 0);
    const actN = days.reduce((s, a) => s + a.n, 0), actOk = days.reduce((s, a) => s + a.ok, 0);
    const best = history.reduce((m, h) => Math.max(m, h.pct), 0);
    const avg = history.length ? Math.round(history.reduce((s, h) => s + h.pct, 0) / history.length) : 0;
    const today = activity[dayKey()] || { n: 0, ok: 0 };
    // Jours consécutifs avec au moins une réponse validée (aujourd'hui compris s'il est actif).
    let streak = 0;
    for (let i = 0; i < 400; i++) { const d = new Date(); d.setDate(d.getDate() - i); const a = activity[dayKey(d)]; if (a && a.n) streak++; else if (i) break; }
    return { history, doms, tried: tried.length, mastered: tried.length - errs.length, errs, attempts, actN, actOk, best, avg, today, streak };
  }

  // Courbe des derniers examens blancs (SVG en ligne), avec le seuil et l'objectif personnel.
  function scoreChart(history) {
    const pts = history.slice(0, 10).reverse();
    const W = 640, H = 230, L = 40, R = 16, T = 24, B = 36;
    const x = i => pts.length < 2 ? (L + W - R) / 2 : L + i * (W - L - R) / (pts.length - 1);
    const y = v => T + (H - T - B) * (1 - v / 100);
    const line = pts.map((h, i) => (i ? "L" : "M") + x(i).toFixed(1) + " " + y(h.pct).toFixed(1)).join(" ");
    const area = `${line} L${x(pts.length - 1).toFixed(1)} ${y(0)} L${x(0).toFixed(1)} ${y(0)} Z`;
    const fdate = t => new Date(t).toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
    return `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="Scores des ${pts.length} derniers examens blancs">
      ${[0, 25, 50, 75, 100].map(v => `<line class="grid" x1="${L}" x2="${W - R}" y1="${y(v)}" y2="${y(v)}"/><text class="axis" x="${L - 8}" y="${y(v) + 4}" text-anchor="end">${v}</text>`).join("")}
      <line class="thr" x1="${L}" x2="${W - R}" y1="${y(CONFIG.passPct)}" y2="${y(CONFIG.passPct)}"/><text class="axis thr-t" x="${W - R}" y="${y(CONFIG.passPct) - 5}" text-anchor="end">Seuil ${CONFIG.passPct} %</text>
      ${profile.target !== CONFIG.passPct ? `<line class="tgt" x1="${L}" x2="${W - R}" y1="${y(profile.target)}" y2="${y(profile.target)}"/><text class="axis tgt-t" x="${L + 4}" y="${y(profile.target) - 5}">Objectif ${profile.target} %</text>` : ""}
      ${pts.length > 1 ? `<path class="area" d="${area}"/><path class="line" d="${line}"/>` : ""}
      ${pts.map((h, i) => `<circle class="dot ${h.pct >= CONFIG.passPct ? "ok" : "ko"}" cx="${x(i).toFixed(1)}" cy="${y(h.pct).toFixed(1)}" r="5"><title>${fdate(h.date)} : ${h.pct} %</title></circle>
        <text class="val" x="${x(i).toFixed(1)}" y="${(y(h.pct) - 11).toFixed(1)}" text-anchor="middle">${h.pct}</text>
        <text class="axis" x="${x(i).toFixed(1)}" y="${H - 12}" text-anchor="middle">${fdate(h.date)}</text>`).join("")}
    </svg>`;
  }

  // Barres des 14 derniers jours : hauteur = réponses validées, partie colorée = bonnes réponses.
  function activityStrip() {
    const days = Array.from({ length: 14 }, (_, i) => { const d = new Date(); d.setDate(d.getDate() - 13 + i); return { d, a: activity[dayKey(d)] || { n: 0, ok: 0 } }; });
    const max = Math.max(1, ...days.map(x => x.a.n));
    return `<div class="actstrip" role="img" aria-label="Réponses validées sur les 14 derniers jours">
      ${days.map(({ d, a }, i) => `<div class="actday${i === 13 ? " today" : ""}" title="${d.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })} : ${a.n} réponse${a.n > 1 ? "s" : ""}, ${a.ok} juste${a.ok > 1 ? "s" : ""}">
        <span class="actbar"><i style="height:${a.n ? Math.max(6, Math.round(a.n / max * 100)) : 0}%"><b style="height:${a.n ? Math.round(a.ok / a.n * 100) : 0}%"></b></i></span>
        <span class="actlbl">${"DLMMJVS"[d.getDay()]}</span></div>`).join("")}
    </div>`;
  }

  function renderDashboard() {
    const d = dashData();
    const last = d.history[0], prev = d.history[1];
    const trend = last && prev ? last.pct - prev.pct : null;
    const daysLeft = daysToExam(), countdown = countdownText();
    const left = Math.max(0, profile.daily - d.today.n);
    const rate = d.actN ? pct(d.actOk, d.actN) : pct(d.mastered, d.tried);
    const n = d.history.length, nShown = Math.min(10, n);
    const fdate = t => new Date(t).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });

    app.innerHTML = `
    ${appbarHTML("dashboard")}
    <main class="wrap stagger">
      <header class="card dash-head">
        <span class="avatar xl d${profile.color}" aria-hidden="true">${esc(initials())}</span>
        <div class="dash-id">
          <span class="tag">Tableau de bord</span>
          <h1>${profile.name ? `Bonjour ${esc(profile.name)}` : "Ta progression"}</h1>
          <div class="facts">
            <span class="fact${daysLeft !== null && daysLeft >= 0 && daysLeft <= 7 ? " warn" : ""}">${IC.cal}${countdown || "Date d'examen non renseignée"}</span>
            <span class="fact">${IC.fire}<b>${d.streak}</b> jour${d.streak > 1 ? "s" : ""} d'affilée</span>
            <span class="fact">${IC.target}Score visé <b>${profile.target} %</b></span>
          </div>
        </div>
        <button class="btn btn-sm dash-edit" data-action="nav" data-view="profile">${IC.edit} Modifier le profil</button>
        <div class="goal">
          <div class="row spread"><strong class="small">Objectif du jour</strong><span class="small num muted">${d.today.n}/${profile.daily} questions</span></div>
          <div class="bar" role="progressbar" aria-valuemin="0" aria-valuemax="${profile.daily}" aria-valuenow="${Math.min(d.today.n, profile.daily)}" aria-label="Objectif quotidien"><i class="${left ? "" : "ok"}" style="width:${pct(Math.min(d.today.n, profile.daily), profile.daily)}%"></i></div>
          <p class="small muted">${left ? `Encore ${left} question${left > 1 ? "s" : ""} à valider aujourd'hui.` : "Objectif quotidien atteint, bravo !"}</p>
        </div>
      </header>

      <section class="kpis" aria-label="Chiffres clés">
        <div class="kpi accent"><span class="lbl">Examens blancs</span><span class="val num">${n}</span><span class="sub">${n ? `Meilleur score : <b class="num">${d.best} %</b> · moyenne <b class="num">${d.avg} %</b>` : "Aucun examen passé"}</span></div>
        <div class="kpi${last ? (last.pct >= CONFIG.passPct ? " good" : " bad") : ""}"><span class="lbl">Dernier score</span><span class="val num">${last ? last.pct + " %" : "–"}</span><span class="sub">${trend === null ? (last ? `${last.ok}/${last.total} bonnes réponses` : "Lance un premier examen blanc") : trend > 0 ? `↗ +${trend} pts par rapport au précédent` : trend < 0 ? `↘ ${trend} pts par rapport au précédent` : "Stable par rapport au précédent"}</span></div>
        <div class="kpi"><span class="lbl">Questions maîtrisées</span><span class="val num">${d.mastered}<span class="den">/${QUESTIONS.length}</span></span><span class="sub">${d.tried ? `${d.tried} abordée${d.tried > 1 ? "s" : ""} · ${d.errs.length} à retravailler` : "Aucune question abordée"}</span></div>
        <div class="kpi"><span class="lbl">Réponses validées</span><span class="val num">${d.attempts}</span><span class="sub">${d.attempts ? `Taux de réussite : <b class="num">${rate} %</b>` : "En entraînement et en examen"}</span></div>
      </section>

      <section class="card" aria-labelledby="h-chart">
        <div class="row spread"><h2 id="h-chart">Évolution des scores</h2>${n ? `<span class="small muted">${nShown} dernier${nShown > 1 ? "s" : ""} examen${nShown > 1 ? "s" : ""} blanc${nShown > 1 ? "s" : ""}</span>` : ""}</div>
        ${n ? scoreChart(d.history) + `<div class="legend"><span><i class="sw-ok"></i>Au-dessus du seuil</span><span><i class="sw-ko"></i>Sous le seuil</span><span><i class="ln-thr"></i>Seuil ${CONFIG.passPct} %</span>${profile.target !== CONFIG.passPct ? `<span><i class="ln-tgt"></i>Objectif ${profile.target} %</span>` : ""}</div>`
          : `<div class="note empty"><p class="small"><strong>Aucun examen blanc pour l'instant.</strong> Passe un premier examen : ta courbe de progression apparaîtra ici.</p><div class="row"><button class="btn btn-primary btn-sm" data-action="new-exam">Lancer un examen blanc ${IC.next}</button></div></div>`}
      </section>

      <section class="card" aria-labelledby="h-act">
        <div class="row spread"><h2 id="h-act">Activité des 14 derniers jours</h2><span class="small muted">Réponses validées par jour, bonnes réponses en couleur</span></div>
        ${activityStrip()}
        ${d.actN ? "" : `<p class="small muted">L'activité est comptée à partir de maintenant, à chaque réponse validée en entraînement ou en examen.</p>`}
      </section>

      <section class="card" aria-labelledby="h-dtab">
        <div class="row spread"><h2 id="h-dtab">Maîtrise par domaine</h2><span class="small muted">Dernière tentative sur chaque question</span></div>
        <div class="tscroll"><table class="dtable">
          <thead><tr><th>Domaine</th><th class="r">Poids</th><th class="r">Abordées</th><th class="r">Réussies</th><th class="r">Taux</th><th>Maîtrise</th><th></th></tr></thead>
          <tbody>${d.doms.map(x => `<tr class="d${x.d}">
            <td><span class="dcell"><span class="dnum">${x.d}</span><span>${esc(DOMAINS[x.d].name)}</span></span></td>
            <td class="r num muted">${DOMAINS[x.d].weight} %</td>
            <td class="r num">${x.tried}/${x.total}</td>
            <td class="r num">${x.ok}</td>
            <td class="r">${x.tried ? `<span class="pill ${x.rate >= CONFIG.passPct ? "ok" : "ko"} mini num">${x.rate} %</span>` : `<span class="muted">–</span>`}</td>
            <td><span class="wbar" title="${x.mastery} % des questions du domaine réussies"><i style="width:${x.mastery}%"></i></span></td>
            <td class="r"><button class="btn btn-ghost btn-sm" data-action="practice-domain" data-d="${x.d}">S'entraîner</button></td>
          </tr>`).join("")}</tbody>
          <tfoot><tr><td>Total</td><td class="r num muted">100 %</td><td class="r num">${d.tried}/${QUESTIONS.length}</td><td class="r num">${d.mastered}</td><td class="r num">${d.tried ? `${pct(d.mastered, d.tried)} %` : "–"}</td><td><span class="wbar"><i style="width:${pct(d.mastered, QUESTIONS.length)}%"></i></span></td><td></td></tr></tfoot>
        </table></div>
      </section>

      <section class="card" aria-labelledby="h-err">
        <div class="row spread"><h2 id="h-err">Questions à retravailler</h2>${d.errs.length ? `<button class="btn btn-sm" data-action="new-errors">Revoir mes erreurs (${d.errs.length}) ${IC.next}</button>` : ""}</div>
        ${d.errs.length ? `<ul class="errlist">${d.errs.slice(0, 6).map(q => `<li><span class="tag dtag d${q.domain}">${esc(DOMAINS[q.domain].short)}</span><span>${fmt(q.q.length > 140 ? q.q.slice(0, 140) + "…" : q.q)}</span><span class="small muted num">${stats[q.id].n} essai${stats[q.id].n > 1 ? "s" : ""}</span></li>`).join("")}</ul>${d.errs.length > 6 ? `<p class="small muted">… et ${d.errs.length - 6} autre${d.errs.length - 6 > 1 ? "s" : ""}.</p>` : ""}`
          : `<p class="muted">${d.tried ? "Aucune erreur en attente : toutes les questions abordées ont été réussies à la dernière tentative." : "Commence un entraînement : tes erreurs apparaîtront ici pour être rejouées."}</p>`}
      </section>

      <section class="card" aria-labelledby="h-hist2">
        <div class="row spread"><h2 id="h-hist2">Historique des examens blancs</h2>${n ? `<span class="small muted">${n} examen${n > 1 ? "s" : ""} · ${HISTORY_MAX} conservés au maximum</span>` : ""}</div>
        ${n ? `<div class="tscroll"><table>
          <thead><tr><th>#</th><th>Date</th><th class="r">Score</th><th class="r">Réussite</th><th class="r">Durée</th><th>Résultat</th></tr></thead>
          <tbody>${d.history.map((h, i) => `<tr><td class="num muted">${n - i}</td><td>${fdate(h.date)}</td><td class="r num">${h.ok}/${h.total}</td><td class="r num"><b>${h.pct} %</b></td><td class="r num">${h.usedMs != null ? clock(h.usedMs) : "–"}</td><td class="row" style="gap:6px"><span class="pill ${h.pct >= CONFIG.passPct ? "ok" : "ko"} mini">${h.pct >= CONFIG.passPct ? "Au-dessus du seuil" : "Sous le seuil"}</span>${h.pct >= profile.target ? `<span class="pill ok mini">Objectif atteint</span>` : ""}</td></tr>`).join("")}</tbody>
        </table></div>` : `<p class="muted">Aucun examen blanc terminé pour l'instant.</p>`}
      </section>
    </main>`;
  }

  /* ======================= VUE : PROFIL ======================= */
  function renderProfile() {
    const p = profile;
    app.innerHTML = `
    ${appbarHTML("profile")}
    <main class="wrap stagger">
      <header style="display:flex;flex-direction:column;gap:8px;align-items:flex-start">
        <span class="tag">Profil</span>
        <h1>Ton profil</h1>
        <p class="muted">Personnalise ton espace et tes objectifs. Tout est enregistré automatiquement dans ce navigateur, sans compte ni serveur.</p>
      </header>
      <form id="profile-form" class="pform" autocomplete="off" novalidate>
        <section class="card" aria-labelledby="h-id">
          <h2 id="h-id">Identité</h2>
          <div class="prof-grid">
            <div class="avatar-pick">
              <span class="avatar xl d${p.color}" id="avatar-preview" aria-hidden="true">${esc(initials())}</span>
              <div class="swatches" role="radiogroup" aria-label="Couleur de l'avatar">
                ${AVATAR_COLORS.map(c => `<label class="swatch d${c}"><input type="radio" name="color" value="${c}" ${c === p.color ? "checked" : ""} aria-label="Couleur ${c}"><span></span></label>`).join("")}
              </div>
            </div>
            <div class="fields">
              <label class="field"><span>Prénom ou pseudo</span><input type="text" name="name" id="p-name" maxlength="30" value="${esc(p.name)}" placeholder="Ex. Alex"></label>
              <label class="field"><span>Date de l'examen</span><input type="date" name="examDate" value="${esc(p.examDate)}"><small>Le compte à rebours s'affiche sur l'accueil et le tableau de bord.</small></label>
            </div>
          </div>
        </section>
        <section class="card" aria-labelledby="h-obj">
          <h2 id="h-obj">Objectifs</h2>
          <div class="fields two">
            <label class="field"><span>Score visé (%)</span><input type="number" name="target" inputmode="numeric" min="50" max="100" step="1" value="${p.target}"><small>Le seuil indicatif de réussite reste à ${CONFIG.passPct} %.</small></label>
            <label class="field"><span>Questions par jour</span><input type="number" name="daily" inputmode="numeric" min="1" max="200" step="1" value="${p.daily}"><small>Objectif quotidien suivi sur le tableau de bord.</small></label>
          </div>
        </section>
        <section class="card" aria-labelledby="h-pref">
          <h2 id="h-pref">Apparence</h2>
          <div class="chips" role="radiogroup" aria-label="Thème">
            ${Object.entries(THEMES).map(([k, l]) => `<label class="chip"><input type="radio" name="theme" value="${k}" ${p.theme === k ? "checked" : ""}><span>${l}</span></label>`).join("")}
          </div>
          <p class="small muted">« Système » suit le réglage clair ou sombre de ton appareil.</p>
        </section>
      </form>
      <section class="card" aria-labelledby="h-data">
        <h2 id="h-data">Tes données</h2>
        <p class="small muted">Statistiques, historique et profil sont stockés uniquement dans ce navigateur. Exporte-les pour les sauvegarder ou les transférer sur un autre appareil.</p>
        <div class="row">
          <button class="btn" data-action="export">${IC.download} Exporter (JSON)</button>
          <button class="btn" data-action="import">${IC.upload} Importer un export</button>
          <input type="file" id="import-file" accept="application/json,.json" class="sr" tabindex="-1" aria-hidden="true">
          <button class="btn btn-danger" data-action="ask-reset">Réinitialiser la progression</button>
        </div>
      </section>
    </main>`;
  }
  // Lit le formulaire, nettoie, enregistre et répercute (thème, avatar, champs numériques corrigés).
  function readProfileForm() {
    const f = document.getElementById("profile-form"); if (!f) return;
    const v = n => f.elements[n] ? f.elements[n].value : undefined;
    profile = sanitizeProfile({ name: v("name"), color: v("color"), target: v("target"), examDate: v("examDate"), daily: v("daily"), theme: v("theme") });
    saveProfile(); applyTheme();
    if (f.elements.target) f.elements.target.value = profile.target;
    if (f.elements.daily) f.elements.daily.value = profile.daily;
    previewAvatar();
  }
  function previewAvatar() {
    const f = document.getElementById("profile-form");
    const name = f && f.elements.name ? f.elements.name.value : profile.name;
    const color = f && f.elements.color && f.elements.color.value ? Number(f.elements.color.value) : profile.color;
    const ini = (name.split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0]).join("") || "?").toUpperCase();
    document.querySelectorAll("#avatar-preview, .appbar .avatar").forEach(a => { a.className = a.className.replace(/\bd\d\b/, "d" + color); a.textContent = ini; });
  }

  /* ---------------- Export / import des données ---------------- */
  function exportData() {
    const data = { app: "gcp-ace-examen-blanc", version: STORAGE_VERSION, exportedAt: new Date().toISOString(), profile, stats, activity, history: store.get(KEYS.history) || [] };
    const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }));
    const a = document.createElement("a"); a.href = url; a.download = `gcp-ace-progression-${dayKey()}.json`;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    toast("Export téléchargé");
  }
  function importData(file) {
    if (!file) return;
    const rd = new FileReader();
    rd.onload = () => {
      try {
        const d = JSON.parse(rd.result);
        if (!d || d.app !== "gcp-ace-examen-blanc") throw new Error("format");
        if (d.stats && typeof d.stats === "object")
          stats = Object.fromEntries(Object.entries(d.stats).filter(([id, v]) => Q_BY_ID[id] && v && Number.isFinite(v.n)).map(([id, v]) => [id, { n: v.n, ok: !!v.ok }]));
        if (d.activity && typeof d.activity === "object")
          activity = Object.fromEntries(Object.entries(d.activity).filter(([k, v]) => /^\d{4}-\d{2}-\d{2}$/.test(k) && v && Number.isFinite(v.n)).map(([k, v]) => [k, { n: v.n, ok: Number.isFinite(v.ok) ? v.ok : 0 }]));
        if (Array.isArray(d.history))
          store.set(KEYS.history, d.history.filter(h => h && Number.isFinite(h.date) && Number.isFinite(h.pct) && Number.isFinite(h.ok) && Number.isFinite(h.total)).slice(0, HISTORY_MAX));
        if (d.profile && typeof d.profile === "object") profile = sanitizeProfile(d.profile);
        saveStats(); saveProfile(); applyTheme();
        renderProfile(); toast("Données importées");
      } catch (e) { toast("Fichier non reconnu"); }
    };
    rd.readAsText(file);
  }

  /* ---------------- Message furtif de confirmation ---------------- */
  let toastTimer = null;
  function toast(msg) {
    let t = document.getElementById("toast");
    if (!t) { t = document.createElement("div"); t.id = "toast"; t.className = "toast"; t.setAttribute("role", "status"); document.body.appendChild(t); }
    t.textContent = msg; t.classList.add("show");
    clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove("show"), 2200);
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
    "practice-all": () => startPractice(Object.keys(DOMAINS).map(Number)),
    "practice-domain": el => startPractice([Number(el.dataset.d)]),
    "toggle-domains": () => {
      const boxes = document.querySelectorAll("#domain-chips input");
      const all = Array.from(boxes).every(b => b.checked);
      boxes.forEach(b => { b.checked = !all; });
      updatePracticeCount();
    },
    "new-errors": () => {                                    // rejoue les questions ratées à la dernière tentative
      const qs = shuffle(QUESTIONS.filter(q => stats[q.id] && !stats[q.id].ok));
      if (!qs.length) return;
      session = newSession("practice", qs); store.set(KEYS.practice, session); go("quiz");
    },
    "train-domain": el => startPractice([Number(el.dataset.domain)]),
    "resume": el => { session = loadSession(el.dataset.mode); if (!session || session.finished) { session = null; return renderHome(); } go("quiz"); startTimer(); },
    "show-results": el => { session = loadSession(el.dataset.mode); if (session) { reviewFilter = "wrong"; go("results"); } },
    "home": () => { session = null; go("home"); },
    "nav": el => { session = null; go(el.dataset.view); },
    "export": exportData,
    "import": () => { const f = document.getElementById("import-file"); if (f) { f.value = ""; f.click(); } },
    "ask-reset": () => openDialog("Réinitialiser la progression ?", "Statistiques, activité, historique des examens et sessions en cours seront effacés. Ton profil est conservé.", "Réinitialiser", "reset"),
    "reset": () => {
      ["exam", "practice", "history", "stats", "activity"].forEach(k => store.del(KEYS[k]));
      stats = {}; activity = {}; session = null;
      closeDialog(); go("profile"); toast("Progression réinitialisée");
    },
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
    else if (t.id === "import-file") importData(t.files && t.files[0]);          // import d'une sauvegarde
    else if (t.closest && t.closest("#profile-form")) { readProfileForm(); toast("Profil enregistré"); }   // profil : enregistrement automatique
  });
  document.addEventListener("input", e => { if (e.target.id === "p-name") previewAvatar(); });   // aperçu des initiales en direct
  document.addEventListener("submit", e => { if (e.target.id === "profile-form") e.preventDefault(); });

  // Sauvegarde du temps restant quand l'onglet est quitté ou masqué.
  window.addEventListener("pagehide", save);
  document.addEventListener("visibilitychange", () => { if (document.hidden) save(); });

  applyTheme();
  render();
})();
