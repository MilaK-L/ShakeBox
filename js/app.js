(() => {
  'use strict';

  const MAX_BALLS = 10;
  const BALL = [['#FFB8A8', '#F08C78'], ['#A8E0C8', '#6CC29E'], ['#C9B8F2', '#9C86DE'], ['#FFE08A', '#F2BE45'], ['#A9D6F5', '#6FB2E6'], ['#F8B8D8', '#E78AB8']];
  const TILE = [['#FFD3C7', '#F5B5A5'], ['#C9EEDD', '#A6DCC4'], ['#DDD2F7', '#C0B1EE'], ['#FFEBB0', '#F2D27A'], ['#CBE6F8', '#A6D0EF'], ['#FAD0E4', '#EFADCD']];
  const HERO = [
    { s: 30, l: 76, t: 12, c: BALL[0], delay: 0 },
    { s: 26, l: 137, t: 0, c: BALL[3], delay: .5 },
    { s: 28, l: 194, t: -12, c: BALL[4], delay: 1 },
    { s: 26, l: -15, t: 97, c: BALL[1], delay: 1.5 },
    { s: 27, r: 10, t: 72, c: BALL[5], delay: 2 },
  ];
  const CONFETTI = ['#FFB8A8', '#A8E0C8', '#C9B8F2', '#FFE08A', '#A9D6F5', '#F8B8D8'];

  const I18N = {
    en: {
      appName: 'Shake Box', tagline: 'Shake, peek, and find the hiding balls!', pick: 'How many balls go into the box?',
      surprise: 'Surprise', balls: 'balls', orPhone: 'or shake your phone', shake: 'Shake!', again: 'Shake again!',
      back: 'Back', stars: 'Stars',
      ready: (s) => ['Shake the box!', `There are ${s.total} balls inside`],
      shaking: () => ['Shake, shake, shake…', 'Listen to them rattle'],
      question: (s, seen, wrong) => [wrong ? 'Almost! Count again' : 'How many are hiding?', `You can see ${seen}. Total is ${s.total}`],
      correct: (s, hidden) => ['Yes! You got it!', hidden === 1 ? '1 ball was hiding' : `${hidden} balls were hiding`],
    },
    de: {
      appName: 'Schüttelbox', tagline: 'Schütteln, gucken und die versteckten Kugeln finden!', pick: 'Wie viele Kugeln kommen in die Box?',
      surprise: 'Überraschung', balls: 'Kugeln', orPhone: 'oder schüttle dein Handy', shake: 'Schütteln!', again: 'Nochmal!',
      back: 'Zurück', stars: 'Sterne',
      ready: (s) => ['Schüttle die Box!', `Es sind ${s.total} Kugeln drin`],
      shaking: () => ['Schütteln, schütteln…', 'Hör, wie sie klappern'],
      question: (s, seen, wrong) => [wrong ? 'Fast! Zähl nochmal' : 'Wie viele verstecken sich?', `Du siehst ${seen}. Insgesamt ${s.total}`],
      correct: (s, hidden) => ['Super! Richtig!', hidden === 1 ? '1 Kugel hat sich versteckt' : `${hidden} Kugeln haben sich versteckt`],
    },
  };

  const store = {
    get(k, d) { try { return localStorage.getItem(k) ?? d; } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* storage unavailable */ } },
  };

  const state = {
    screen: 'home', total: 10, phase: 'ready', left: 0, right: 0, side: 'L', wrong: [], stars: 0,
    lang: store.get('shakebox-lang', 'en') === 'de' ? 'de' : 'en',
  };
  let jig = null;
  let settle = null;

  const phone = document.getElementById('phone');
  const stage = document.getElementById('stage');
  const t = () => I18N[state.lang];
  const rand = (n) => Math.floor(Math.random() * n);
  const grad = ([a, b], hi = 10) => `radial-gradient(circle at 34% 30%, #fff 0 ${hi}%, ${a} 36%, ${b} 100%)`;

  function el(tag, cls, text) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }

  function starsPill() {
    const p = el('div', 'pill pill-stars');
    p.setAttribute('aria-label', t().stars);
    p.append(el('span', 'star', '★'), String(state.stars));
    return p;
  }

  // 3x5 grid of slots per compartment, shuffled, with a little jitter
  function scatter(n) {
    const cells = [];
    for (let r = 0; r < 5; r++) for (let c = 0; c < 3; c++) cells.push([c, r]);
    for (let i = cells.length - 1; i > 0; i--) { const j = rand(i + 1); [cells[i], cells[j]] = [cells[j], cells[i]]; }
    return cells.slice(0, n).map(([c, r]) => ({
      x: 6 + c * 44 + Math.random() * 10,
      y: 8 + r * 49 + Math.random() * 10,
      bg: grad(BALL[rand(BALL.length)], 9),
    }));
  }

  /* ---------- Fit the 390px design to the screen ---------- */
  function fit() {
    stage.style.zoom = 1;
    const need = stage.scrollHeight;
    const s = Math.min(1, phone.clientWidth / 390, phone.clientHeight / need);
    stage.style.zoom = s;
  }
  window.addEventListener('resize', fit);

  /* ---------- Home ---------- */
  function renderHome() {
    const tx = t();
    document.documentElement.lang = state.lang;
    const home = el('div', 'home');

    const top = el('div', 'home-top');
    const lang = el('div', 'lang');
    lang.setAttribute('role', 'group');
    for (const [k, label] of [['en', 'EN'], ['de', 'DE']]) {
      const b = el('button', null, label);
      b.setAttribute('aria-pressed', String(state.lang === k));
      b.addEventListener('click', () => { state.lang = k; store.set('shakebox-lang', k); renderHome(); });
      lang.append(b);
    }
    top.append(lang, starsPill());

    const hero = el('div', 'hero');
    const art = el('div', 'hero-art');
    art.setAttribute('aria-hidden', 'true');
    const box = el('div', 'hero-box');
    const q1 = el('div', null, '?'); q1.style.background = '#C9B8F2';
    const q2 = el('div', null, '?'); q2.style.background = '#A8E0C8';
    box.append(q1, q2);
    art.append(box);
    for (const h of HERO) {
      const b = el('span', 'ball');
      Object.assign(b.style, {
        width: h.s + 'px', height: h.s + 'px', top: h.t + 'px', background: grad(h.c),
        animationDelay: h.delay + 's',
      });
      if (h.r != null) b.style.right = h.r + 'px'; else b.style.left = h.l + 'px';
      art.append(b);
    }
    hero.append(art, el('h1', 'app-name', tx.appName), el('div', 'tagline', tx.tagline));

    const levels = el('div', 'levels');
    for (let n = 3; n <= MAX_BALLS; n++) {
      const [bg, shade] = TILE[(n - 3) % TILE.length];
      const b = el('button', 'level');
      b.style.background = bg;
      b.style.boxShadow = `0 5px 0 ${shade}`;
      b.setAttribute('aria-label', `${n} ${tx.balls}`);
      const dots = el('span', 'level-dots');
      for (let i = 0; i < n; i++) dots.append(el('span'));
      b.append(el('span', 'level-n', String(n)), dots);
      b.addEventListener('click', () => start(n));
      levels.append(b);
    }
    const sur = el('button', 'surprise');
    sur.append(el('span', null, '?'), tx.surprise);
    sur.addEventListener('click', () => start(3 + rand(MAX_BALLS - 2)));
    levels.append(sur);

    home.append(top, hero, el('div', 'pick', tx.pick), levels);
    stage.replaceChildren(home);
    fit();
  }

  /* ---------- Game ---------- */
  let g = null;

  function buildGame() {
    const tx = t();
    const game = el('div', 'game');

    const top = el('div', 'game-top');
    const back = el('button', 'back', '‹');
    back.setAttribute('aria-label', tx.back);
    back.addEventListener('click', goHome);
    const total = el('div', 'pill pill-total');
    const totalBall = el('span', 'ball');
    totalBall.style.background = grad(BALL[0]);
    total.append(totalBall, `${state.total} ${tx.balls}`);
    const stars = el('div');
    top.append(back, total, stars);

    const prompt = el('div', 'prompt');
    prompt.setAttribute('aria-live', 'polite');
    const title = el('div', 'prompt-title');
    const sub = el('div', 'prompt-sub');
    prompt.append(title, sub);

    const wrap = el('div', 'box-wrap');
    const box = el('div', 'box');
    box.addEventListener('click', shake);
    const mkSide = (cls) => {
      const side = el('div', 'side');
      const balls = el('div');
      const lid = el('div', 'lid ' + cls);
      lid.append(el('div', null, '?'));
      side.append(balls, lid);
      return { side, balls, lid };
    };
    const L = mkSide('lid-l');
    const R = mkSide('lid-r');
    const badge = el('div', 'badge', String(state.total));
    box.append(L.side, R.side, badge);
    wrap.append(box);

    const eq = el('div', 'equation');
    const eqL = el('div', 'eq eq-l');
    const eqR = el('div', 'eq eq-r');
    eq.append(eqL, el('span', 'op', '+'), eqR, el('span', 'op', '='), el('div', 'eq eq-t', String(state.total)));

    const controls = el('div', 'controls');
    const shakeBtn = el('button', 'shake-btn');
    shakeBtn.addEventListener('click', shake);
    const orPhone = el('div', 'or-phone', tx.orPhone);
    const pad = el('div', 'pad');
    controls.append(shakeBtn, orPhone, pad);

    game.append(top, prompt, wrap, eq, controls);
    stage.replaceChildren(game);
    g = { stars, title, sub, box, L, R, badge, eqL, eqR, shakeBtn, orPhone, pad };
  }

  function drawBalls(container, list) {
    container.replaceChildren(...list.map((p) => {
      const b = el('div', 'ball');
      Object.assign(b.style, { left: p.x + 'px', top: p.y + 'px', background: p.bg });
      return b;
    }));
  }

  function updateGame() {
    const s = state;
    const tx = t();
    const q = s.phase === 'question';
    const ok = s.phase === 'correct';
    const open = q || ok;
    const showL = open && (s.side === 'L' || ok);
    const showR = open && (s.side === 'R' || ok);
    const seen = s.side === 'L' ? s.left : s.right;
    const hidden = s.side === 'L' ? s.right : s.left;

    g.stars.replaceWith(g.stars = starsPill());
    const [title, sub] = tx[s.phase](s, s.phase === 'correct' ? hidden : seen, s.wrong.length > 0);
    g.title.textContent = title;
    g.sub.textContent = sub;

    g.L.lid.classList.toggle('open', showL);
    g.R.lid.classList.toggle('open', showR);
    if (!open) { g.L.balls.replaceChildren(); g.R.balls.replaceChildren(); }
    g.badge.hidden = open;
    g.eqL.textContent = showL ? s.left : '?';
    g.eqR.textContent = showR ? s.right : '?';

    const canShake = !q;
    g.shakeBtn.hidden = !canShake;
    g.orPhone.hidden = !canShake;
    g.shakeBtn.textContent = ok ? tx.again : tx.shake;
    g.pad.hidden = !q;
    if (q) renderPad();
  }

  function renderPad() {
    const last = state.wrong[state.wrong.length - 1];
    g.pad.replaceChildren(...Array.from({ length: state.total + 1 }, (_, n) => {
      const b = el('button', null, String(n));
      if (state.wrong.includes(n)) b.classList.add('wrong');
      if (n === last) b.classList.add('wiggle');
      b.addEventListener('click', () => answer(n));
      return b;
    }));
  }

  function stopTimers() { clearInterval(jig); clearTimeout(settle); }

  function start(n) {
    stopTimers();
    askMotionPermission();
    Object.assign(state, { screen: 'game', total: n, phase: 'ready', wrong: [] });
    buildGame();
    updateGame();
    fit();
  }

  function goHome() {
    stopTimers();
    clearConfetti();
    state.screen = 'home';
    g = null;
    renderHome();
  }

  function shake() {
    const s = state;
    if (s.screen !== 'game' || s.phase === 'shaking' || s.phase === 'question') return;
    const n = s.total;
    const left = n <= 2 ? rand(n + 1) : 1 + rand(n - 1);
    const side = Math.random() < .5 ? 'L' : 'R';
    clearConfetti();
    Object.assign(s, { phase: 'shaking', wrong: [] });
    updateGame();

    g.box.classList.remove('shaking');
    void g.box.offsetWidth;
    g.box.classList.add('shaking');
    try { navigator.vibrate && navigator.vibrate([60, 40, 60, 40, 60]); } catch (e) { /* unsupported */ }

    // Balls jiggle under the closed lids while shaking
    jig = setInterval(() => {
      drawBalls(g.L.balls, scatter(Math.ceil(n / 2)));
      drawBalls(g.R.balls, scatter(Math.floor(n / 2)));
    }, 110);
    settle = setTimeout(() => {
      clearInterval(jig);
      g.box.classList.remove('shaking');
      Object.assign(s, { phase: 'question', left, right: n - left, side });
      drawBalls(g.L.balls, scatter(left));
      drawBalls(g.R.balls, scatter(n - left));
      updateGame();
    }, 1150);
  }

  function answer(n) {
    const s = state;
    if (s.phase !== 'question') return;
    const hidden = s.side === 'L' ? s.right : s.left;
    if (n === hidden) {
      s.phase = 'correct';
      s.stars += 1;
      updateGame();
      celebrate();
    } else if (!s.wrong.includes(n)) {
      s.wrong.push(n);
      updateGame();
    }
  }

  function clearConfetti() { phone.querySelectorAll('.confetti').forEach((c) => c.remove()); }

  function celebrate() {
    clearConfetti();
    const layer = el('div', 'confetti');
    layer.setAttribute('aria-hidden', 'true');
    layer.style.setProperty('--fall', (phone.clientHeight + 20) + 'px');
    const w = phone.clientWidth - 20;
    for (let i = 0; i < 26; i++) {
      const c = el('div');
      const size = 8 + Math.random() * 8;
      Object.assign(c.style, {
        left: Math.random() * w + 'px', width: size + 'px', height: size + 'px',
        borderRadius: Math.random() < .5 ? '50%' : '3px', background: CONFETTI[rand(CONFETTI.length)],
      });
      c.style.setProperty('--d', (1.4 + Math.random() * 1.2).toFixed(2) + 's');
      c.style.setProperty('--delay', (Math.random() * .5).toFixed(2) + 's');
      layer.append(c);
    }
    phone.append(layer);
  }

  /* ---------- Device shake ---------- */
  let motionAsked = false;
  function askMotionPermission() {
    if (motionAsked) return;
    motionAsked = true;
    const DME = window.DeviceMotionEvent;
    if (DME && typeof DME.requestPermission === 'function') DME.requestPermission().catch(() => {});
  }
  window.addEventListener('devicemotion', (e) => {
    const a = e.accelerationIncludingGravity;
    if (!a) return;
    if (Math.abs(a.x || 0) + Math.abs(a.y || 0) + Math.abs(a.z || 0) > 32) shake();
  });

  renderHome();
  if (document.fonts) document.fonts.ready.then(fit);

  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
  }
})();
