import { supabase } from "../supabase.js";
import { el, clear } from "../lib/dom.js";
import { isImageFile, compressImage } from "../lib/compress.js";
import { getSignedInUser } from "../lib/session.js";
import { emptyState } from "../components/empty.js";
import { toastOk, toastError } from "../components/toast.js";
import { friendlyError } from "../lib/errors.js";
import { showField, clearField, autoClear } from "../lib/form.js";

/**
 * Upload / edit a moment: title + description + 1–25 photos.
 * Photos are compressed to WebP on-device, uploaded to `photos/<uid>/`,
 * then registered as post_photos rows (positions start at 1).
 *
 * Routes:  #/upload (new)  ·  #/edit/:id (own post)
 */
export async function mount(container, params) {
  clear(container);

  const user = await getSignedInUser(supabase);
  if (!user) {
    if (!supabase) {
      toastError("Supabase not configured yet.");
    } else {
      toastError("Sign in to post a moment.");
    }
    location.hash = "#/login";
    return;
  }

  const mode = params.id ? "edit" : "new";
  const existing = []; // edit mode: photos kept on the wall { id, storage_path }
  const pending = []; // new uploads queued { objectUrl, blob }

  const card = el("div", "upload-card");
  card.appendChild(el("h1", null, mode === "edit" ? "Edit moment" : "New moment"));

  const titleField = el("div", "field");
  const titleLabel = el("label", null, "Title");
  titleLabel.setAttribute("for", "u-title");
  const titleInput = document.createElement("input");
  titleInput.className = "input";
  titleInput.id = "u-title";
  titleInput.maxLength = 120;
  titleInput.placeholder = "Give it a line…";
  const titleErr = el("p", "field-error", "");
  titleErr.setAttribute("role", "alert");
  titleErr.hidden = true;
  titleField.append(titleLabel, titleInput, titleErr);

  const descField = el("div", "field");
  const descLabel = el("label", null, "Description");
  descLabel.setAttribute("for", "u-desc");
  const descInput = document.createElement("textarea");
  descInput.className = "input";
  descInput.id = "u-desc";
  descInput.rows = 4;
  descInput.maxLength = 2000;
  descInput.placeholder = "The words on the back of the postcard…";
  descField.append(descLabel, descInput);

  const grid = el("div", "upload-grid");

  // Phone/tablet: offer camera, gallery and files separately (native
  // pickers differ). Desktop: a single browse control is enough.
  const touch = window.matchMedia("(pointer: coarse)").matches;

  function sourceFileInput(accept, multiple, capture) {
    const input = document.createElement("input");
    input.type = "file";
    input.hidden = true;
    if (accept) input.accept = accept;
    if (multiple) input.multiple = true;
    if (capture) input.setAttribute("capture", capture);
    input.addEventListener("change", () => pickFiles([...input.files], input));
    source.appendChild(input);
    return input;
  }
  function sourceButton(label, input) {
    const btn = el("button", "source-opt", label);
    btn.type = "button";
    btn.addEventListener("click", () => input.click());
    source.appendChild(btn);
  }

  const source = el("div", "upload-source");
  source.appendChild(el("span", "source-kicker", "Add from"));
  const sources = touch
    ? [
        ["Take a photo", sourceFileInput("image/*", false, "environment")],
        ["From gallery", sourceFileInput("image/*", true)],
        ["Browse files", sourceFileInput("", true)],
      ]
    : [["Browse files", sourceFileInput("image/*", true)]];

  sources.forEach(([label, input], i) => {
    if (i > 0) source.appendChild(el("span", "source-opt-sep", "·"));
    sourceButton(label, input);
  });

  const count = el("div", "upload-count", "0 / 25 photos");
  const countErr = el("p", "field-error upload-count-err", "");
  countErr.setAttribute("role", "alert");
  countErr.hidden = true;
  const submit = el("button", "pill pill-primary pill-wide", mode === "edit" ? "Save changes" : "Post it");
  submit.type = "button";

  const actions = el("div", "auth-actions");
  actions.appendChild(submit);

  card.append(titleField, descField, source, grid, count, countErr, actions);
  container.appendChild(card);

  const total = () => existing.length + pending.length;
  const refreshCount = () => (count.textContent = `${total()} / 25 photos`);

  async function pickFiles(files, input) {
    for (const file of files) {
      if (total() >= 25) break;
      if (!isImageFile(file)) {
        toastError(`${file.name || "That file"} isn’t a photo.`);
        continue;
      }
      const result = await compressImage(file);
      if (!result) {
        toastError(`Couldn’t compress ${file.name || "that photo"}.`);
        continue;
      }
      const objectUrl = URL.createObjectURL(result.blob);
      pending.push({ objectUrl, blob: result.blob });

      const tile = el("div", "tile");
      const tileImg = document.createElement("img");
      tileImg.src = objectUrl;
      tileImg.alt = "New photo";
      const rm = el("button", "tile-rm", "×");
      rm.type = "button";
      rm.addEventListener("click", () => {
        const idx = pending.findIndex((p) => p.objectUrl === objectUrl);
        if (idx !== -1) pending.splice(idx, 1);
        URL.revokeObjectURL(objectUrl);
        tile.remove();
        refreshCount();
      });
      tile.append(tileImg, rm);
      grid.appendChild(tile);
      refreshCount();
    }
    if (input) input.value = "";
  }

  if (mode === "edit") {
    try {
      const { data: postRow, error: postErr } = await supabase
        .from("posts")
        .select("title, description, author_id")
        .eq("id", params.id)
        .single();
      if (postErr) throw postErr;
      if (postRow.author_id !== user.id) {
        toastError("You can only edit your own moments.");
        location.hash = "#/me";
        return;
      }
      titleInput.value = postRow.title;
      descInput.value = postRow.description || "";

      const { data: photos, error: photosErr } = await supabase
        .from("post_photos")
        .select("id, storage_path")
        .eq("post_id", params.id)
        .order("position");
      if (photosErr) throw photosErr;

      for (const p of photos) {
        existing.push({ id: p.id, storage_path: p.storage_path });
        const tile = el("div", "tile");
        const tileImg = document.createElement("img");
        tileImg.alt = "Photo";
        tile.appendChild(tileImg);
        const signed = await supabase.storage.from("photos").createSignedUrl(p.storage_path, 3600);
        tileImg.src = (signed.data?.signedUrl) || "";

        const rm = el("button", "tile-rm", "×");
        rm.type = "button";
        rm.addEventListener("click", async () => {
          const idx = existing.findIndex((e) => e.id === p.id);
          if (idx === -1) return;
          const { data: userRow } = await supabase
            .from("profiles")
            .select("id")
            .eq("id", user.id)
            .single();
          if (!userRow) return toastError("Not signed in.");
          const { error: rmErr } = await supabase.storage
            .from("photos")
            .remove([p.storage_path]);
          if (rmErr) {
            toastError("Couldn’t remove that photo.");
            return;
          }
          const { error: delErr } = await supabase
            .from("post_photos")
            .delete()
            .eq("id", p.id);
          if (delErr) {
            toastError("Couldn’t remove that photo.");
            return;
          }
          existing.splice(idx, 1);
          tile.remove();
          refreshCount();
        });
        tile.appendChild(rm);
        grid.appendChild(tile);
      }
      refreshCount();
    } catch (err) {
      console.error(err);
      clear(container);
      container.appendChild(
        emptyState(friendlyError(err, "Couldn’t load that moment."), {
          retryLabel: "Try again",
          onRetry: () => mount(container, params),
        })
      );
      return;
    }
  }

  let busy = false;
  submit.addEventListener("click", async () => {
    if (busy) return;
    if (!supabase) return toastError("Supabase not configured yet.");
    const theTitle = titleInput.value.trim();
    clearField(titleField, titleInput);
    countErr.hidden = true;
    let ok = true;
    if (!theTitle) ok = showField(titleField, titleInput, "Give the moment a title.") && ok;
    if (total() < 1) {
      countErr.textContent = "Add at least one photo.";
      countErr.hidden = false;
      ok = false;
    }
    if (!ok) {
      autoClear(titleField, titleInput);
      return;
    }
    busy = true;
    submit.textContent = mode === "edit" ? "Saving…" : "Posting…";
    submit.disabled = true;

    try {
      const paths = [];
      for (const p of pending) {
        const path = `${user.id}/${crypto.randomUUID()}.webp`;
        const { error: upErr } = await supabase.storage
          .from("photos")
          .upload(path, p.blob, { contentType: "image/webp" });
        if (upErr) throw new Error("[storage] " + upErr.message);
        paths.push(path);
      }

      if (mode === "new") {
        const { data: postRow, error: insErr } = await supabase
          .from("posts")
          .insert({
            author_id: user.id,
            title: theTitle,
            description: descInput.value.trim(),
            cover_full: paths[0] || "",
          })
          .select("id")
          .single();
        if (insErr) throw new Error("[db] " + insErr.message);

        if (paths.length) {
          const { error: phErr } = await supabase.from("post_photos").insert(
            paths.map((storagePath, i) => ({
              post_id: postRow.id,
              storage_path: storagePath,
              position: i + 1,
            }))
          );
          if (phErr) throw new Error("[db] " + phErr.message);
        }
        toastOk("Moment posted!");
        location.hash = `#/post/${postRow.id}`;
      } else {
        const { error: upErr } = await supabase
          .from("posts")
          .update({
            title: theTitle,
            description: descInput.value.trim(),
            cover_full: paths[0] || existing[0]?.storage_path || "",
          })
          .eq("id", params.id);
        if (upErr) throw upErr;

        if (paths.length) {
          const { data: rows } = await supabase
            .from("post_photos")
            .select("position")
            .eq("post_id", params.id);
          let start = 1;
          for (const r of rows ?? []) start = Math.max(start, r.position + 1);
          const { error: phErr } = await supabase.from("post_photos").insert(
            paths.map((storagePath, i) => ({
              post_id: params.id,
              storage_path: storagePath,
              position: start + i,
            }))
          );
          if (phErr) throw phErr;
        }
        toastOk("Moment updated.");
        location.hash = `#/post/${params.id}`;
      }
    } catch (err) {
      console.error(err);
      const msg = err.message || "";
      if (msg.startsWith("[storage]") || /bucket/i.test(msg) || /resource was not found/i.test(msg))
        toastError(
          "Photo upload failed — make sure the bucket is named exactly `photos` and db/04_storage.sql ran."
        );
      else if (/policy|permission|row-level|rls/i.test(msg))
        toastError("Permission error — rerun db/04_storage.sql (authenticated upload policy).");
      else if (/foreign key|profile/i.test(msg))
        toastError("No profile row for this account — check the sign-up trigger.");
      else toastError(msg.replace(/^\[(storage|db)\] /, "") || "Couldn’t save that moment.");
      busy = false;
      submit.textContent = mode === "edit" ? "Save changes" : "Post it";
      submit.disabled = false;
    }
  });
}