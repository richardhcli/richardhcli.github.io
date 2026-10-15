// Noun DAG viewer (plan §9): search, then one node's parents, children and similar siblings, as text (left panel)
// and as a local graph (right panel, graph.js).
"use strict";

const DEFAULT_ID = "oewn-02086723-n";        // dog (domestic animal)
const MAX_RESULTS = 40, TRAILS_SHOWN = 3, CHILDREN_SHOWN = 50;
const $ = (id) => document.getElementById(id);

let D, byId, keyRank, entries, graph;

const qualifierOf = (key) => (key.match(/ \(([^()]*)\)$/) || [])[1];
const mainOf = (key) => key.replace(/ \([^()]*\)$/, "");
const byKey = (a, b) => keyRank[a] - keyRank[b];

function link(i, text) {
  const a = document.createElement("a");
  a.href = "#" + D.ids[i];
  a.textContent = text ?? D.keys[i];
  return a;
}

function el(tag, cls, text) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text != null) e.textContent = text;
  return e;
}

function plural(n, word) {
  return `${n.toLocaleString("en")} ${n === 1 ? word : word === "child" ? "children" : word + "s"}`;
}

// ---- search ---------------------------------------------------------------

function buildIndex() {
  entries = [];                              // [casefolded text, node, alias or null]
  D.keys.forEach((k, i) => {
    entries.push([mainOf(k).toLowerCase(), i, null]);
    if (qualifierOf(k)) entries.push([k.toLowerCase(), i, null]);
    for (const a of D.aliases[i]) entries.push([a.toLowerCase(), i, a]);
  });
}

function search(q) {
  const best = new Map();                    // node -> [tier, alias]
  for (const [text, i, alias] of entries) {
    const tier = text === q ? 0 : text.startsWith(q) ? 1 : text.includes(q) ? 2 : -1;
    if (tier < 0) continue;
    const prev = best.get(i);
    if (!prev || tier < prev[0] || (tier === prev[0] && prev[1] && !alias)) best.set(i, [tier, alias]);
  }
  return [...best].sort((a, b) => a[1][0] - b[1][0] || D.counts[b[0]] - D.counts[a[0]] || byKey(a[0], b[0]));
}

let selected = 0, current = [];
function showResults() {
  const q = $("q").value.trim().toLowerCase(), list = $("results");
  list.replaceChildren();
  if (!q) { list.hidden = true; return; }
  current = search(q);
  selected = 0;
  current.slice(0, MAX_RESULTS).forEach(([i, [, alias]], n) => {
    const a = link(i, "");
    a.setAttribute("aria-selected", String(n === 0));
    a.append(el("span", "k", D.keys[i]));
    if (alias) a.append(el("span", "via", `alias “${alias}”`));
    a.append(el("span", "d", D.definitions[i]));
    a.addEventListener("click", closeResults);
    const li = el("li"); li.append(a); list.append(li);
  });
  if (!current.length) list.append(el("li", "note", "No noun matches. Try a shorter spelling."));
  else if (current.length > MAX_RESULTS) list.append(el("li", "note",
    `${(current.length - MAX_RESULTS).toLocaleString("en")} more matches. Keep typing to narrow them.`));
  list.hidden = false;
}

function closeResults() { $("results").hidden = true; $("q").blur(); }

function moveSelection(step) {
  const links = $("results").querySelectorAll("a");
  if (!links.length) return;
  links[selected].setAttribute("aria-selected", "false");
  selected = (selected + step + links.length) % links.length;
  links[selected].setAttribute("aria-selected", "true");
  links[selected].scrollIntoView({ block: "nearest" });
}

// ---- node -----------------------------------------------------------------

const pathMemo = new Map();
function paths(i) {                         // every path from the root down to i
  if (!pathMemo.has(i)) {
    const ps = D.parents[i];
    pathMemo.set(i, ps.length ? ps.flatMap((p) => paths(p).map((t) => [...t, i])) : [[i]]);
  }
  return pathMemo.get(i);
}

function renderTrails(i) {
  const all = paths(i), list = $("trails"), more = $("more-trails");
  $("parents-count").textContent = D.parents[i].length
    ? `· ${plural(D.parents[i].length, "parent")}, ${plural(all.length, "path")} to entity` : "· the root";
  const draw = (n) => {
    list.replaceChildren(...all.slice(0, n).map((trail) => {
      const li = el("li");
      trail.forEach((j, k) => {
        if (k) li.append(el("span", "sep", "›"));
        li.append(j === i ? el("span", "here", D.keys[j]) : link(j));
      });
      return li;
    }));
    more.hidden = all.length <= n;
    more.textContent = `${plural(all.length - n, "more path")}`;
  };
  more.onclick = () => draw(all.length);
  draw(TRAILS_SHOWN);
}

function childItem(j) {
  const li = el("li");
  li.append(link(j), el("span", "n", D.descendants[j] ? plural(D.descendants[j], "descendant") : "leaf"));
  return li;
}

