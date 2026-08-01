/*
  Part 1, Option A: theme picker (progressive enhancement).

  Baseline (no JS): CSS `color-scheme: light dark` + `light-dark()` follow the
  OS preference. The picker <fieldset> ships with the `hidden` attribute, so
  with JS off there is no dead control on the page.

  This module: reveals the control, restores any saved override, applies
  changes by setting `data-theme` on <html> (state the CSS already
  understands — never inline styles), and persists the choice in localStorage
  across pages and reloads. All storage access is wrapped in try/catch so a
  blocked/full/private-mode localStorage never breaks the page.
*/

const STORAGE_KEY = "theme-preference";
const VALID = ["light", "dark"];

function readSaved() {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    return VALID.includes(value) ? value : "system";
  } catch {
    return "system"; // storage unavailable — fall back to OS preference
  }
}

function save(value) {
  try {
    if (value === "system") {
      localStorage.removeItem(STORAGE_KEY);
    } else {
      localStorage.setItem(STORAGE_KEY, value);
    }
  } catch {
    // Storage blocked or quota exceeded: the theme still applies for this
    // page view via data-theme; it just won't persist. Not fatal.
  }
}

function apply(value) {
  const root = document.documentElement;
  if (VALID.includes(value)) {
    root.setAttribute("data-theme", value);
  } else {
    root.removeAttribute("data-theme"); // back to system/auto
  }
}

const picker = document.querySelector(".theme-picker");

if (picker) {
  // Restore saved choice: check the matching radio so the control's state is
  // exposed to assistive technology (radios in a fieldset/legend group).
  const saved = readSaved();
  const savedRadio = picker.querySelector(`input[value="${saved}"]`);
  if (savedRadio) {
    savedRadio.checked = true;
  }

  picker.addEventListener("change", (event) => {
    const value = event.target.value;
    apply(value);
    save(value);
  });

  // Only reveal the control once JS has actually wired it up.
  picker.removeAttribute("hidden");
}
