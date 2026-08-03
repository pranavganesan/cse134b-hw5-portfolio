/*
  Brutalist aesthetic — JS enhancement (home page only).

  What it does: a "View Raw HTML" toggle that reveals the page's own
  current outerHTML in a terminal-styled panel. The idea is pretty literally
  the assignment prompt — most sites go out of their way to hide the medium
  (the markup) behind the message (the styled page); this one lets you flip
  that inside out on demand. See AESTHETIC.md for the fuller reflection.

  Progressive enhancement, same pattern as js/theme.js elsewhere on this
  site: the button ships with the `hidden` attribute in index.njk, and this
  module only removes it once the click handler is actually wired up — so
  with JavaScript off, there's no dead control sitting on the page, and
  every other section of the home page (projects, GitHub feed's own
  noscript fallback, About Me) is completely unaffected.
*/

const toggle = document.querySelector(".raw-toggle");
const panel = document.querySelector("#raw-output");
const STORAGE_KEY = "brutalist-raw-open";

if (toggle && panel) {
  function readSaved() {
    try {
      return localStorage.getItem(STORAGE_KEY) === "1";
    } catch {
      return false; // storage unavailable — just start closed
    }
  }

  function save(open) {
    try {
      if (open) {
        localStorage.setItem(STORAGE_KEY, "1");
      } else {
        localStorage.removeItem(STORAGE_KEY);
      }
    } catch {
      // Blocked/full/private-mode storage: the toggle still works for this
      // page view, it just won't be remembered on the next visit.
    }
  }

  function fillPanel() {
    // Security note (same reasoning as gh-activity.js): this is untrusted-
    // shaped content in the sense that it includes markup, so it goes in
    // through textContent, never innerHTML. textContent makes the browser
    // treat the whole outerHTML string as literal text to display, not as
    // markup to parse and execute — the raw <script> tags in the output
    // print as visible text and do not run.
    panel.textContent = document.documentElement.outerHTML;
  }

  function setOpen(open) {
    if (open) {
      fillPanel(); // re-capture fresh each time it opens, since the
                    // gh-activity widget mutates the DOM after load
    }
    panel.hidden = !open;
    toggle.setAttribute("aria-expanded", String(open));
    toggle.textContent = open ? "Hide Raw HTML" : "View Raw HTML";
    save(open);
  }

  toggle.setAttribute("aria-expanded", "false");
  toggle.setAttribute("aria-controls", "raw-output");
  toggle.addEventListener("click", () => setOpen(panel.hidden));

  setOpen(readSaved());
  toggle.removeAttribute("hidden");
}
