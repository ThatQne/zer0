/* Zer0 waitlist site */

// ── Waitlist endpoint ───────────────────────────────────────
// Paste your form backend URL here (Formspree, Basin, Getform, etc.).
// Example: const WAITLIST_ENDPOINT = 'https://formspree.io/f/abcdwxyz';
// While empty the form runs in demo mode (validates + succeeds locally).
const WAITLIST_ENDPOINT = '';

const mqReduce = matchMedia('(prefers-reduced-motion: reduce)');
const reduceMotion = mqReduce.matches;   // snapshot for one-shot decisions (counters)

// ── Nav border on scroll ────────────────────────────────────
const nav = document.getElementById('nav');
addEventListener('scroll', () => {
  nav.classList.toggle('scrolled', scrollY > 8);
}, { passive: true });

// ── Scroll reveal ───────────────────────────────────────────
const io = new IntersectionObserver((entries) => {
  for (const e of entries) {
    if (e.isIntersecting) {
      e.target.classList.add('visible');
      io.unobserve(e.target);
    }
  }
}, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
document.querySelectorAll('.reveal').forEach((el) => io.observe(el));

// ── Magnetic buttons (force feedback) ───────────────────────
// One rAF lerp per button drives BOTH the magnetic pull and the press scale,
// as a single inline transform. No CSS transition on transform → nothing for
// the spring to fight, so re-hover and click always read cleanly.
// Decide per-event by pointerType rather than gating on a load-time media query
// (some renderers resolve pointer capabilities lazily, which races the gate).
// Touch input simply no-ops these mouse-follow effects.
const isMouse = (e) => e.pointerType !== 'touch' && !mqReduce.matches;

{
  document.querySelectorAll('.magnetic').forEach((el) => {
    const strength = el.classList.contains('btn-small') ? 0.18 : 0.26;
    let tx = 0, ty = 0, ts = 1;     // targets
    let cx = 0, cy = 0, cs = 1;     // current
    let raf = null, hovering = false;

    const loop = () => {
      cx += (tx - cx) * 0.22;
      cy += (ty - cy) * 0.22;
      cs += (ts - cs) * 0.28;
      const idle = Math.abs(tx - cx) + Math.abs(ty - cy) + Math.abs(ts - cs);
      if (!hovering && tx === 0 && ty === 0 && ts === 1 && idle < 0.01) {
        el.style.transform = '';     // hand back to CSS when fully at rest
        raf = null;
        return;
      }
      el.style.transform = `translate(${cx.toFixed(2)}px, ${cy.toFixed(2)}px) scale(${cs.toFixed(3)})`;
      raf = requestAnimationFrame(loop);
    };
    const kick = () => { if (!raf) raf = requestAnimationFrame(loop); };

    el.addEventListener('pointerenter', (e) => { if (isMouse(e)) hovering = true; });
    el.addEventListener('pointermove', (e) => {
      if (!isMouse(e)) return;
      const r = el.getBoundingClientRect();
      tx = (e.clientX - (r.left + r.width / 2)) * strength;
      ty = (e.clientY - (r.top + r.height / 2)) * strength;
      kick();
    });
    el.addEventListener('pointerleave', () => { hovering = false; tx = 0; ty = 0; ts = 1; kick(); });
    el.addEventListener('pointerdown', () => { ts = 0.93; kick(); });
    const release = () => { ts = 1; kick(); };
    el.addEventListener('pointerup', release);
    el.addEventListener('pointercancel', release);
  });
}

// ── 3D tilt on the hero phone ───────────────────────────────
// Driven by pointer position anywhere on the page (not just over the phone),
// rAF-lerped so it tracks live with no transition lag.
const tilt = document.getElementById('tilt');
if (tilt) {
  const stage = tilt.parentElement;
  let tx = 0, ty = 0, ts = 1;
  let cx = 0, cy = 0, cs = 1;
  let raf = null;

  const loop = () => {
    cx += (tx - cx) * 0.12;
    cy += (ty - cy) * 0.12;
    cs += (ts - cs) * 0.12;
    tilt.style.transform = `rotateY(${cx.toFixed(2)}deg) rotateX(${cy.toFixed(2)}deg) scale(${cs.toFixed(3)})`;
    if (Math.abs(tx - cx) + Math.abs(ty - cy) + Math.abs(ts - cs) > 0.004) {
      raf = requestAnimationFrame(loop);
    } else {
      raf = null;
    }
  };
  const kick = () => { if (!raf) raf = requestAnimationFrame(loop); };

  // normalized -0.5..0.5 across the viewport → tilt responds wherever the mouse is
  window.addEventListener('pointermove', (e) => {
    if (!isMouse(e)) return;
    tx = (e.clientX / innerWidth  - 0.5) * 26;
    ty = -(e.clientY / innerHeight - 0.5) * 20;
    kick();
  }, { passive: true });

  stage.addEventListener('pointerenter', (e) => { if (isMouse(e)) { ts = 1.04; kick(); } });
  stage.addEventListener('pointerleave', () => { ts = 1; kick(); });
}

// ── Stat counters ───────────────────────────────────────────
const counterIo = new IntersectionObserver((entries) => {
  for (const e of entries) {
    if (!e.isIntersecting) continue;
    counterIo.unobserve(e.target);
    const el     = e.target;
    const target = parseInt(el.dataset.counter, 10);
    const prefix = el.dataset.prefix ?? '';
    const suffix = el.dataset.suffix ?? '';
    if (reduceMotion || target === 0) {
      el.textContent = `${prefix}${target}${suffix}`;
      continue;
    }
    const t0 = performance.now();
    const dur = 1100;
    const tick = (t) => {
      const p = Math.min((t - t0) / dur, 1);
      const eased = 1 - Math.pow(1 - p, 4);
      el.textContent = `${prefix}${Math.round(target * eased)}${suffix}`;
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }
}, { threshold: 0.6 });
document.querySelectorAll('[data-counter]').forEach((el) => counterIo.observe(el));

// ── Decorative QR patterns (deterministic, mockup only) ────
function drawQr(svg, seedInit) {
  const n = 25;
  const ns = 'http://www.w3.org/2000/svg';
  let seed = seedInit;
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;

  const finder = (i, j) => {
    const inBox = (r, c) => i >= r && i < r + 7 && j >= c && j < c + 7;
    const ring  = (r, c) =>
      i === r || i === r + 6 || j === c || j === c + 6 ||
      (i >= r + 2 && i <= r + 4 && j >= c + 2 && j <= c + 4);
    if (inBox(0, 0))     return ring(0, 0);
    if (inBox(0, n - 7)) return ring(0, n - 7);
    if (inBox(n - 7, 0)) return ring(n - 7, 0);
    return null;
  };

  const cells = [];
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      if (svg.classList.contains('ps-qr') && i >= 10 && i <= 14 && j >= 10 && j <= 14) continue;
      const f = finder(i, j);
      const on = f !== null ? f : rnd() > 0.52;
      if (on) cells.push(`M${j} ${i}h1.05v1.05h-1.05z`);
    }
  }
  const path = document.createElementNS(ns, 'path');
  path.setAttribute('d', cells.join(''));
  path.setAttribute('fill', '#0a0a0a');
  svg.appendChild(path);
}
document.querySelectorAll('.ps-qr').forEach((s) => drawQr(s, 1337));
document.querySelectorAll('.mini-qr').forEach((s) => drawQr(s, 7331));
document.querySelectorAll('.uc-qr').forEach((s) => drawQr(s, 4242));

