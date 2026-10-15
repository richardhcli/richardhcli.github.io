// Local graph (plan §9): the selected meaning, every ancestor, its largest children and its most similar siblings,
// drawn as a force layout on a canvas. Edges point parent → child ("can be a"). Tap a node to select it.
// Levels are longest paths, so every node sits below all of its shown parents and every arrow points down.
"use strict";

function NounGraph(canvas, D, { onSelect, onMore }) {
  const MAX_CHILDREN = 36;                  // more than this collapse into one "+N more" node
  const MAX_ANCESTORS = 100;                // past this, the farthest collapse into one node (OEWN's most is 32)
  const LAYER = 95, LINK = 70;              // vertical gap per level; spring length
  const ctx = canvas.getContext("2d");
  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)");
  const tip = document.getElementById("graph-tip");
  const topBar = document.querySelector(".graph-top"), hint = document.querySelector(".graph-hint");

  let nodes = new Map();                    // key (node index, or "more") -> node
  let edges = [];                           // [from node, to node, dashed]
  let adjacent = new Map();                 // node -> Set of neighbouring nodes
  let focusIdx = -1, showSiblings = true, bottom = 1;
  let cam = { x: 0, y: 0, k: 1 }, autoFit = true;
  let alpha = 0, running = false, hover = null;
  let width = 0, height = 0, dpr = 1, colors = {};

  // ---- neighbourhood -------------------------------------------------------

  const radius = (i) => 4 + 2.1 * Math.log10(D.descendants[i] + 1);
  const jitter = (i, s) => (Math.sin(i * 12.9898 + s * 78.233) * 43758.5453) % 1;   // stable per node

  function focus(i) {
    focusIdx = i;
    const old = nodes, next = new Map();
    const add = (key, idx, kind, level) => {
      if (next.has(key)) return next.get(key);
      const prev = old.get(key);
      const n = prev || { key, idx, x: NaN, y: NaN, vx: 0, vy: 0 };
      Object.assign(n, { kind, level, r: idx >= 0 ? radius(idx) : 7, fx: null, fy: null });
      n.w = Math.min(30, idx >= 0 ? D.keys[idx].length : 10) * 6.4;   // approximate label width at 12px
      next.set(key, n);
      return n;
    };
    add(i, i, "focus", 0);
    // every ancestor, nearest first; each sits one level above its highest shown descendant (longest path down)
    const seen = new Set([i]), order = [];
    for (let frontier = [i]; frontier.length;) {
      const up = [];
      for (const c of frontier) for (const p of D.parents[c]) if (!seen.has(p)) { seen.add(p); order.push(p); up.push(p); }
      frontier = up;
    }
    const kept = order.slice(0, MAX_ANCESTORS), depth = new Map([[i, 0]]);
    for (const a of kept) depth.set(a, 0);
    for (let changed = true; changed;) {
      changed = false;
      for (const [c, d] of depth) for (const p of D.parents[c]) {
        if (depth.has(p) && depth.get(p) < d + 1) { depth.set(p, d + 1); changed = true; }
      }
    }
    kept.forEach((a) => add(a, a, "ancestor", -depth.get(a)));
    // children, biggest branches first
    const kids = [...D.children[i]].sort((a, b) => D.descendants[b] - D.descendants[a] || a - b);
    kids.slice(0, MAX_CHILDREN).forEach((c) => add(c, c, "child", 1));
    let more = null;
    if (kids.length > MAX_CHILDREN) {
      more = add("more", -1, "more", 1);
      more.label = `+${(kids.length - MAX_CHILDREN).toLocaleString("en")} more`;
      more.dir = "down";
    }
    if (showSiblings) D.parents[i].forEach((p, n) => D.similar[i][n].forEach((s) => add(s, s, "sibling", 0)));

    // edges: every parent link among the nodes shown
    edges = [];
    for (const n of next.values()) {
      if (n.idx < 0) continue;
      for (const p of D.parents[n.idx]) if (next.has(p)) edges.push([next.get(p), n, false]);
    }
    if (more) edges.push([next.get(i), more, true]);
    // a sibling or child with a shown parent on its own row or below moves down a level, until every arrow points down
    for (let changed = true; changed;) {
      changed = false;
      for (const [s, t] of edges) {
        if (t.kind !== "ancestor" && t.kind !== "focus" && t.level <= s.level) { t.level = s.level + 1; changed = true; }
      }
    }
    if (order.length > kept.length) {           // ancestors past the cap: one node above, linked to whoever lost a parent
      const top = Math.min(...kept.map((a) => next.get(a).level));
      const up = add("more-up", -1, "more", top - 1);
      up.label = `+${(order.length - kept.length).toLocaleString("en")} more ancestors`;
      up.dir = "up";
      for (const a of [i, ...kept]) if (D.parents[a].some((p) => !next.has(p))) edges.push([up, next.get(a), true]);
    }
    bottom = Math.max(...[...next.values()].map((n) => n.level));
    adjacent = new Map([...next.values()].map((n) => [n, new Set()]));
    for (const [a, b] of edges) { adjacent.get(a).add(b); adjacent.get(b).add(a); }

    // new nodes start beside a placed neighbour, so the layout grows out of the old one
    const f = next.get(i);
    if (Number.isNaN(f.x)) { f.x = 0; f.y = 0; }
    for (let pass = 0; pass < 3; pass++) {
      for (const n of next.values()) {
        if (!Number.isNaN(n.x)) continue;
        const anchor = [...adjacent.get(n)].find((m) => !Number.isNaN(m.x)) || (pass === 2 ? f : null);
        if (!anchor) continue;
        const k = typeof n.key === "number" ? n.key : 1;
        n.x = anchor.x + 40 * jitter(k, 1); n.y = anchor.y + Math.sign(n.level - anchor.level || 1) * 30 + 20 * jitter(k, 2);
      }
    }
    nodes = next;
    hover = null; hideTip();
    autoFit = true;
    reheat(1);
  }

  // ---- simulation ----------------------------------------------------------

  function tick() {
    const list = [...nodes.values()], f = nodes.get(focusIdx);
    const labelled = list.filter((n) => n.kind === "focus" || n.kind === "ancestor" || n.kind === "more");
    for (let a = 0; a < list.length; a++) {                     // repulsion
      const p = list[a];
      for (let b = a + 1; b < list.length; b++) {
        const q = list[b];
        let dx = q.x - p.x, dy = q.y - p.y, d2 = dx * dx + dy * dy;
        if (d2 < 1) { dx = jitter(a, b) || 0.5; dy = 0.5; d2 = 1; }
        if (d2 > 160000) continue;
        const force = (2200 * alpha) / d2, d = Math.sqrt(d2);
        p.vx -= (dx / d) * force; p.vy -= (dy / d) * force;
        q.vx += (dx / d) * force; q.vy += (dy / d) * force;
      }
    }
    for (const [s, t] of edges) {                               // springs
      const dx = t.x - s.x, dy = t.y - s.y, d = Math.hypot(dx, dy) || 1;
      const rest = Math.max(LINK, LAYER * Math.abs(t.level - s.level));   // a spring never fights the levels
      const k = ((d - rest) / d) * 0.06 * alpha;
      s.vx += dx * k; s.vy += dy * k; t.vx -= dx * k; t.vy -= dy * k;
    }
    for (const n of list) {                                     // levels: ancestors above, children below
      n.vy += (f.y + n.level * LAYER - n.y) * 0.06 * alpha;     // (no pull to the origin: the camera follows)
      n.vx += (f.x - n.x) * 0.004 * alpha;
    }
    for (const n of list) {
      if (n.fx != null) { n.x = n.fx; n.y = n.fy; n.vx = n.vy = 0; continue; }
      if (n === f) { n.vx = n.vy = 0; continue; }               // the selected node anchors the layout
      n.vx *= 0.6; n.vy *= 0.6;
      n.x += n.vx; n.y += n.vy;
      // each level stays in its own band, so every arrow points down; the children's band has room for rows
      const mid = f.y + n.level * LAYER, lo = mid - 0.4 * LAYER, hi = mid + (n.level > 0 && n.level === bottom ? 1.8 : 0.4) * LAYER;
      if (n !== f && (n.y < lo || n.y > hi)) { n.y = Math.min(hi, Math.max(lo, n.y)); n.vy = 0; }
    }
    for (let a = 0; a < labelled.length; a++) {                 // labels on one row must not overlap: move them apart
      const p = labelled[a];
      for (let b = a + 1; b < labelled.length; b++) {
        const q = labelled[b];
        if (Math.abs(q.y - p.y) > 22) continue;
        const dx = q.x - p.x, gap = (p.w + q.w) / 2 + 10 - Math.abs(dx);
        if (gap <= 0) continue;
        const dir = dx < 0 ? -1 : dx > 0 ? 1 : jitter(a, b) < 0 ? -1 : 1;
        const pFixed = p === f || p.fx != null, qFixed = q === f || q.fx != null;
        if (pFixed && qFixed) continue;
        const share = pFixed ? 0 : qFixed ? 1 : 0.5;            // a fixed node stays; the other moves the whole way
        p.x -= dir * gap * share * 0.5; q.x += dir * gap * (1 - share) * 0.5;
      }
    }
    alpha *= 0.985;
  }

  function reheat(a) {
    alpha = Math.max(alpha, a);
    if (reduceMotion.matches) {
      while (alpha > 0.004) tick();
      if (autoFit) fit(true);
      draw();
      return;
    }
    if (!running) { running = true; requestAnimationFrame(frame); }
  }

  function frame() {
    if (alpha > 0.004) tick();
    const moving = autoFit && fit(false);
    draw();
    if (alpha > 0.004 || moving) requestAnimationFrame(frame);
    else running = false;
  }

  // ---- camera --------------------------------------------------------------

  function fit(jump) {                       // ease the camera towards the bounding box; true while still moving
    if (!nodes.size || !width) return false;
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    for (const n of nodes.values()) {
      x0 = Math.min(x0, n.x - n.r); x1 = Math.max(x1, n.x + n.r);
      y0 = Math.min(y0, n.y - n.r); y1 = Math.max(y1, n.y + n.r + 16);
    }
    const top = topBar.offsetHeight + 24, bottom = hint.offsetHeight + 16, side = 24;
    const k = Math.min((width - 2 * side) / (x1 - x0 || 1), (height - top - bottom) / (y1 - y0 || 1), 2);
    const target = { x: (x0 + x1) / 2, y: (y0 + y1) / 2 - (top - bottom) / 2 / k, k };
    const t = jump ? 1 : 0.12;
    cam.x += (target.x - cam.x) * t; cam.y += (target.y - cam.y) * t; cam.k += (target.k - cam.k) * t;
    return Math.abs(target.k - cam.k) > 0.002 || Math.hypot(target.x - cam.x, target.y - cam.y) * cam.k > 0.5;
  }

  const toScreen = (n) => [(n.x - cam.x) * cam.k + width / 2, (n.y - cam.y) * cam.k + height / 2];
  const toWorld = (sx, sy) => [(sx - width / 2) / cam.k + cam.x, (sy - height / 2) / cam.k + cam.y];
  const screenR = (n) => Math.max(2.5, n.r * Math.min(cam.k, 1.6));

  // ---- drawing -------------------------------------------------------------

  function readColors() {
    const css = getComputedStyle(document.documentElement);
    for (const name of ["canvas", "edge", "accent", "ink", "muted", "n-ancestor", "n-child", "n-sibling"]) {
      colors[name] = css.getPropertyValue(`--${name}`).trim();
    }
    colors.font = css.getPropertyValue("--body").trim();
  }

  const fill = { focus: "accent", ancestor: "n-ancestor", child: "n-child", sibling: "n-sibling", more: "canvas" };

  function label(n) {
    const text = n.idx >= 0 ? D.keys[n.idx] : n.label;
    return text.length > 30 ? text.slice(0, 29) + "…" : text;
  }

  function showsLabel(n) {
    if (n === hover || n.kind === "focus" || n.kind === "ancestor" || n.kind === "more") return true;
    if (hover && adjacent.get(hover).has(n)) return true;
    if (n.kind === "child") return D.children[focusIdx].length <= 16 || cam.k >= 1.25;
    return cam.k >= 1.5;
  }

  function draw() {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = colors.canvas;
    ctx.fillRect(0, 0, width, height);
    const lit = hover ? new Set([hover, ...adjacent.get(hover)]) : null;

    for (const [s, t, dashed] of edges) {
      const [x1, y1] = toScreen(s), [x2, y2] = toScreen(t);
      const d = Math.hypot(x2 - x1, y2 - y1);
      if (d < 1) continue;
      const ux = (x2 - x1) / d, uy = (y2 - y1) / d, rs = screenR(s), rt = screenR(t) + 2;
      const on = lit ? lit.has(s) && lit.has(t) && (s === hover || t === hover) : s.kind === "focus" || t.kind === "focus";
      ctx.globalAlpha = lit && !on ? 0.15 : 1;
      ctx.strokeStyle = on ? colors.accent : colors.edge;
      ctx.fillStyle = ctx.strokeStyle;
      ctx.lineWidth = on ? 1.6 : 1;
      ctx.setLineDash(dashed ? [4, 4] : []);
      const ex = x2 - ux * rt, ey = y2 - uy * rt;
      ctx.beginPath(); ctx.moveTo(x1 + ux * rs, y1 + uy * rs); ctx.lineTo(ex - ux * 5, ey - uy * 5); ctx.stroke();
      ctx.setLineDash([]);
      const a = 7, w = 3.5;                                       // arrowhead at the child
      ctx.beginPath();
      ctx.moveTo(ex, ey);
      ctx.lineTo(ex - ux * a - uy * w, ey - uy * a + ux * w);
      ctx.lineTo(ex - ux * a + uy * w, ey - uy * a - ux * w);
      ctx.closePath(); ctx.fill();
    }

    ctx.font = `12px ${colors.font}`;
    ctx.textAlign = "center"; ctx.textBaseline = "top";
    ctx.lineJoin = "round";
    for (const n of nodes.values()) {
      const [x, y] = toScreen(n), r = screenR(n);
      if (x < -60 || x > width + 60 || y < -60 || y > height + 60) continue;
      ctx.globalAlpha = lit && !lit.has(n) ? 0.2 : 1;
      ctx.beginPath(); ctx.arc(x, y, r, 0, 2 * Math.PI);
      ctx.fillStyle = colors[fill[n.kind]]; ctx.fill();
      if (n.kind === "more") {
        ctx.setLineDash([3, 3]); ctx.strokeStyle = colors.muted; ctx.lineWidth = 1.2; ctx.stroke(); ctx.setLineDash([]);
      }
      if (n.kind === "focus" || n === hover) {
        ctx.beginPath(); ctx.arc(x, y, r + 3.5, 0, 2 * Math.PI);
        ctx.strokeStyle = colors.accent; ctx.lineWidth = 1.5; ctx.stroke();
      }
    }
    // labels by priority; one that would overlap a label already drawn is skipped (zoom in or hover to see it)
    const placed = [];
    for (const n of [...nodes.values()].filter(showsLabel).sort((a, b) => labelRank(a) - labelRank(b))) {
      const [x, y] = toScreen(n), r = screenR(n), text = label(n);
      ctx.font = `${n.kind === "focus" ? "700 13px" : "12px"} ${colors.font}`;
      const w = ctx.measureText(text).width, box = [x - w / 2 - 2, y + r + 3, x + w / 2 + 2, y + r + 19];
      if (box[2] < 0 || box[0] > width || box[3] < 0 || box[1] > height) continue;
      if (placed.some((o) => box[0] < o[2] && o[0] < box[2] && box[1] < o[3] && o[1] < box[3])) continue;
      placed.push(box);
      ctx.globalAlpha = lit && !lit.has(n) ? 0.2 : 1;
      ctx.strokeStyle = colors.canvas; ctx.lineWidth = 3.5; ctx.strokeText(text, x, y + r + 4);
      ctx.fillStyle = n.kind === "sibling" || n.kind === "more" ? colors.muted : colors.ink;
      ctx.fillText(text, x, y + r + 4);
    }
    ctx.globalAlpha = 1;
  }

  function labelRank(n) {                     // hover, selected, hover neighbours, "more", nearer ancestors, children, siblings
    if (n === hover) return 0;
    if (n.kind === "focus") return 1;
    if (hover && adjacent.get(hover).has(n)) return 2;
    if (n.kind === "more") return 3;
    if (n.kind === "ancestor") return 4 - n.level / 1000;
    return n.kind === "child" ? 5 : 6;
  }

  // ---- interaction ---------------------------------------------------------

  function hit(sx, sy, slop) {
    let best = null, bestD = Infinity;
    for (const n of nodes.values()) {
      const [x, y] = toScreen(n), d = Math.hypot(x - sx, y - sy);
      if (d <= screenR(n) + slop && d < bestD) { best = n; bestD = d; }
    }
    return best;
  }

  function showTip(n, sx, sy) {
    if (!n || n.idx < 0) { hideTip(); return; }
    tip.replaceChildren();
    const k = document.createElement("strong"), d = document.createElement("span");
    k.textContent = D.keys[n.idx];
    d.textContent = D.definitions[n.idx];
    tip.append(k, d);
    tip.hidden = false;
    const box = canvas.getBoundingClientRect(), w = tip.offsetWidth, h = tip.offsetHeight;
    tip.style.left = `${Math.min(Math.max(8, sx + 14), box.width - w - 8)}px`;
    tip.style.top = `${sy + 14 + h > box.height - 8 ? sy - h - 14 : sy + 14}px`;
  }
  function hideTip() { if (tip) tip.hidden = true; }

  const pointers = new Map();
  let drag = null;                           // {node | null (pan), sx, sy, moved}
  let pinch = null;

  function local(e) { const b = canvas.getBoundingClientRect(); return [e.clientX - b.left, e.clientY - b.top]; }

  canvas.addEventListener("pointerdown", (e) => {
    canvas.setPointerCapture(e.pointerId);
    const [sx, sy] = local(e);
    pointers.set(e.pointerId, [sx, sy]);
    if (pointers.size === 2) {
      const [a, b] = [...pointers.values()];
      pinch = { d: Math.hypot(a[0] - b[0], a[1] - b[1]), k: cam.k };
      if (drag?.node) drag.node.fx = drag.node.fy = null;
      drag = null;
      return;
    }
    const node = hit(sx, sy, e.pointerType === "mouse" ? 4 : 12);
    drag = { node, sx, sy, moved: false };
    canvas.classList.add("dragging");
  });

  canvas.addEventListener("pointermove", (e) => {
    const [sx, sy] = local(e);
    if (pointers.has(e.pointerId)) pointers.set(e.pointerId, [sx, sy]);
    if (pinch && pointers.size === 2) {
      const [a, b] = [...pointers.values()];
      cam.k = Math.min(4, Math.max(0.15, pinch.k * Math.hypot(a[0] - b[0], a[1] - b[1]) / pinch.d));
      autoFit = false; draw();
      return;
    }
    if (drag) {
      if (!drag.moved && Math.hypot(sx - drag.sx, sy - drag.sy) < 4) return;
      drag.moved = true; hideTip();
      if (drag.node) {
        [drag.node.fx, drag.node.fy] = toWorld(sx, sy);
        reheat(0.3);
      } else {
        cam.x -= (sx - drag.sx) / cam.k; cam.y -= (sy - drag.sy) / cam.k;
        drag.sx = sx; drag.sy = sy;
        autoFit = false; draw();
      }
      return;
    }
    if (e.pointerType !== "mouse") return;
    const n = hit(sx, sy, 4);
    canvas.classList.toggle("over-node", !!n);
    if (n !== hover) { hover = n; draw(); }
    showTip(n, sx, sy);
  });

  function release(e) {
    pointers.delete(e.pointerId);
    if (pointers.size < 2) pinch = null;
    canvas.classList.remove("dragging");
    if (!drag) return;
    const { node, moved } = drag;
    drag = null;
    if (node) { node.fx = node.fy = null; reheat(0.1); }
    if (!moved && node && e.type === "pointerup") {
      if (node.kind === "more") onMore(node.dir);
      else if (node.idx !== focusIdx) onSelect(node.idx);
    }
  }
  canvas.addEventListener("pointerup", release);
  canvas.addEventListener("pointercancel", release);
  canvas.addEventListener("pointerleave", (e) => {
    if (e.pointerType === "mouse" && !drag) { hover = null; hideTip(); canvas.classList.remove("over-node"); draw(); }
  });

  canvas.addEventListener("wheel", (e) => {
    e.preventDefault();
    const [sx, sy] = local(e), [wx, wy] = toWorld(sx, sy);
    cam.k = Math.min(4, Math.max(0.15, cam.k * Math.exp(-e.deltaY * 0.0015)));
    cam.x = wx - (sx - width / 2) / cam.k; cam.y = wy - (sy - height / 2) / cam.k;
    autoFit = false; hideTip(); draw();
  }, { passive: false });

  // ---- sizing and theme ----------------------------------------------------

  function resize() {
    const box = canvas.getBoundingClientRect();
    width = box.width; height = box.height; dpr = window.devicePixelRatio || 1;
    canvas.width = Math.round(width * dpr); canvas.height = Math.round(height * dpr);
    if (autoFit) fit(true);
    draw();
  }
  new ResizeObserver(resize).observe(canvas);
  const retheme = () => { readColors(); draw(); };
  matchMedia("(prefers-color-scheme: dark)").addEventListener("change", retheme);
  new MutationObserver(retheme).observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme", "class", "style"] });
  readColors();

  return {
    focus,
    setSiblings(on) { showSiblings = on; if (focusIdx >= 0) focus(focusIdx); },
    fit() { autoFit = true; reheat(0.05); },
  };
}
