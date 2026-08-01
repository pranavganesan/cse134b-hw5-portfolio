/*
  Part 2: <gh-activity> — a custom element that fetches a user's most recently
  updated public repositories from the unauthenticated (keyless) GitHub REST
  API and renders them as a semantic list.

  Attributes:
    user  — GitHub username to fetch (default "pranavganesan")
    count — how many repos to show, 1–10 (default 5)
  Both are observed: changing either in DevTools refetches and re-renders.

  State is reflected to the DOM via data-state="idle|loading|ready|error" so
  CSS can respond. Rendering clones two <template> elements and fills them
  with textContent/setAttribute only — remote strings never touch innerHTML,
  so a malicious repo description can't inject markup or script.
*/

const ENDPOINT = "https://api.github.com";
const TIMEOUT_MS = 8000;
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 min: be polite to the public API

function cacheRead(key) {
  try {
    const raw = sessionStorage.getItem(key);
    if (!raw) return null;
    const entry = JSON.parse(raw);
    if (Date.now() - entry.time > CACHE_TTL_MS) {
      sessionStorage.removeItem(key);
      return null;
    }
    return entry.data;
  } catch {
    return null; // storage unavailable or corrupted — just refetch
  }
}

function cacheWrite(key, data) {
  try {
    sessionStorage.setItem(key, JSON.stringify({ time: Date.now(), data }));
  } catch {
    // Storage full/blocked — caching is an optimization, not a requirement.
  }
}

class GhActivity extends HTMLElement {
  static observedAttributes = ["user", "count"];

  #controller = null;
  #upgraded = false;
  #status = null;
  #list = null;
  #retry = null;

  get user() {
    return this.getAttribute("user") || "pranavganesan";
  }

  get count() {
    const n = Number.parseInt(this.getAttribute("count"), 10);
    return Number.isInteger(n) && n >= 1 && n <= 10 ? n : 5;
  }

  connectedCallback() {
    if (!this.#upgraded) {
      const tpl = document.getElementById("gh-activity-template");
      if (!tpl) return; // template missing — leave fallback content in place
      // Replace the no-JS fallback with the widget shell, cloned from <template>.
      this.replaceChildren(tpl.content.cloneNode(true));
      this.#status = this.querySelector(".gh-status");
      this.#list = this.querySelector(".gh-repos");
      this.#retry = this.querySelector(".gh-retry");
      this.#retry.addEventListener("click", () => this.load());
      this.#upgraded = true;
    }
    this.load();
  }

  disconnectedCallback() {
    // Cancel any in-flight request so a detached element does no work.
    this.#controller?.abort();
  }

  attributeChangedCallback(name, oldValue, newValue) {
    // Fires before connectedCallback for initial attributes; only refetch on
    // real runtime changes to an already-upgraded element.
    if (this.#upgraded && oldValue !== newValue) {
      this.load();
    }
  }

  #setState(state, message) {
    this.setAttribute("data-state", state);
    this.#status.textContent = message;
    this.#retry.hidden = state !== "error";
  }

  async load() {
    const user = this.user;
    const count = this.count;
    const cacheKey = `gh-activity:${user}:${count}`;

    // Abort any previous request before starting a new one.
    this.#controller?.abort();
    this.#controller = new AbortController();

    const cached = cacheRead(cacheKey);
    if (cached) {
      this.#render(cached, user);
      return;
    }

    this.#setState("loading", `Loading ${user}'s recent repositories`);
    this.#list.replaceChildren();

    try {
      const url = `${ENDPOINT}/users/${encodeURIComponent(user)}/repos?sort=updated&per_page=${count}`;
      const response = await fetch(url, {
        headers: { Accept: "application/vnd.github+json" },
        // Abort on disconnect/refetch OR after a timeout, whichever first.
        signal: AbortSignal.any([
          this.#controller.signal,
          AbortSignal.timeout(TIMEOUT_MS)
        ])
      });

      if (!response.ok) {
        throw new Error(`GitHub responded with ${response.status}`);
      }

      const repos = (await response.json()).map((repo) => ({
        name: repo.name,
        url: repo.html_url,
        description: repo.description,
        language: repo.language,
        stars: repo.stargazers_count,
        updated: repo.updated_at
      }));

      cacheWrite(cacheKey, repos);
      this.#render(repos, user);
    } catch (error) {
      if (error.name === "AbortError") return; // superseded or detached
      const why = error.name === "TimeoutError"
        ? "the request timed out"
        : "the request failed";
      this.#setState("error", `Couldn't load GitHub activity — ${why}. `);
    }
  }

  // Builds one semantic list item (<li> with link, description, and metadata)
  // entirely with DOM creation — same shape as #gh-repo-template.
  #buildItem() {
    const li = document.createElement("li");
    const link = document.createElement("a");
    link.className = "gh-name";
    const desc = document.createElement("p");
    desc.className = "gh-desc";
    const meta = document.createElement("p");
    meta.className = "gh-meta";
    const lang = document.createElement("span");
    lang.className = "gh-lang";
    const stars = document.createElement("span");
    stars.className = "gh-stars";
    const time = document.createElement("time");
    time.className = "gh-updated";
    meta.append(lang, " ", stars, " ", time);
    li.append(link, desc, meta);
    const fragment = document.createDocumentFragment();
    fragment.append(li);
    return fragment;
  }

  #render(repos, user) {
    this.#list.replaceChildren();

    if (repos.length === 0) {
      // Empty result set: distinct idle/empty state, not an error.
      this.#setState("idle", `${user} has no public repositories yet.`);
      return;
    }

    const itemTpl = document.getElementById("gh-repo-template");
    for (const repo of repos) {
      // Preferred path: clone the <li> structure from the page's <template>.
      // Fallback: build the same semantic <li> record with createElement so
      // the list still renders if the host page omits the item template.
      const item = itemTpl ? itemTpl.content.cloneNode(true) : this.#buildItem();

      const link = item.querySelector(".gh-name");
      link.textContent = repo.name;
      link.setAttribute("href", repo.url);

      item.querySelector(".gh-desc").textContent =
        repo.description || "No description provided.";
      item.querySelector(".gh-lang").textContent = repo.language || "—";
      item.querySelector(".gh-stars").textContent = `★ ${repo.stars}`;

      const time = item.querySelector(".gh-updated");
      const updated = new Date(repo.updated);
      time.setAttribute("datetime", repo.updated);
      time.textContent = `updated ${updated.toLocaleDateString()}`;

      this.#list.append(item);
    }

    this.#setState("ready", `${repos.length} most recently updated repositories for ${user}:`);
  }
}

customElements.define("gh-activity", GhActivity);
