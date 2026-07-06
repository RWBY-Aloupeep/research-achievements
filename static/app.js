const state = {
  achievements: [],
  tags: [],
  activeTags: new Set(),
};

const el = {
  grid: document.getElementById("achievement-grid"),
  tagFilter: document.getElementById("tag-filter"),
  residualValue: document.getElementById("residual-value"),
  progressFill: document.getElementById("progress-fill"),
  unlockedCount: document.getElementById("unlocked-count"),
  totalCount: document.getElementById("total-count"),
  percentValue: document.getElementById("percent-value"),
  openAddForm: document.getElementById("open-add-form"),
  addForm: document.getElementById("add-form"),
  cancelAddForm: document.getElementById("cancel-add-form"),
  submitAddForm: document.getElementById("submit-add-form"),
  formTitle: document.getElementById("form-title"),
  formDescription: document.getElementById("form-description"),
  formTags: document.getElementById("form-tags"),
  formTier: document.getElementById("form-tier"),
};

async function fetchJSON(url, opts) {
  const res = await fetch(url, opts);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.detail || `request failed: ${res.status}`);
  }
  if (res.status === 204) return null;
  return res.json();
}

function formatResidual(residual) {
  if (residual <= 0) return "0.000e+0";
  return residual.toExponential(3).replace("e", "e");
}

async function loadAll() {
  const [achievements, tags] = await Promise.all([
    fetchJSON("/api/achievements"),
    fetchJSON("/api/tags"),
  ]);
  state.achievements = achievements;
  state.tags = tags;
  renderTagFilter();
  renderGrid();
  await refreshStats();
}

async function refreshStats() {
  const stats = await fetchJSON("/api/stats");
  el.residualValue.textContent = formatResidual(stats.residual);
  el.progressFill.style.width = `${stats.percent}%`;
  el.unlockedCount.textContent = stats.unlocked;
  el.totalCount.textContent = stats.total;
  el.percentValue.textContent = `${stats.percent.toFixed(2)}%`;
}

function renderTagFilter() {
  el.tagFilter.innerHTML = "";
  state.tags.forEach((tag) => {
    const chip = document.createElement("button");
    chip.className = "tag-chip" + (state.activeTags.has(tag) ? " active" : "");
    chip.textContent = tag;
    chip.addEventListener("click", () => {
      if (state.activeTags.has(tag)) {
        state.activeTags.delete(tag);
      } else {
        state.activeTags.add(tag);
      }
      renderTagFilter();
      renderGrid();
    });
    el.tagFilter.appendChild(chip);
  });
}

function visibleAchievements() {
  if (state.activeTags.size === 0) return state.achievements;
  return state.achievements.filter((a) =>
    a.tags.some((t) => state.activeTags.has(t))
  );
}

function renderGrid() {
  const items = visibleAchievements();
  el.grid.innerHTML = "";

  if (items.length === 0) {
    const empty = document.createElement("div");
    empty.className = "empty-state";
    empty.textContent = "no achievements match the current filter";
    el.grid.appendChild(empty);
    return;
  }

  items.forEach((a) => {
    el.grid.appendChild(renderCard(a));
  });
}