// ── Live scenes ─────────────────────────────────────────────
// Everything plays on its own while on screen; hovering a scene nudges
// it to act immediately. No clicking required anywhere.
const sceneVis = new WeakMap();
const sceneIo = new IntersectionObserver((entries) => {
  for (const e of entries) sceneVis.set(e.target, e.isIntersecting);
}, { threshold: 0.3 });

// auto-play loop gated by visibility + reduced motion
const autoplay = (el, fn, ms) => {
  sceneIo.observe(el);
  if (!mqReduce.matches) setInterval(() => { if (sceneVis.get(el)) fn(); }, ms);
};

// hover nudge, throttled so re-entering doesn't spam
const onHover = (el, fn, gap = 1500) => {
  let last = 0;
  el.addEventListener('pointerenter', (e) => {
    if (e.pointerType === 'touch') return;
    const now = performance.now();
    if (now - last < gap) return;
    last = now;
    fn();
  });
};

// ── Ticker — rAF loop, enough clones to always fill viewport ─
{
  const track = document.getElementById('ticker');
  if (track && !mqReduce.matches) {
    const seed = track.querySelector('.ticker-strip');
    if (seed) {
      let loopW = 0;
      let x = 0;
      let last = performance.now();
      const speed = 42;

      const fill = () => {
        loopW = seed.offsetWidth;
        if (!loopW) return;
        // viewport can be wider than one strip — need enough copies so the
        // right edge never runs out of text before the loop wraps
        const need = window.innerWidth + loopW + 64;
        while (track.scrollWidth < need) {
          const copy = seed.cloneNode(true);
          copy.setAttribute('aria-hidden', 'true');
          track.appendChild(copy);
        }
        if (x <= -loopW) x += loopW;
      };

      fill();
      addEventListener('resize', fill);
      if (document.fonts) document.fonts.ready.then(fill);

      const step = (now) => {
        const dt = Math.min((now - last) / 1000, 0.05);
        last = now;
        if (loopW > 0) {
          x -= speed * dt;
          while (x <= -loopW) x += loopW;
          track.style.transform = `translate3d(${x.toFixed(2)}px,0,0)`;
        }
        requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    }
  }
}

// 02a · pop-up stand — sales roll in on their own
{
  const box = document.getElementById('uc-popup');
  if (box) {
    const layer   = document.getElementById('popup-toasts');
    const totalEl = document.getElementById('popup-total');
    const goods = [
      ['Lemon bar', 4.0], ['2× Brownie', 7.5], ['Banana bread', 12.0],
      ['Iced latte', 5.5], ['Cinnamon roll', 4.75], ['Sticker pack', 6.0],
      ['Choc-chip cookie', 3.25], ['Pumpkin loaf', 9.0],
    ];
    let total = 23.5;
    let flip = false;

    const sale = () => {
      const [name, price] = goods[(Math.random() * goods.length) | 0];
      total += price;
      totalEl.textContent = `$${total.toFixed(2)}`;
      const toast = document.createElement('div');
      toast.className = 'sc-toast';
      const b = document.createElement('b');
      b.textContent = `+$${price.toFixed(2)}`;
      const s = document.createElement('span');
      s.textContent = name;
      toast.append(b, s);
      flip = !flip;
      toast.style[flip ? 'right' : 'left'] = `${6 + Math.random() * 9}%`;
      toast.style.top = `${14 + Math.random() * 46}%`;
      layer.appendChild(toast);
      toast.addEventListener('animationend', () => toast.remove());
      setTimeout(() => toast.remove(), 2600);   // fallback under reduced motion
    };

    autoplay(box, sale, 3800);
    onHover(box, sale);
  }
}

// 02b · tables — guests come and go, orders fire to the kitchen
{
  const grid = document.getElementById('tables-grid');
  if (grid) {
    const box     = document.getElementById('uc-tables');
    const tables  = [...grid.querySelectorAll('.sc-table')];
    const countEl = document.getElementById('tables-count');
    const ticket  = document.getElementById('tables-ticket');
    const head    = document.getElementById('ticket-head');
    const row1    = document.getElementById('ticket-row1');
    const row2    = document.getElementById('ticket-row2');
    const dishes  = ['Shakshuka', 'Truffle Fries', 'Cold Brew', 'Flat White',
                     'Halloumi Wrap', 'Granola Bowl', 'Mint Lemonade', 'Baklava'];

    const toggle = (t) => {
      const seating = !t.classList.contains('busy');
      t.classList.toggle('busy', seating);
      t.setAttribute('aria-pressed', String(seating));
      tables.forEach((o) => o.classList.remove('hot'));
      const busy = tables.filter((x) => x.classList.contains('busy')).length;
      countEl.textContent = `${busy} of ${tables.length} seated`;
      if (!seating) return;

      t.classList.add('hot');
      const a = dishes[(Math.random() * dishes.length) | 0];
      let b = a;
      while (b === a) b = dishes[(Math.random() * dishes.length) | 0];
      head.textContent = `Table ${t.textContent.trim().slice(1)} · new order`;
      row1.textContent = `${1 + ((Math.random() * 2) | 0)}× ${a}`;
      row2.textContent = `1× ${b}`;
      ticket.classList.remove('show');
      void ticket.offsetWidth;
      ticket.classList.add('show');
    };

    // lean towards seating so the room reads busy, never full or empty
    const drift = () => {
      const free = tables.filter((t) => !t.classList.contains('busy'));
      const busy = tables.filter((t) => t.classList.contains('busy'));
      const pool = free.length === 0 ? busy
                 : busy.length <= 2  ? free
                 : Math.random() < 0.65 ? free : busy;
      toggle(pool[(Math.random() * pool.length) | 0]);
    };

    tables.forEach((t) => t.addEventListener('click', () => toggle(t)));
    autoplay(box, drift, 3400);
  }
}

// 02c · temporary card — charge, fling front, back card drops in pre-filled
{
  const box   = document.getElementById('uc-tempcard');
  const stage = document.getElementById('tc-stage');
  const amtEl = document.getElementById('tc-amt');
  if (box && stage && amtEl) {
    let front = document.getElementById('tc-card-a');
    let back  = document.getElementById('tc-card-b');
    const uses = [
      ['Flight booking', '$42.00', '24h'],
      ['Hotel deposit', '$180.00', '48h'],
      ['Rideshare', '$28.50', '12h'],
      ['Online checkout', '$64.00', '6h'],
    ];
    let i = 0;
    let busy = false;

    const fill = (card) => {
      const [label, amt, exp] = uses[i % uses.length];
      i++;
      card.querySelector('.tc-num').textContent = `•••• ${1000 + ((Math.random() * 8999) | 0)}`;
      card.querySelector('.tc-label').textContent = label;
      card.querySelector('.tc-exp').textContent = exp;
      card.dataset.amt = amt;
      return amt;
    };

    const swap = () => {
      front.classList.replace('is-front', 'is-back');
      front.setAttribute('aria-hidden', 'true');
      back.classList.replace('is-back', 'is-front');
      back.removeAttribute('aria-hidden');
      [front, back] = [back, front];
    };

    const wait = (ms) => new Promise((r) => setTimeout(r, ms));

    fill(back);
    fill(front);

    const cycle = async () => {
      if (busy) return;
      busy = true;
      stage.className = 'tc-stage';
      amtEl.textContent = front.dataset.amt;

      await wait(900);
      stage.classList.add('phase-charged');

      await wait(1100);
      stage.classList.add('phase-fling');

      await wait(560);
      front.classList.add('is-out');
      stage.classList.remove('phase-charged', 'phase-fling');
      stage.classList.add('phase-drop');

      await wait(30);
      stage.classList.add('slide');

      await wait(900);
      front.classList.remove('is-out');
      stage.className = 'tc-stage';
      swap();
      fill(back);
      busy = false;
    };

    autoplay(box, cycle, 5200);
    onHover(box, cycle, 3000);
    cycle();
  }
}

// 02d · analytics — the days roll by on their own
{
  const box = document.getElementById('uc-chart');
  if (box) {
    const bars    = [...box.querySelectorAll('.sc-bar')];
    const insight = document.getElementById('chart-insight');
    const days = [
      { h: [34, 58, 96, 74, 42, 55, 66], note: 'Peak 8–9am · avg basket $11.20 · oat milk low' },
      { h: [22, 40, 52, 61, 88, 97, 70], note: 'Lunch rush 11–12 · avg basket $14.60 · 86 orders' },
      { h: [45, 72, 60, 38, 30, 52, 90], note: 'Late spike at noon · croissants gone by 9:40am' },
      { h: [18, 30, 44, 68, 80, 64, 48], note: 'Slow open · worth a pastry combo before 8am' },
    ];
    let day = 0;

    const next = () => {
      day = (day + 1) % days.length;
      const d = days[day];
      const peak = d.h.indexOf(Math.max(...d.h));
      bars.forEach((bar, i) => {
        bar.style.setProperty('--h', `${d.h[i]}%`);
        bar.dataset.v = `$${Math.round(d.h[i] * 2.6 + 8)}`;
        bar.classList.toggle('peak', i === peak);
      });
      insight.classList.add('swap');
      setTimeout(() => { insight.textContent = d.note; insight.classList.remove('swap'); }, 250);
    };

    autoplay(box, next, 5200);
    onHover(box, next, 2500);
  }
}

// ── 03 · split the bill — items pass themselves around ──────
{
  const list = document.getElementById('split-list');
  if (list) {
    const ownerCls = ['o0', 'o1', 'o2'];
    const initials = ['A', 'J', 'S'];
    const items  = [...list.querySelectorAll('.ps-item')];
    const shares = [...document.querySelectorAll('[data-share]')];
    const mine   = document.getElementById('split-mine');

    const recalc = () => {
      const totals = [0, 0, 0];
      items.forEach((it) => { totals[+it.dataset.owner] += parseFloat(it.dataset.price); });
      shares.forEach((el, i) => {
        const txt = `$${totals[i].toFixed(2)}`;
        if (el.textContent !== txt) {
          el.textContent = txt;
          el.classList.remove('bump');
          void el.offsetWidth;
          el.classList.add('bump');
        }
      });
      mine.textContent = `$${totals[0].toFixed(2)}`;
    };

    const pass = (it) => {
      const next = (+it.dataset.owner + 1) % 3;
      it.dataset.owner = String(next);
      const chip = it.querySelector('.ps-claimer');
      chip.classList.remove(...ownerCls, 'pop');
      void chip.offsetWidth;
      chip.classList.add(ownerCls[next], 'pop');
      chip.textContent = initials[next];
      recalc();
    };

    items.forEach((it) => it.addEventListener('click', () => pass(it)));
    autoplay(list, () => pass(items[(Math.random() * items.length) | 0]), 3000);
  }
}

// ── 04 · AI cards: demos replay on their own ────────────────
const replay = (el) => { el.classList.remove('play'); void el.offsetWidth; el.classList.add('play'); };

{
  const shot = document.getElementById('ai-shot');
  if (shot) {
    autoplay(shot, () => replay(shot), 7000);
    onHover(shot, () => replay(shot), 2500);
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { replay(shot); io.disconnect(); }
    }, { threshold: 0.5 });
    io.observe(shot);
  }
}

