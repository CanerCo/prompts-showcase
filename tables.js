const state = {
  tables: [],
  query: "",
  category: "All",
  sort: "featured"
};

const els = {
  grid: document.querySelector("#table-grid"),
  template: document.querySelector("#table-template"),
  search: document.querySelector("#search"),
  filters: document.querySelector("#filters"),
  sort: document.querySelector("#sort"),
  summary: document.querySelector("#result-summary"),
  empty: document.querySelector("#empty-state"),
  clear: document.querySelector("#clear-filters"),
  entryCount: document.querySelector("#entry-count"),
  categoryCount: document.querySelector("#category-count"),
  sourceCount: document.querySelector("#source-count")
};

async function loadTables() {
  try {
    const response = await fetch("tables.json", { cache: "no-cache" });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    state.tables = await response.json();
    renderFilters();
    renderStats();
    render();
  } catch (error) {
    els.grid.innerHTML = `<p>Could not load the table collection. ${escapeHtml(error.message)}</p>`;
  }
}

function renderStats() {
  els.entryCount.textContent = state.tables.length;
  els.categoryCount.textContent = new Set(state.tables.map(t => t.category)).size;
  els.sourceCount.textContent = new Set(state.tables.map(t => t.source).filter(Boolean)).size;
}

function renderFilters() {
  const categories = ["All", ...new Set(state.tables.map(t => t.category).sort())];
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

function getVisibleTables() {
  const query = state.query.trim().toLowerCase();
  const filtered = state.tables.filter(item => {
    const categoryMatch = state.category === "All" || item.category === state.category;
    const fieldText = (item.fields || []).map(f => `${f.label} ${f.value}`).join(" ");
    const gridText = item.kind === "grid"
      ? [item.columns || [], ...(item.rows || [])].flat().join(" ")
      : "";
    const figureText = item.kind === "figure" ? (item.caption || "") : "";
    const algoText = item.kind === "algorithm"
      ? (item.lines || []).map(l => l.text || "").join(" ")
      : "";
    const searchable = [
      item.title,
      item.section_ref,
      item.category,
      item.source,
      item.note,
      fieldText,
      gridText,
      figureText,
      algoText,
      ...(item.tags || [])
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
  const tables = getVisibleTables();
  els.grid.replaceChildren(...tables.map(createTableCard));
  els.summary.textContent = `${tables.length} entr${tables.length === 1 ? "y" : "ies"} shown`;
  els.empty.hidden = tables.length !== 0;
}

function createTableCard(item) {
  const fragment = els.template.content.cloneNode(true);
  const article = fragment.querySelector("article");
  article.id = item.id;

  fragment.querySelector(".category-badge").textContent = item.category;
  const refEl = fragment.querySelector(".section-ref-badge");
  if (item.section_ref) {
    refEl.textContent = item.section_ref;
  } else {
    refEl.remove();
  }

  fragment.querySelector(".table-title").textContent = item.title;

  const bylineEl = fragment.querySelector(".table-byline");
  if (item.source) {
    bylineEl.textContent = item.source;
  } else {
    bylineEl.remove();
  }

  const noteEl = fragment.querySelector(".table-note");
  if (item.note) {
    noteEl.textContent = item.note;
  } else {
    noteEl.remove();
  }

  const body = fragment.querySelector(".table-body");
  if (item.kind === "grid") {
    body.append(buildGrid(item));
  } else if (item.kind === "figure") {
    body.append(buildFigure(item));
  } else if (item.kind === "algorithm") {
    body.append(buildAlgorithm(item));
  } else {
    body.append(buildFieldList(item));
  }

  const metadata = fragment.querySelector(".metadata");
  metadata.append(createChip(formatDate(item.date), "meta-chip"));
  if (item.featured) metadata.append(createChip("Featured", "meta-chip"));

  const tagsEl = fragment.querySelector(".tags");
  (item.tags || []).forEach(tag => tagsEl.append(createChip(`#${tag}`, "tag")));

  const footnoteEl = fragment.querySelector(".table-footnote");
  if (item.footnote) {
    footnoteEl.textContent = item.footnote;
  } else {
    footnoteEl.remove();
  }

  return article;
}

function buildFieldList(item) {
  const list = document.createElement("div");
  list.className = "field-list";

  (item.fields || []).forEach(field => {
    const row = document.createElement("div");
    row.className = "field-row";

    const label = document.createElement("span");
    label.className = "field-label";
    label.textContent = field.label;
    row.append(label);

    const value = document.createElement("p");
    value.className = field.quote ? "field-value quote" : "field-value";
    value.innerHTML = field.quote
      ? `\u201c${highlightTerms(field.value, field.highlight)}\u201d`
      : escapeHtml(field.value);
    row.append(value);

    list.append(row);
  });

  return list;
}

function buildGrid(item) {
  const wrapper = document.createElement("div");
  wrapper.className = "data-table-wrapper";

  const table = document.createElement("table");
  table.className = "data-table";

  const thead = document.createElement("thead");
  const headRow = document.createElement("tr");
  (item.columns || []).forEach(col => {
    const th = document.createElement("th");
    th.textContent = col;
    headRow.append(th);
  });
  thead.append(headRow);
  table.append(thead);

  const tbody = document.createElement("tbody");
  (item.rows || []).forEach(row => {
    const tr = document.createElement("tr");
    row.forEach(cell => {
      const td = document.createElement("td");
      td.textContent = cell;
      tr.append(td);
    });
    tbody.append(tr);
  });
  table.append(tbody);

  wrapper.append(table);
  return wrapper;
}

function buildFigure(item) {
  const wrapper = document.createElement("figure");
  wrapper.className = "figure-wrapper";

  const img = document.createElement("img");
  img.src = item.image;
  img.alt = item.alt || item.title || "";
  img.loading = "lazy";
  wrapper.append(img);

  if (item.caption) {
    const caption = document.createElement("figcaption");
    caption.className = "figure-caption";
    caption.textContent = item.caption;
    wrapper.append(caption);
  }

  return wrapper;
}

const ALGO_KEYWORD_PATTERNS = {
  function: text => text.replace(/^function\b/, "<strong>function</strong>"),
  end: text => `<strong>${text}</strong>`,
  else: text => `<strong>${text}</strong>`,
  if: text => text
    .replace(/^if\b/, "<strong>if</strong>")
    .replace(/\bthen$/, "<strong>then</strong>"),
  stmt: text => text.replace(/^return\b/, "<strong>return</strong>")
};

function buildAlgorithm(item) {
  const wrapper = document.createElement("div");
  wrapper.className = "algorithm-block";

  let lineNumber = 0;
  (item.lines || []).forEach(line => {
    const row = document.createElement("div");

    if (line.type === "blank") {
      row.className = "algo-line algo-blank";
      wrapper.append(row);
      return;
    }

    lineNumber += 1;
    row.className = `algo-line algo-indent-${line.indent || 0}`;

    const num = document.createElement("span");
    num.className = "algo-num";
    num.textContent = lineNumber;
    row.append(num);

    const code = document.createElement("span");
    code.className = "algo-code";
    const escaped = escapeHtml(line.text);
    const formatter = ALGO_KEYWORD_PATTERNS[line.type];
    code.innerHTML = formatter ? formatter(escaped) : escaped;
    row.append(code);

    wrapper.append(row);
  });

  return wrapper;
}

function highlightTerms(value, terms) {
  const escaped = escapeHtml(value);
  if (!terms || terms.length === 0) return escaped;
  return terms.reduce((text, term) => {
    const escapedTerm = escapeHtml(term);
    return text.split(escapedTerm).join(`<mark>${escapedTerm}</mark>`);
  }, escaped);
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

loadTables();