function renderChildren(i) {
  const kids = [...D.children[i]].sort(byKey), list = $("children"), more = $("more-children"), filter = $("child-filter");
  $("children-count").textContent = kids.length ? `· ${plural(kids.length, "child")}, ${plural(D.descendants[i], "descendant")}` : "";
  $("no-children").hidden = kids.length > 0;
  filter.hidden = kids.length <= CHILDREN_SHOWN;
  filter.value = "";
  let limit = CHILDREN_SHOWN;
  const draw = () => {
    const f = filter.value.trim().toLowerCase();
    const shown = f ? kids.filter((j) => D.keys[j].toLowerCase().includes(f)) : kids;
    list.replaceChildren(...shown.slice(0, limit).map(childItem));
    more.hidden = shown.length <= limit;
    more.textContent = `Show all ${shown.length.toLocaleString("en")}`;
  };
  filter.oninput = draw;
  more.onclick = () => { limit = Infinity; draw(); };
  draw();
}

function renderSiblings(i) {
  const box = $("siblings");
  box.replaceChildren();
  let any = false;
  D.parents[i].forEach((p, n) => {
    const others = D.children[p].filter((j) => j !== i);
    if (!others.length) return;
    any = true;
    const group = el("div", "group"), h = el("h3"), list = el("ul", "list"), more = el("button", "more");
    h.append("Under ", link(p), ` · ${plural(others.length, "sibling")}`);
    list.replaceChildren(...D.similar[i][n].map(childItem));
    group.append(h, list);
    if (others.length > D.similar[i][n].length) {
      more.type = "button";
      more.textContent = `Show all ${others.length.toLocaleString("en")} in A–Z order`;
      more.onclick = () => { list.replaceChildren(...others.sort(byKey).map(childItem)); more.remove(); };
      group.append(more);
    }
    box.append(group);
  });
  $("no-siblings").hidden = any;
}

function render(i) {
  $("node-id").textContent = D.ids[i];
  $("node-key").textContent = D.keys[i];
  $("node-def").textContent = D.definitions[i];
  const al = D.aliases[i];
  $("node-aliases").hidden = !al.length;
  $("node-aliases").textContent = al.length ? `Also called: ${al.join(", ")}` : "";
  const qs = D.qualifier_sources[i], q = qualifierOf(D.keys[i]), qual = $("node-qual");
  qual.hidden = !(q && qs >= 0 && qs !== i);
  if (!qual.hidden) qual.replaceChildren(`The qualifier “${q}” is the meaning `, link(qs), ".");
  renderTrails(i);
  renderChildren(i);
  renderSiblings(i);
  document.title = `${D.keys[i]} · Noun Lattice`;
  $("node").hidden = false;
  graph.focus(i);
}

function route() {
  const i = byId.get(decodeURIComponent(location.hash.slice(1))) ?? byId.get(DEFAULT_ID);
  render(i);
  $("panel").scrollTop = 0;
  if (window.scrollY > $("panel").offsetTop) $("panel").scrollIntoView();
}

// ---- boot -----------------------------------------------------------------

async function boot() {
  try {
    const res = await fetch("data.json");
    if (!res.ok) throw new Error(`data.json: HTTP ${res.status}`);
    D = await res.json();
  } catch (e) {
    $("status").textContent = `The graph data didn't load (${e.message}). Serve this folder over HTTP, e.g. python -m http.server -d out/viewer.`;
    return;
  }
  byId = new Map(D.ids.map((id, i) => [id, i]));
  keyRank = new Array(D.keys.length);
  D.keys.map((k, i) => i).sort((a, b) => (D.keys[a] < D.keys[b] ? -1 : D.keys[a] > D.keys[b] ? 1 : 0))
    .forEach((i, r) => { keyRank[i] = r; });
  buildIndex();
  graph = NounGraph($("graph"), D, {
    onSelect: (i) => { location.hash = D.ids[i]; },
    onMore: (dir) => $(dir === "up" ? "h-parents" : "h-children").scrollIntoView({ behavior: "smooth", block: "start" }),
  });
  $("show-siblings").addEventListener("change", (e) => graph.setSiblings(e.target.checked));
  $("fit").addEventListener("click", () => graph.fit());
  $("version").textContent = D.version;
  $("status").hidden = true;
  const q = $("q");
  q.disabled = false;
  let timer;
  q.addEventListener("input", () => { clearTimeout(timer); timer = setTimeout(showResults, 120); });
  q.addEventListener("keydown", (e) => {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") { e.preventDefault(); moveSelection(e.key === "ArrowDown" ? 1 : -1); }
    else if (e.key === "Enter") {
      e.preventDefault();
      clearTimeout(timer); showResults();
      const a = $("results").querySelectorAll("a")[selected];
      if (a) { location.hash = a.getAttribute("href"); closeResults(); }
    } else if (e.key === "Escape") closeResults();
  });
  document.addEventListener("click", (e) => { if (!e.target.closest(".bar")) $("results").hidden = true; });
  window.addEventListener("hashchange", route);
  route();
}

boot();
