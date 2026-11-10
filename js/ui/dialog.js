/* Boîte de dialogue intégrée (confirm() est bloqué dans la page) et message furtif de confirmation. */
import { overlay } from "../dom.js";

let lastFocus = null;
export function openDialog(title, body, confirmLabel, action) {
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
export function closeDialog() { overlay.hidden = true; overlay.innerHTML = ""; if (lastFocus && document.contains(lastFocus)) lastFocus.focus(); lastFocus = null; }

let toastTimer = null;
export function toast(msg) {
  let t = document.getElementById("toast");
  if (!t) { t = document.createElement("div"); t.id = "toast"; t.className = "toast"; t.setAttribute("role", "status"); document.body.appendChild(t); }
  t.textContent = msg; t.classList.add("show");
  clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove("show"), 2200);
}