{
  const brief = document.getElementById('ai-brief');
  if (brief) {
    const rev = document.getElementById('ab-rev');
    const ord = document.getElementById('ab-ord');
    const countUp = (el, fmt) => {
      const target = parseInt(el.dataset.target, 10);
      if (reduceMotion) { el.textContent = fmt(target); return; }
      const t0 = performance.now();
      const dur = 900;
      const tick = (t) => {
        const p = Math.min((t - t0) / dur, 1);
        el.textContent = fmt(Math.round(target * (1 - Math.pow(1 - p, 3))));
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    };
    const play = () => {
      replay(brief);
      countUp(rev, (v) => `$${v.toLocaleString('en-US')}`);
      countUp(ord, (v) => String(v));
    };
    autoplay(brief, play, 8500);
    onHover(brief, play, 3000);
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { play(); io.disconnect(); }
    }, { threshold: 0.5 });
    io.observe(brief);
  }
}

// ── AI suggestions: accept themselves one by one, then reset ─
{
  const sugs   = [...document.querySelectorAll('.sug')];
  const payoff = document.getElementById('sug-payoff');
  const wrap   = document.querySelector('.ai-sugs');

  const update = () => {
    if (!payoff) return;
    let sum = 0, n = 0;
    sugs.forEach((s) => { if (s.classList.contains('done')) { sum += +(s.dataset.val || 0); n++; } });
    payoff.classList.toggle('lit', n > 0);
    payoff.innerHTML = n
      ? `<b>≈ $${sum}</b>/wk reclaimed · ${n} accepted`
      : `<b>$0</b>/wk reclaimed`;
  };

  sugs.forEach((el) => el.addEventListener('click', () => { el.classList.toggle('done'); update(); }));

  if (wrap && sugs.length) {
    let rest = 0;   // idle beats after all are accepted, before resetting
    autoplay(wrap, () => {
      const open = sugs.find((s) => !s.classList.contains('done'));
      if (open) {
        rest = 0;
        open.classList.add('done');
      } else if (++rest >= 2) {
        rest = 0;
        sugs.forEach((s) => s.classList.remove('done'));
      }
      update();
    }, 1700);
  }
}

// ── Waitlist form ───────────────────────────────────────────
const form  = document.getElementById('wl-form');
const email = document.getElementById('wl-email');
const btn   = document.getElementById('wl-btn');
const msg   = document.getElementById('wl-msg');

function show(text, isError = false) {
  msg.textContent = text;
  msg.classList.toggle('error', isError);
  msg.classList.add('show');
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  msg.classList.remove('show');

  const value = email.value.trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
    show('Please enter a valid email address.', true);
    email.focus();
    return;
  }

  btn.disabled = true;
  btn.firstElementChild.textContent = 'Joining…';

  try {
    if (WAITLIST_ENDPOINT) {
      const res = await fetch(WAITLIST_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ email: value }),
      });
      if (!res.ok) throw new Error('Request failed');
    } else {
      await new Promise((r) => setTimeout(r, 600));
      console.warn('[zer0] WAITLIST_ENDPOINT not set — submission not stored.');
    }
    form.reset();
    show("You're on the list. We'll be in touch.");
    btn.firstElementChild.textContent = 'Joined ✓';
  } catch {
    show('Something went wrong — please try again.', true);
    btn.disabled = false;
    btn.firstElementChild.textContent = 'Join waitlist';
  }
});
