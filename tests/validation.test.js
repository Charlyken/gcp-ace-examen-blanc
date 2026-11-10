import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { DOMAINS, TOPICS, QUESTIONS } from "../questions.js";
import { validateBank, DOC_HOSTS } from "../scripts/validation.js";

const DOM = { 1: { name: "Un", short: "U", weight: 60 }, 2: { name: "Deux", short: "D", weight: 40 } };
const TOP = { iam: "IAM", gke: "GKE" };
const good = (over = {}) => ({
  id: "d1-01", domain: 1, topic: "iam", difficulty: 2, doc: "https://docs.cloud.google.com/iam/docs/overview",
  q: "Énoncé ?", options: ["a", "b", "c", "d"], correct: [0], explain: "Parce que.", ...over
});
// Banque minimale valide : une question de chaque domaine.
const bank = (...qs) => ({ DOMAINS: DOM, TOPICS: TOP, QUESTIONS: qs.length ? qs : [good(), good({ id: "d2-01", domain: 2 })] });
const errorsOf = (...qs) => validateBank(bank(...qs)).errors;
const has = (errors, text) => errors.some(e => e.includes(text));

describe("banque réelle", () => {
  test("ne produit aucune erreur de validation", () => {
    assert.deepEqual(validateBank({ DOMAINS, TOPICS, QUESTIONS }).errors, []);
  });
  test("chaque question a un sujet connu, une difficulté 1-3 et un lien https vers un hôte autorisé", () => {
    for (const q of QUESTIONS) {
      assert.ok(TOPICS[q.topic], `${q.id} : sujet ${q.topic}`);
      assert.ok([1, 2, 3].includes(q.difficulty), `${q.id} : difficulté`);
      const url = new URL(q.doc);
      assert.equal(url.protocol, "https:", q.id);
      assert.ok(DOC_HOSTS.includes(url.hostname), `${q.id} : ${url.hostname}`);
    }
  });
  test("tous les sujets déclarés sont utilisés", () => {
    for (const t of Object.keys(TOPICS)) assert.ok(QUESTIONS.some(q => q.topic === t), t);
  });
});

describe("validateBank : métadonnées", () => {
  test("accepte une question complète", () => {
    assert.deepEqual(errorsOf(good(), good({ id: "d2-01", domain: 2 })), []);
  });
  test("topic : requis et déclaré dans TOPICS", () => {
    assert.ok(has(errorsOf(good({ topic: undefined })), "topic manquant"));
    assert.ok(has(errorsOf(good({ topic: "" })), "topic manquant"));
    assert.ok(has(errorsOf(good({ topic: "inconnu" })), "topic inconnu (inconnu)"));
    assert.ok(has(errorsOf(good({ topic: "toString" })), "topic inconnu"), "pas de faux positif sur les propriétés d'Object");
  });
  test("difficulty : entier de 1 à 3", () => {
    for (const bad of [undefined, 0, 4, "2", 1.5, null]) assert.ok(has(errorsOf(good({ difficulty: bad })), "difficulty invalide"), String(bad));
    for (const ok of [1, 2, 3]) assert.ok(!has(errorsOf(good({ difficulty: ok })), "difficulty"), String(ok));
  });
  test("une question à réponses multiples n'est pas de difficulté 1", () => {
    assert.ok(has(errorsOf(good({ correct: [0, 1], difficulty: 1 })), "au moins de difficulté 2"));
    assert.ok(!has(errorsOf(good({ correct: [0, 1], difficulty: 2 })), "difficulté 2"));
  });
  test("doc : requis, URL valide, https, hôte autorisé, page précise", () => {
    assert.ok(has(errorsOf(good({ doc: undefined })), "doc manquant"));
    assert.ok(has(errorsOf(good({ doc: "pas une url" })), "URL invalide"));
    assert.ok(has(errorsOf(good({ doc: "http://docs.cloud.google.com/iam/docs/overview" })), "https obligatoire"));
    assert.ok(has(errorsOf(good({ doc: "https://example.com/iam" })), "hôte non autorisé (example.com)"));
    assert.ok(has(errorsOf(good({ doc: "https://docs.cloud.google.com.evil.example/iam" })), "hôte non autorisé"), "faux sous-domaine refusé");
    assert.ok(has(errorsOf(good({ doc: "https://notcloud.google.com/iam/docs/overview" })), "hôte non autorisé"), "suffixe sans point refusé");
    assert.ok(has(errorsOf(good({ doc: "https://kubernetes.io.evil.example/docs" })), "hôte non autorisé"));
    assert.ok(has(errorsOf(good({ doc: "https://docs.cloud.google.com/" })), "page précise"));
    for (const host of DOC_HOSTS) assert.ok(!has(errorsOf(good({ doc: `https://${host}/une/page#ancre` })), "doc"), host);
  });
});

