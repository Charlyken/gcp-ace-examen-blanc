import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { installMode, isIOS, installText } from "../js/install.js";

const env = (over = {}) => ({ standalone: false, canPrompt: false, ios: false, secure: true, ...over });

describe("installMode", () => {
  test("application déjà installée : prioritaire sur tout le reste", () => {
    assert.equal(installMode(env({ standalone: true, canPrompt: true, ios: true })), "installed");
    assert.equal(installMode(env({ standalone: true, secure: false })), "installed");
  });
  test("connexion non sécurisée : installation indisponible", () => {
    assert.equal(installMode(env({ secure: false, canPrompt: true, ios: true })), "unavailable");
  });
  test("invite d'installation disponible (Chrome, Edge) : bouton", () => {
    assert.equal(installMode(env({ canPrompt: true })), "prompt");
  });
  test("iPhone ou iPad sans invite : étapes via Safari", () => {
    assert.equal(installMode(env({ ios: true })), "ios");
  });
  test("autre navigateur : instruction manuelle", () => {
    assert.equal(installMode(env()), "manual");
  });
});

describe("isIOS", () => {
  test("iPhone, iPad et iPod", () => {
    assert.equal(isIOS("Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)", "iPhone", 5), true);
    assert.equal(isIOS("Mozilla/5.0 (iPad; CPU OS 16_0 like Mac OS X)", "iPad", 5), true);
    assert.equal(isIOS("Mozilla/5.0 (iPod touch; CPU iPhone OS 15_0)", "", 0), true);
  });
  test("iPadOS se présente comme un Mac tactile", () => {
    assert.equal(isIOS("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)", "MacIntel", 5), true);
  });
  test("Mac classique, Android, Windows : non", () => {
    assert.equal(isIOS("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)", "MacIntel", 0), false);
    assert.equal(isIOS("Mozilla/5.0 (Linux; Android 14; Pixel 8)", "Linux armv8l", 5), false);
    assert.equal(isIOS("Mozilla/5.0 (Windows NT 10.0; Win64; x64)", "Win32", 0), false);
  });
  test("valeurs absentes", () => { assert.equal(isIOS(), false); });
});

describe("installText", () => {
  test("bouton seulement quand l'invite est disponible", () => {
    for (const m of ["installed", "ios", "manual", "unavailable"]) assert.equal(installText(m, true).button, "", m);
    assert.equal(installText("prompt", true).button, "Installer");
  });
  test("étapes seulement pour iOS (3 étapes, Partager puis écran d'accueil)", () => {
    const t = installText("ios", false);
    assert.equal(t.steps.length, 3);
    assert.match(t.steps[0], /Partager/); assert.match(t.steps[1], /écran d'accueil/);
    for (const m of ["installed", "prompt", "manual", "unavailable"]) assert.deepEqual(installText(m, true).steps, [], m);
  });
  test("mention du mode hors ligne selon l'état du service worker", () => {
    assert.match(installText("prompt", true).text, /fonctionne hors ligne/);
    assert.match(installText("prompt", false).text, /après le premier chargement/);
    assert.match(installText("installed", true).text, /hors ligne/);
  });
  test("titres", () => {
    assert.equal(installText("installed", true).title, "Application installée");
    assert.equal(installText("unavailable", false).title, "Installation indisponible");
    assert.match(installText("unavailable", false).text, /HTTPS/);
  });
});
