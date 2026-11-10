import { test, describe, afterEach } from "node:test";
import assert from "node:assert/strict";
import { KEYS, STORAGE_VERSION } from "../js/config.js";
import { store, migrateStorage } from "../js/storage.js";

// localStorage minimal en mémoire ; `broken` simule un stockage indisponible (navigation privée, quota…).
function fakeStorage(broken = false) {
  const data = new Map();
  const fail = () => { throw new Error("indisponible"); };
  return {
    data,
    getItem: k => broken ? fail() : (data.has(k) ? data.get(k) : null),
    setItem: (k, v) => broken ? fail() : void data.set(k, String(v)),
    removeItem: k => broken ? fail() : void data.delete(k)
  };
}
const original = Object.getOwnPropertyDescriptor(globalThis, "localStorage");
const install = ls => Object.defineProperty(globalThis, "localStorage", { value: ls, configurable: true, writable: true });
afterEach(() => { original ? Object.defineProperty(globalThis, "localStorage", original) : delete globalThis.localStorage; });

describe("store", () => {
  test("écrit et relit du JSON", () => {
    install(fakeStorage());
    store.set("k", { a: [1, 2], b: "é" });
    assert.deepEqual(store.get("k"), { a: [1, 2], b: "é" });
  });
  test("renvoie null pour une clé absente ou un JSON corrompu", () => {
    const ls = fakeStorage(); install(ls);
    assert.equal(store.get("absent"), null);
    ls.setItem("mauvais", "{pas du json");
    assert.equal(store.get("mauvais"), null);
  });
  test("del supprime la clé", () => {
    install(fakeStorage());
    store.set("k", 1); store.del("k");
    assert.equal(store.get("k"), null);
  });
  test("ne lève aucune erreur si le stockage est indisponible", () => {
    install(fakeStorage(true));
    assert.doesNotThrow(() => { store.set("k", 1); store.del("k"); });
    assert.equal(store.get("k"), null);
  });
  test("ne lève aucune erreur si localStorage n'existe pas du tout", () => {
    delete globalThis.localStorage;
    assert.doesNotThrow(() => { store.set("k", 1); store.del("k"); store.get("k"); migrateStorage(); });
  });
});

describe("migrateStorage", () => {
  const seed = ls => {
    for (const k of ["exam", "practice", "history", "stats", "activity", "profile"]) ls.setItem(KEYS[k], JSON.stringify({ k }));
  };
  test("version différente : purge la progression, conserve le profil, enregistre la version", () => {
    const ls = fakeStorage(); install(ls); seed(ls);
    ls.setItem(KEYS.version, JSON.stringify(STORAGE_VERSION - 1));
    migrateStorage();
    for (const k of ["exam", "practice", "history", "stats", "activity"]) assert.equal(store.get(KEYS[k]), null, k);
    assert.deepEqual(store.get(KEYS.profile), { k: "profile" });
    assert.equal(store.get(KEYS.version), STORAGE_VERSION);
  });
  test("première utilisation (aucune version) : même purge, version enregistrée", () => {
    const ls = fakeStorage(); install(ls); seed(ls);
    migrateStorage();
    assert.equal(store.get(KEYS.stats), null);
    assert.equal(store.get(KEYS.version), STORAGE_VERSION);
  });
  test("même version : ne touche à rien", () => {
    const ls = fakeStorage(); install(ls); seed(ls);
    ls.setItem(KEYS.version, JSON.stringify(STORAGE_VERSION));
    migrateStorage();
    for (const k of ["exam", "practice", "history", "stats", "activity", "profile"]) assert.deepEqual(store.get(KEYS[k]), { k }, k);
  });
});
