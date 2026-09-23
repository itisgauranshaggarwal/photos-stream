import { supabase } from "../supabase.js";
import { el, clear } from "../lib/dom.js";
import { toast, toastError } from "../components/toast.js";
import { authError, friendlyError } from "../lib/errors.js";
import { showField, clearField, autoClear } from "../lib/form.js";

/**
 * Login view — username-first.
 *  · Sign in: "Username or email" + password (username resolved via
 *    the email_for_login RPC; email is a hidden key).
 *  · Sign up: pick a username (+ optional display name), email is
 *    collected once as the account key, password ≥ 6 chars.
 *  · Forgot: sends a recovery link (Supabase emails a reset URL).
 */
export async function mount(container) {
  clear(container);

  if (supabase) {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      location.hash = "#/feed";
      return;
    }
  }

  let mode = "in"; // "in" | "up" | "reset"

  const card = el("div", "auth-card");
  const heading = el("h1", null, "Sign in to PhotoStream");
  const form = el("div", "auth-form");
  const switchBox = el("div", "auth-switch");
  card.append(heading, form, switchBox);
  container.appendChild(card);

  function buildSwitch() {
    clear(switchBox);
    if (mode === "in") {
      const btn = el("button", null, "New here? Create an account");
      btn.type = "button";
      btn.addEventListener("click", () => {
        mode = "up";
        rerender();
      });
      switchBox.appendChild(btn);
    } else if (mode === "up") {
      const btn = el("button", null, "Already have an account? Sign in");
      btn.type = "button";
      btn.addEventListener("click", () => {
        mode = "in";
        rerender();
      });
      switchBox.appendChild(btn);
    }
  }

  function rerender() {
    clear(form);
    heading.textContent =
      mode === "in" ? "Sign in to PhotoStream" : mode === "up" ? "Create an account" : "Account recovery";
    buildSwitch();

    const submit = el("button", "pill pill-primary pill-wide", "");
    submit.type = "button";

    if (mode === "reset") {
      const idField = el("div", "field");
      const label = el("label", null, "Username or email");
      label.setAttribute("for", "a-ident");
      const ident = document.createElement("input");
      ident.className = "input";
      ident.id = "a-ident";
      ident.autocomplete = "username";
      ident.placeholder = "your username…";
      idField.append(label, ident);
      submit.textContent = "Send reset link";

      const back = el("div", "auth-switch");
      const backBtn = el("button", null, "Back to sign in");
      backBtn.type = "button";
      backBtn.addEventListener("click", () => { mode = "in"; rerender(); });
      back.appendChild(backBtn);

      form.append(idField, el("div", "auth-actions"));
      const actionsEl = form.querySelector(".auth-actions");
      actionsEl.appendChild(submit);
      actionsEl.appendChild(back);

      submit.addEventListener("click", async () => {
        if (!supabase) return toastError("Supabase not configured yet.");
        const identifier = ident.value.trim();
        if (!identifier) {
          showField(idField, ident, "Enter your username or email.");
          autoClear(idField, ident);
          return;
        }
        try {
          const email = await resolveEmail(identifier);
          if (!email || !email.includes("@")) {
            showField(idField, ident, "No account found for that username.");
            return;
          }
          const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: location.origin + "#/set-password",
          });
          if (error) throw error;
          toast("Reset link sent — check your inbox.", "ok");
          mode = "in";
          rerender();
        } catch (err) {
          console.error(err);
          toastError(friendlyError(err, "Couldn’t send the reset link."));
        }
      });
      return;
    }

    const mkField = (id, labelText, type, placeholder, opts = {}) => {
      const wrap = el("div", "field");
      const lb = el("label", null, labelText);
      lb.setAttribute("for", id);
      const input = document.createElement("input");
      input.className = "input";
      input.type = type;
      input.id = id;
      input.placeholder = placeholder;
      if (opts.autocomplete) input.autocomplete = opts.autocomplete;
      if (opts.maxLength) input.maxLength = opts.maxLength;
      const err = el("p", "field-error", "");
      err.setAttribute("role", "alert");
      err.hidden = true;
      wrap.append(lb, input, err);
      return { wrap, input, err };
    };

    if (mode === "up") {
      const { wrap: uWrap, input: username } = mkField("a-user", "Your username", "text", "e.g. @harper", { autocomplete: "username", maxLength: 20 });
      const { wrap: dWrap, input: display } = mkField("a-name", "Display name (optional)", "text", "Shown on your stamps", { maxLength: 40 });
      const { wrap: eWrap, input: email } = mkField("a-email", "Email (your hidden key)", "email", "Only used to sign in again", { autocomplete: "email" });
      const { wrap: pWrap, input: password } = mkField("a-pass", "Password", "password", "At least 6 characters", { autocomplete: "new-password" });
      const { wrap: cWrap, input: confirm } = mkField("a-confirm", "Repeat password", "password", "Same again", { autocomplete: "new-password" });
      username.style.textTransform = "none";

      const actionsEl = el("div", "auth-actions");
      submit.textContent = "Create account";
      actionsEl.appendChild(submit);
      form.append(uWrap, dWrap, eWrap, pWrap, cWrap, actionsEl);

      submit.addEventListener("click", async () => {
        if (!supabase) return toastError("Supabase not configured yet.");
        const uname = (username.value || "").trim().toLowerCase().replace(/^@/, "");
        const dname = (display.value || "").trim() || uname;
        const mail = (email.value || "").trim().toLowerCase();
        const pass = password.value;

        clearField(uWrap, username);
        clearField(eWrap, email);
        clearField(pWrap, password);
        clearField(cWrap, confirm);

        let ok = true;
        if (!uname) ok = showField(uWrap, username, "Pick a username.") && ok;
        else if (!/^[a-z0-9_.]{2,20}$/.test(uname)) ok = showField(uWrap, username, "Username: 2–20 letters, numbers, underscores, dots.") && ok;
        if (!mail) ok = showField(eWrap, email, "We need your email as a sign-in key.") && ok;
        if (pass.length < 6) ok = showField(pWrap, password, "Password must be at least 6 characters.") && ok;
        if (pass !== confirm.value) ok = showField(cWrap, confirm, "Passwords don’t match.") && ok;
        if (!ok) {
          autoClear(uWrap, username);
          autoClear(eWrap, email);
          autoClear(pWrap, password);
          autoClear(cWrap, confirm);
          return;
        }
        try {
          const { data: clash } = await supabase
            .from("profiles")
            .select("id")
            .eq("username", uname)
            .maybeSingle();
          if (clash) {
            showField(uWrap, username, "That username’s taken — try another.");
            return;
          }
          const { data: signUpData, error } = await supabase.auth.signUp({
            email: mail,
            password: pass,
            options: { data: { full_name: dname, user_name: uname } },
          });
          if (error) throw error;
          if (signUpData?.session?.user) {
            toast("Account created — welcome!", "ok");
            location.hash = "#/feed";
          } else {
            toast(
              "Account created — now confirm the email we just sent, then sign in.",
              "ok"
            );
            mode = "in";
            rerender();
          }
        } catch (err) {
          console.error(err);
          toastError(authError(err, "Couldn’t create the account."));
        }
      });
      return;
    }

    // mode === "in"
    const { wrap: iWrap, input: ident } = mkField("a-ident", "Username or email", "text", "your username…", { autocomplete: "username" });
    const { wrap: pWrap, input: password } = mkField("a-pass", "Password", "password", "Your password", { autocomplete: "current-password" });

    const actionsEl = el("div", "auth-actions");
    submit.textContent = "Sign in";
    const forgot = el("button", null, "Forgot password?");
    forgot.type = "button";
    forgot.className = "auth-forgot";
    forgot.addEventListener("click", () => {
      mode = "reset";
      rerender();
    });
    actionsEl.append(submit, forgot);
    form.append(iWrap, pWrap, actionsEl);

    submit.addEventListener("click", async () => {
      if (!supabase) return toastError("Supabase not configured yet.");
      const identifier = ident.value.trim();
      const pass = password.value;

      clearField(iWrap, ident);
      clearField(pWrap, password);
      let ok = true;
      if (!identifier) ok = showField(iWrap, ident, "Enter your username or email.") && ok;
      if (!pass) ok = showField(pWrap, password, "Enter your password.") && ok;
      if (!ok) {
        autoClear(iWrap, ident);
        autoClear(pWrap, password);
        return;
      }
      try {
        const email = await resolveEmail(identifier);
        if (!email || !email.includes("@")) {
          showField(iWrap, ident, "No account found for that username or email.");
          return;
        }
        const { error } = await supabase.auth.signInWithPassword({ email, password: pass });
        if (error) throw error;
        toast("Welcome back.", "ok");
        location.hash = "#/feed";
      } catch (err) {
        console.error(err);
        toastError(authError(err, "Couldn’t sign in."));
      }
    });
  }

  async function resolveEmail(identifier) {
    if (!supabase) return null;
    const { data, error } = await supabase.rpc("email_for_login", {
      p_identifier: identifier.trim(),
    });
    if (error) {
      console.error(error);
      if (error.message?.includes("email_for_login")) {
        toastError("Auth helper missing — run db/05_login.sql first.");
        return null;
      }
    }
    return data;
  }

  rerender();
}