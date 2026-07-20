const state = {
  prompts: [],
  query: "",
  category: "All",
  sort: "featured"
};

const els = {
  grid: document.querySelector("#prompt-grid"),
  template: document.querySelector("#prompt-template"),
  search: document.querySelector("#search"),
  filters: document.querySelector("#filters"),
  sort: document.querySelector("#sort"),
  summary: document.querySelector("#result-summary"),
  empty: document.querySelector("#empty-state"),
  clear: document.querySelector("#clear-filters"),
  promptCount: document.querySelector("#prompt-count"),
  categoryCount: document.querySelector("#category-count"),
  modelCount: document.querySelector("#model-count")
};

async function loadPrompts() {
  try {
    const response = await fetch("prompts.json");
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    state.prompts = await response.json();
    renderFilters();
    renderStats();
    render();
  } catch (error) {
    els.grid.innerHTML = `<p>Could not load the prompt library. ${escapeHtml(error.message)}</p>`;
  }
}

function renderStats() {
  els.promptCount.textContent = state.prompts.length;
  els.categoryCount.textContent = new Set(state.prompts.map(p => p.category)).size;
  els.modelCount.textContent = new Set(state.prompts.map(p => p.model)).size;
}

function renderFilters() {
  const categories = ["All", ...new Set(state.prompts.map(p => p.category).sort())];
  els.filters.replaceChildren(...categories.map(category => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "filter-button";
    button.textContent = category;
    button.dataset.category = category;
    button.setAttribute("aria-pressed", String(category === state.category));
    button.addEventListener("click", () => {
      state.category = category;
      renderFilters();
      render();
    });
    return button;
  }));
}

function getVisiblePrompts() {
  const query = state.query.trim().toLowerCase();
  const filtered = state.prompts.filter(prompt => {
    const categoryMatch = state.category === "All" || prompt.category === state.category;
    const searchable = [
      prompt.title,
      prompt.description,
      prompt.category,
      prompt.model,
      prompt.version,
      prompt.prompt,
      prompt.lesson,
      ...prompt.tags
    ].join(" ").toLowerCase();
    return categoryMatch && (!query || searchable.includes(query));
  });

  return filtered.sort((a, b) => {
    if (state.sort === "title") return a.title.localeCompare(b.title);
    if (state.sort === "newest") return new Date(b.date) - new Date(a.date);
    return Number(b.featured) - Number(a.featured) || new Date(b.date) - new Date(a.date);
  });
}

function render() {
  const prompts = getVisiblePrompts();
  els.grid.replaceChildren(...prompts.map(createPromptCard));
  els.summary.textContent = `${prompts.length} prompt${prompts.length === 1 ? "" : "s"} shown`;
  els.empty.hidden = prompts.length !== 0;
}

function createPromptCard(prompt) {
  const fragment = els.template.content.cloneNode(true);
  const article = fragment.querySelector("article");
  article.id = prompt.id;

  fragment.querySelector(".category-badge").textContent = prompt.category;
  fragment.querySelector(".version").textContent = prompt.version;
  fragment.querySelector(".prompt-title").textContent = prompt.title;
  fragment.querySelector(".prompt-description").textContent = prompt.description;
  fragment.querySelector(".prompt-text").textContent = prompt.prompt;
  fragment.querySelector(".lesson").innerHTML = `<strong>What worked:</strong> ${escapeHtml(prompt.lesson)}`;

  const metadata = fragment.querySelector(".metadata");
  metadata.append(
    createChip(prompt.model, "meta-chip"),
    createChip(formatDate(prompt.date), "meta-chip")
  );
  if (prompt.featured) metadata.append(createChip("Featured", "meta-chip"));

  const tags = fragment.querySelector(".tags");
  prompt.tags.forEach(tag => tags.append(createChip(`#${tag}`, "tag")));

  const copyButton = fragment.querySelector(".copy-button");
  copyButton.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(prompt.prompt);
      copyButton.textContent = "Copied";
      setTimeout(() => { copyButton.textContent = "Copy prompt"; }, 1400);
    } catch {
      copyButton.textContent = "Copy failed";
    }
  });

  return article;
}

function createChip(text, className) {
  const span = document.createElement("span");
  span.className = className;
  span.textContent = text;
  return span;
}

function formatDate(dateString) {
  return new Intl.DateTimeFormat("en", { year: "numeric", month: "short", day: "numeric" })
    .format(new Date(`${dateString}T00:00:00`));
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

els.search.addEventListener("input", event => {
  state.query = event.target.value;
  render();
});

els.sort.addEventListener("change", event => {
  state.sort = event.target.value;
  render();
});

els.clear.addEventListener("click", () => {
  state.query = "";
  state.category = "All";
  els.search.value = "";
  renderFilters();
  render();
});

loadPrompts();