describe("validateBank : sujets et équilibre", () => {
  test("signale une clé de sujet invalide ou un libellé vide", () => {
    const r = validateBank({ DOMAINS: DOM, TOPICS: { "Mauvaise Clé": "x", ok: "  " }, QUESTIONS: [] });
    assert.ok(has(r.errors, "TOPICS.Mauvaise Clé"));
    assert.ok(has(r.errors, "TOPICS.ok"));
  });
  test("avertit d'un sujet déclaré sans question, sans échouer", () => {
    const r = validateBank(bank());
    assert.ok(r.warnings.some(w => w.includes("« gke »")));
    assert.deepEqual(r.errors, []);
  });
  test("compte les questions par sujet et par difficulté", () => {
    const r = validateBank(bank(good(), good({ id: "d1-02", difficulty: 1 }), good({ id: "d2-01", domain: 2, topic: "gke", difficulty: 3 })));
    assert.deepEqual(r.perTopic, { iam: 2, gke: 1 });
    assert.deepEqual(r.perDifficulty, { 1: 1, 2: 1, 3: 1 });
  });
  test("avertit d'une difficulté très rare dans une banque d'au moins 30 questions", () => {
    const qs = Array.from({ length: 30 }, (_, i) => good({ id: `d${i % 2 + 1}-${String(i).padStart(2, "0")}`, domain: i % 2 + 1 }));
    const r = validateBank(bank(...qs));
    assert.ok(r.warnings.some(w => w.includes("difficulté 1")));
    assert.ok(r.warnings.some(w => w.includes("difficulté 3")));
  });
});

describe("validateBank : seuil de rareté d'une difficulté", () => {
  // 30 questions : `rare` de difficulté 1, `rare` de difficulté 3, le reste de difficulté 2.
  const warnsFor = rare => {
    const qs = Array.from({ length: 30 }, (_, i) => good({ id: `d${i % 2 + 1}-${String(i).padStart(2, "0")}`, domain: i % 2 + 1, difficulty: i < rare ? 1 : i < 2 * rare ? 3 : 2 }));
    return validateBank(bank(...qs)).warnings.filter(w => w.startsWith("difficulté"));
  };
  test("3 questions sur 30 (10 %) : avertissement ; 5 sur 30 (17 %) : aucun", () => {
    assert.equal(warnsFor(3).length, 2);
    assert.equal(warnsFor(5).length, 0);
  });
});

describe("validateBank : règles existantes", () => {
  test("id manquant, en double ou ne suivant pas le domaine", () => {
    assert.ok(has(errorsOf(good({ id: "" })), "id manquant"));
    assert.ok(has(errorsOf(good(), good()), "id en double"));
    assert.ok(has(errorsOf(good({ id: "d2-01" })), "l'id devrait suivre le motif d1-NN"));
  });
  test("options : 4 ou 5, sans doublon, correct dans les bornes", () => {
    assert.ok(has(errorsOf(good({ options: ["a", "b", "c"] })), "4 ou 5"));
    assert.ok(has(errorsOf(good({ options: ["a", "A", "c", "d"] })), "options en double"));
    assert.ok(has(errorsOf(good({ correct: [4] })), "hors bornes"));
    assert.ok(has(errorsOf(good({ correct: [] })), "tableau non vide"));
    assert.ok(has(errorsOf(good({ correct: [0, 0] })), "index en double"));
  });
  test("backtick non fermé et référence à une option par sa lettre", () => {
    assert.ok(has(errorsOf(good({ q: "Lance `gcloud" })), "backtick non fermé"));
    assert.ok(has(errorsOf(good({ explain: "La réponse B est juste." })), "par sa lettre"));
  });
  test("les erreurs de métadonnées sont rapportées même si les options sont invalides", () => {
    const e = errorsOf(good({ options: ["a"], topic: "inconnu" }));
    assert.ok(has(e, "4 ou 5") && has(e, "topic inconnu"));
  });
});