function renderCard(a) {
  const card = document.createElement("div");
  card.className = `card ${a.unlocked ? "unlocked" : "locked"}`;
  card.dataset.id = a.id;

  const top = document.createElement("div");
  top.className = "card-top";

  const tier = document.createElement("span");
  tier.className = `tier-badge tier-${a.tier}`;
  tier.textContent = a.tier;
  top.appendChild(tier);

  if (a.custom) {
    const deleteBtn = document.createElement("button");
    deleteBtn.className = "delete-btn";
    deleteBtn.textContent = "×";
    deleteBtn.title = "delete custom achievement";
    deleteBtn.addEventListener("click", () => onDelete(a.id));
    top.appendChild(deleteBtn);
  }

  card.appendChild(top);

  const title = document.createElement("h3");
  title.className = "card-title";
  title.textContent = a.title;
  card.appendChild(title);

  const desc = document.createElement("p");
  desc.className = "card-desc";
  desc.textContent = a.description;
  card.appendChild(desc);

  const tags = document.createElement("div");
  tags.className = "card-tags";
  a.tags.forEach((t) => {
    const tagEl = document.createElement("span");
    tagEl.className = "card-tag";
    tagEl.textContent = t;
    tags.appendChild(tagEl);
  });
  card.appendChild(tags);

  const bottom = document.createElement("div");
  bottom.className = "card-bottom";

  const toggle = document.createElement("button");
  toggle.className = "unlock-toggle" + (a.unlocked ? " is-unlocked" : "");
  toggle.textContent = a.unlocked ? "✓ unlocked" : "unlock";
  toggle.addEventListener("click", (e) => onToggle(a.id, e));
  bottom.appendChild(toggle);

  if (a.unlocked && a.unlocked_at) {
    const date = document.createElement("span");
    date.className = "unlocked-at";
    date.textContent = new Date(a.unlocked_at).toLocaleDateString();
    bottom.appendChild(date);
  } else if (a.custom) {
    const flag = document.createElement("span");
    flag.className = "custom-flag";
    flag.textContent = "custom";
    bottom.appendChild(flag);
  }

  card.appendChild(bottom);
  return card;
}

function spawnRipple(target) {
  const rect = target.getBoundingClientRect();
  const ripple = document.createElement("div");
  const size = Math.max(rect.width, rect.height) * 2;
  ripple.className = "ripple";
  ripple.style.width = `${size}px`;
  ripple.style.height = `${size}px`;
  ripple.style.left = `${rect.width / 2 - size / 2}px`;
  ripple.style.top = `${rect.height / 2 - size / 2}px`;
  target.style.position = "relative";
  target.appendChild(ripple);
  ripple.addEventListener("animationend", () => ripple.remove());
}

async function onToggle(id, e) {
  const card = e.target.closest(".card");
  const wasUnlocked = card.classList.contains("unlocked");
  try {
    const updated = await fetchJSON(`/api/achievements/${id}/toggle`, {
      method: "PATCH",
    });
    const idx = state.achievements.findIndex((a) => a.id === id);
    state.achievements[idx] = updated;
    renderGrid();
    await refreshStats();
    if (!wasUnlocked) {
      const newCard = el.grid.querySelector(`.card[data-id="${id}"]`);
      if (newCard) spawnRipple(newCard);
    }
  } catch (err) {
    alert(err.message);
  }
}

async function onDelete(id) {
  if (!confirm("Delete this custom achievement?")) return;
  try {
    await fetchJSON(`/api/achievements/${id}`, { method: "DELETE" });
    state.achievements = state.achievements.filter((a) => a.id !== id);
    const tags = await fetchJSON("/api/tags");
    state.tags = tags;
    renderTagFilter();
    renderGrid();
    await refreshStats();
  } catch (err) {
    alert(err.message);
  }
}

el.openAddForm.addEventListener("click", () => {
  el.addForm.classList.remove("hidden");
});
el.cancelAddForm.addEventListener("click", () => {
  el.addForm.classList.add("hidden");
  el.formTitle.value = "";
  el.formDescription.value = "";
  el.formTags.value = "";
  el.formTier.value = "bronze";
});
el.submitAddForm.addEventListener("click", async () => {
  const title = el.formTitle.value.trim();
  const description = el.formDescription.value.trim();
  const tags = el.formTags.value
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
  const tier = el.formTier.value;

  if (!title || !description) {
    alert("title and description are required");
    return;
  }

  try {
    await fetchJSON("/api/achievements", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, description, tags, tier, domain: "research" }),
    });
    el.cancelAddForm.click();
    await loadAll();
  } catch (err) {
    alert(err.message);
  }
});

loadAll().catch((err) => {
  console.error(err);
  el.grid.innerHTML = `<div class="empty-state">failed to load: ${err.message}</div>`;
});
