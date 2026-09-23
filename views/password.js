import { supabase } from "../supabase.js";
import { el, clear } from "../lib/dom.js";
import { toastOk, toastError } from "../components/toast.js";
import { authError } from "../lib/errors.js";
import { showField, clearField, autoClear } from "../lib/form.js";

/**
 * New-password view — lands here after a recovery-link click.
 * Supabase delivers the recovery session via PASSWORD_RECOVERY;
 * we wait for it, then let the user set a fresh password.
 */
export async function mount(container) {
  clear(container);
  const card = el("div", "auth-card");
  const heading = el("h1", null, "Set a new password");
  card.appendChild(heading);

  if (!supabase) {
    card.appendChild(el("p", "empty-state", "Supabase not configured yet."));
    container.appendChild(card);
    return;
  }

  const intro = el("p", "auth-note", "Waiting for your recovery link to verify…");
  card.appendChild(intro);

  const { data: { session } } = await supabase.auth.getSession();
  const ready = !!session?.user;
  if (!ready) {
    intro.textContent = "Confirm your recovery link…";
  }

  const pWrap = el("div", "field");
  const pLabel = el("label", null, "New password");
  pLabel.setAttribute("for", "np-pass");
  const pInput = document.createElement("input");
  pInput.className = "input";
  pInput.type = "password";
  pInput.id = "np-pass";
  pInput.autocomplete = "new-password";
  pInput.placeholder = "At least 6 characters";
  const pErr = el("p", "field-error", "");
  pErr.setAttribute("role", "alert");
  pErr.hidden = true;
  pWrap.append(pLabel, pInput, pErr);

  const cWrap = el("div", "field");
  const cLabel = el("label", null, "Repeat it");
  cLabel.setAttribute("for", "np-confirm");
  const cInput = document.createElement("input");
  cInput.className = "input";
  cInput.type = "password";
  cInput.id = "np-confirm";
  cInput.autocomplete = "new-password";
  const cErr = el("p", "field-error", "");
  cErr.setAttribute("role", "alert");
  cErr.hidden = true;
  cWrap.append(cLabel, cInput, cErr);

  const actions = el("div", "auth-actions");
  const save = el("button", "pill pill-primary pill-wide", "Save password");
  save.type = "button";
  actions.appendChild(save);

  const form = el("div", "auth-form");
  form.append(pWrap, cWrap, actions);
  form.style.display = ready ? "block" : "none";
  card.appendChild(form);
  container.appendChild(card);

  const { data: { subscription } } = supabase.auth.onAuthStateChange((event, activeSession) => {
    const usable = activeSession?.user || event === "PASSWORD_RECOVERY";
    if (!usable) return;
    intro.textContent = "";
    intro.style.display = "none";
    form.style.display = "block";
  });

  let saving = false;
  save.addEventListener("click", async () => {
    if (saving) return;
    const next = pInput.value;
    clearField(pWrap, pInput);
    clearField(cWrap, cInput);
    let ok = true;
    if (next.length < 6) ok = showField(pWrap, pInput, "Password must be at least 6 characters.") && ok;
    if (next !== cInput.value) ok = showField(cWrap, cInput, "Passwords don’t match.") && ok;
    if (!ok) {
      autoClear(pWrap, pInput);
      autoClear(cWrap, cInput);
      return;
    }
    saving = true;
    save.textContent = "Saving…";
    save.disabled = true;
    try {
      const { error } = await supabase.auth.updateUser({ password: next });
      if (error) throw error;
      toastOk("Password updated.");
      subscription.unsubscribe();
      location.hash = "#/feed";
    } catch (err) {
      console.error(err);
      toastError(authError(err, "Couldn’t update the password."));
      saving = false;
      save.textContent = "Save password";
      save.disabled = false;
    }
  });
}