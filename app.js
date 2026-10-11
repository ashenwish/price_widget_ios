'use strict';

// ---------- данные по умолчанию (₽, ориентировочно — правится в ⚙) ----------
const CATS = ['Предметка', 'Персонаж', 'Интерьер', 'Архвиз', 'Продукт', 'Игровые ассеты', 'Анимация', 'Unreal 5', 'Веб и дизайн', 'Почасово'];
// тип блока: lv — три уровня сложности, single — одна цена, hour — ставка за час
const TYPES = { lv: 'Три уровня', single: 'Одна цена', hour: 'За час' };
const LV = ['Лёгк.', 'Средн.', 'Сложн.'];
const LV_FULL = ['лёгкое', 'среднее', 'сложное'];

const DEFAULT_CATALOG = [
  ['Предметка', 'Моделирование предмета', 2000, 5000, 12000],
  ['Предметка', 'Текстуры и материалы', 1000, 3000, 7000],
  ['Интерьер', 'Моделирование интерьера', 8000, 20000, 45000],
  ['Интерьер', 'Свет и расстановка', 3000, 7000, 15000],
  ['Архвиз', 'Моделирование экстерьера', 15000, 40000, 100000],
  ['Архвиз', 'Окружение и ландшафт', 5000, 15000, 40000],
  ['Продукт', 'Рендер (кадр)', 800, 2000, 5000],
  ['Продукт', 'Студийная сцена и свет', 2000, 5000, 12000],
  ['Анимация', 'Анимация (секунда)', 1500, 3500, 8000],
  ['Анимация', 'Постпродакшн / монтаж', 2000, 6000, 15000],
  ['Игровые ассеты', 'Low-poly ассет', 1500, 4000, 9000],
  ['Игровые ассеты', 'High→Low + запекание', 2500, 6000, 12000],
  ['Игровые ассеты', 'Риг и скиннинг', 3000, 8000, 20000],
  ['Unreal 5', 'Интерактивная сцена', 30000, 80000, 200000],
  ['Unreal 5', 'Логика (Blueprints)', 10000, 30000, 80000],
  ['Веб и дизайн', 'Лендинг', 15000, 35000, 80000],
  ['Веб и дизайн', 'Многостраничный сайт', 40000, 90000, 200000],
  ['Веб и дизайн', 'UI / графический дизайн', 3000, 8000, 20000],
  ['Веб и дизайн', 'Телеграм-бот', 8000, 25000, 70000],
  ['Почасово', 'Работа по часам', 1500, 0, 0, 'hour'],
  ['Почасово', 'Правки', 1000, 0, 0, 'hour'],
  ['Персонаж', 'Моделирование персонажа', 10000, 30000, 80000, 'lv', 40, 'c1'],
  ['Персонаж', 'Моделирование одежды', 4000, 10000, 25000, 'lv', 40, 'c2'],
  // [категория, название, цены ×3, тип, game ready %, id] — новые блоки добавляй только в конец списка
].map((a, i) => ({ id: a[7] || (a[5] === 'hour' ? 'h' : 'd') + i, cat: a[0], name: a[1], p: [a[2], a[3], a[4]], type: a[5] || 'lv', gr: a[6] || 0 }));
DEFAULT_CATALOG[0].gr = 40; // моделирование предмета

const DEFAULT_SETTINGS = {
  urg: 0, rig: 0, wear: 5, dis: 0, prem: false, tax: false, taxRate: 4,
  cur: 'RUB', rates: { USD: 90, EUR: 100 }, open: true, pin: false,
};

// ---------- состояние ----------
function cloneDefaults() { return JSON.parse(JSON.stringify(DEFAULT_CATALOG)); }
function load(key, def) {
  try { const v = JSON.parse(localStorage.getItem(key)); return v == null ? def : v; } catch { return def; }
}
function save() {
  try {
    localStorage.setItem('pw_catalog', JSON.stringify(state.catalog));
    localStorage.setItem('pw_lines', JSON.stringify(state.lines));
    localStorage.setItem('pw_set', JSON.stringify(state.set));
  } catch {}
}
const state = {
  catalog: load('pw_catalog', null) || cloneDefaults(),
  lines: load('pw_lines', []),
  set: Object.assign({}, DEFAULT_SETTINGS, load('pw_set', {})),
  cat: 'Все',
};
state.set.rates = Object.assign({}, DEFAULT_SETTINGS.rates, state.set.rates);

const isHour = (it) => it.type === 'hour';
const hasLv = (it) => it.type === 'lv';
const basePrice = (it, l) => (hasLv(it) ? it.p[l.level] : it.p[0]);
const qtyStr = (it, q) => (isHour(it) ? String(q).replace('.', ',') + ' ч' : String(q));

const $ = (id) => document.getElementById(id);
const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };
const fmt = (n) => Math.round(n).toLocaleString('ru-RU').replace(/ /g, ' ');
const SYM = { RUB: '₽', USD: '$', EUR: '€' };
const money = (rub) => {
  const c = state.set.cur;
  const v = c === 'RUB' ? rub : rub / state.set.rates[c];
  return c === 'RUB' ? fmt(v) + ' ₽' : (Math.round(v * 100) / 100).toLocaleString('ru-RU', { minimumFractionDigits: 0, maximumFractionDigits: 2 }) + ' ' + SYM[c];
};
const itemById = (id) => state.catalog.find((x) => x.id === id);
const uid = () => 'i' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

// миграция с v1: single:true → type, старые «Правки (час)» → почасовые
state.catalog.forEach((it) => {
  if (!it.type) it.type = it.single ? (/час/i.test(it.name) ? 'hour' : 'single') : 'lv';
  delete it.single;
});
// v3: почасовые блоки, персонаж/одежда и game ready у существующих блоков
if (!load('pw_v3', false)) {
  const defs = cloneDefaults();
  state.catalog.forEach((it) => { if (it.gr == null) it.gr = (defs.find((d) => d.id === it.id) || {}).gr || 0; });
  defs.filter((d) => d.id[0] !== 'd' && !itemById(d.id)).forEach((d) => state.catalog.push(d));
  try { localStorage.setItem('pw_v3', '1'); } catch {}
  save();
}

let toastT;
function toast(msg) {
  const t = $('toast'); t.textContent = msg; t.classList.add('show');
  clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('show'), 1800);
}
function fillRange(r) { r.style.setProperty('--v', ((r.value - r.min) / (r.max - r.min)) * 100 + '%'); }

// ---------- расчёт ----------
function lineSum(l) {
  const it = itemById(l.itemId); if (!it) return 0;
  return basePrice(it, l) * l.qty * l.mult * (l.gr && it.gr > 0 ? 1 + it.gr / 100 : 1);
}
function calc() {
  const s = state.set;
  const work = state.lines.reduce((a, l) => a + lineSum(l), 0);
  const urg = work * s.urg / 100;
  const rig = work * s.rig / 100;
  const prem = s.prem ? work * 0.25 : 0;
  const wear = work * s.wear / 100;
  const sub = work + urg + rig + prem + wear;
  const dis = sub * s.dis / 100;
  const net = sub - dis;
  const tax = s.tax ? net * s.taxRate / 100 : 0;
  return { work, urg, rig, prem, wear, dis, tax, total: net + tax };
}

// ---------- библиотека ----------
function renderChips() {
  const box = $('chips'); box.innerHTML = '';
  ['Все', ...CATS].forEach((c) => {
    const b = el('button', 'chip' + (state.cat === c ? ' on' : ''), c);
    b.onclick = () => { state.cat = c; renderChips(); renderLib(); };
    box.appendChild(b);
  });
}
function priceHint(it) {
  if (isHour(it)) return fmt(it.p[0]) + ' ₽/ч';
  return hasLv(it) ? fmt(it.p[0]) + ' – ' + fmt(it.p[2]) + ' ₽' : fmt(it.p[0]) + ' ₽';
}
function renderLib() {
  const box = $('libList'); box.innerHTML = '';
  state.catalog.filter((it) => state.cat === 'Все' || it.cat === state.cat).forEach((it) => {
    const b = el('div', 'blk'); b.draggable = true;
    b.append(el('span', 'n', it.name), el('span', 'p', priceHint(it)));
    const a = el('button', 'add', '+'); a.onclick = () => addLine(it.id);
    b.appendChild(a);
    b.addEventListener('dragstart', (e) => { e.dataTransfer.setData('text/plain', it.id); e.dataTransfer.effectAllowed = 'copy'; });
    b.addEventListener('dblclick', () => addLine(it.id));
    box.appendChild(b);
  });
}

// ---------- смета ----------
let justAdded = null;
function addLine(itemId) {
  const ex = state.lines.find((l) => l.itemId === itemId && l.level === 1 && l.mult === 1 && !l.gr);
  if (ex) ex.qty++;
  else { justAdded = uid(); state.lines.push({ uid: justAdded, itemId, level: 1, qty: 1, mult: 1 }); }
  save(); renderLines(); justAdded = null;
  const d = $('drop'); d.scrollTop = d.scrollHeight;
}
function renderLines() {
  state.lines = state.lines.filter((l) => itemById(l.itemId));
  const box = $('lines'); box.innerHTML = '';
  $('hint').classList.toggle('hide', state.lines.length > 0);
  state.lines.forEach((l) => {
    const it = itemById(l.itemId);
    const row = el('div', l.uid === justAdded ? 'line new' : 'line');

    const l1 = el('div', 'l1');
    const pr = el('span', 'pr', money(lineSum(l)));
    const x = el('button', 'x', '✕'); x.onclick = () => { state.lines = state.lines.filter((q) => q !== l); save(); renderLines(); };
    l1.append(el('span', 'n', it.name), pr, x);

    const l2 = el('div', 'l2');
    if (hasLv(it)) {
      const lv = el('div', 'lv');
      LV.forEach((t, i) => {
        const b = el('button', l.level === i ? 'on' : '', t);
        b.onclick = () => { l.level = i; save(); renderLines(); };
        lv.appendChild(b);
      });
      l2.appendChild(lv);
    }
    const q = el('div', 'qty');
    const step = isHour(it) ? 0.5 : 1;
    const qn = el('span', '', qtyStr(it, l.qty));
    const mn = el('button', '', '−'); mn.onclick = () => { l.qty = Math.max(step, l.qty - step); save(); renderLines(); };
    const pl = el('button', '', '+'); pl.onclick = () => { l.qty += step; save(); renderLines(); };
    q.append(mn, qn, pl);
    l2.appendChild(q);

    const m = el('div', 'mult');
    const mr = el('input'); mr.type = 'range'; mr.min = 0.5; mr.max = 3; mr.step = 0.1; mr.value = l.mult;
    const mv = el('b', '', '×' + l.mult.toFixed(1));
    fillRange(mr);
    mr.oninput = () => { l.mult = parseFloat(mr.value); mv.textContent = '×' + l.mult.toFixed(1); fillRange(mr); pr.textContent = money(lineSum(l)); save(); renderTotals(); };
    m.append(el('span', '', 'сложность'), mr, mv);

    row.append(l1, l2, m);
    if (it.gr > 0 && !isHour(it)) {
      const g = el('label', 'chk');
      const gc = el('input'); gc.type = 'checkbox'; gc.checked = !!l.gr;
      gc.onchange = () => { l.gr = gc.checked; save(); renderLines(); };
      g.append(gc, el('i'), document.createTextNode('Game ready +' + it.gr + '%'));
      row.appendChild(g);
    }
    box.appendChild(row);
  });
  renderTotals();
}

// drag & drop
const drop = $('drop');
drop.addEventListener('dragover', (e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'copy'; drop.classList.add('over'); });
drop.addEventListener('dragleave', (e) => { if (!drop.contains(e.relatedTarget)) drop.classList.remove('over'); });
drop.addEventListener('drop', (e) => {
  e.preventDefault(); drop.classList.remove('over');
  const id = e.dataTransfer.getData('text/plain');
  if (itemById(id)) addLine(id);
});
document.addEventListener('dragover', (e) => e.preventDefault());
document.addEventListener('drop', (e) => e.preventDefault());

// ---------- итоги ----------
function renderTotals() {
  const c = calc(), s = state.set;
  const rows = $('rows'); rows.innerHTML = '';
  const add = (label, v, sign) => {
    if (!v) return;
    const d = el('div'); d.append(el('span', '', label), el('span', '', (sign || '') + money(v)));
    rows.appendChild(d);
  };
  add('Работы', c.work);
  add('Срочность +' + s.urg + '%', c.urg, '+');
  add('Права +' + s.rig + '%', c.rig, '+');
  add('Премиум +25%', c.prem, '+');
  add('Износ оборудования ' + s.wear + '%', c.wear, '+');
  add('Скидка −' + s.dis + '%', c.dis, '−');
  add('Налог ' + s.taxRate + '%', c.tax, '+');
  $('total').textContent = money(c.total);
}

// ---------- настройки ----------
function bindRange(id, valId, key) {
  const r = $(id), v = $(valId);
  r.value = state.set[key]; v.textContent = r.value + '%'; fillRange(r);
  r.oninput = () => { state.set[key] = parseFloat(r.value); v.textContent = r.value + '%'; fillRange(r); save(); renderTotals(); };
}
function initSettings() {
  bindRange('sUrg', 'vUrg', 'urg');
  bindRange('sRig', 'vRig', 'rig');
  bindRange('sWear', 'vWear', 'wear');
  bindRange('sDis', 'vDis', 'dis');
  $('cPrem').checked = state.set.prem;
  $('cPrem').onchange = (e) => { state.set.prem = e.target.checked; save(); renderTotals(); };
  $('cTax').checked = state.set.tax;
  $('cTax').onchange = (e) => { state.set.tax = e.target.checked; save(); renderTotals(); };
  $('selTax').value = String(state.set.taxRate);
  $('selTax').onchange = (e) => { state.set.taxRate = parseInt(e.target.value, 10); save(); renderTotals(); };

  const applyOpen = () => { $('setBody').classList.toggle('closed', !state.set.open); $('togArrow').textContent = state.set.open ? '▾' : '▸'; };
  applyOpen();
  $('togSet').onclick = () => { state.set.open = !state.set.open; save(); applyOpen(); };

  const applyCur = () => {
    const c = state.set.cur;
    document.querySelectorAll('#curSeg button').forEach((b) => b.classList.toggle('on', b.dataset.c === c));
    $('rateBox').classList.toggle('off', c === 'RUB');
    if (c !== 'RUB') $('rate').value = state.set.rates[c];
    $('rateBox').lastChild.textContent = ' ₽ за ' + SYM[c === 'RUB' ? 'USD' : c];
    renderLines();
  };
  document.querySelectorAll('#curSeg button').forEach((b) => { b.onclick = () => { state.set.cur = b.dataset.c; save(); applyCur(); }; });
  $('rate').oninput = (e) => {
    const v = parseFloat(e.target.value);
    if (v > 0) { state.set.rates[state.set.cur] = v; save(); renderLines(); }
  };
  applyCur();
}

// ---------- текст для клиента ----------
function clientText() {
  const c = calc(), s = state.set, n = state.lines.length;
  const L = [];
  L.push('РАСЧЁТ СТОИМОСТИ РАБОТ');
  L.push(new Date().toLocaleDateString('ru-RU'));
  L.push('');
  state.lines.forEach((l, i) => {
    const it = itemById(l.itemId);
    const lvl = hasLv(it) ? ' (' + LV_FULL[l.level] + ')' : '';
    const unit = basePrice(it, l) * (l.gr && it.gr > 0 ? 1 + it.gr / 100 : 1); // цена за единицу уже с game ready
    const k = l.mult !== 1 ? ' × коэф. ' + l.mult.toFixed(1) : '';
    L.push((i + 1) + '. ' + it.name + lvl + (l.gr && it.gr > 0 ? ', game ready (+' + it.gr + '%)' : ''));
    L.push('   ' + qtyStr(it, l.qty) + ' × ' + money(unit) + (isHour(it) ? '/ч' : '') + k + ' = ' + money(lineSum(l)));
  });
  if (!n) L.push('(позиций нет)');
  L.push('');
  L.push('Стоимость работ: ' + money(c.work));
  if (c.urg) L.push('Срочность (+' + s.urg + '%): +' + money(c.urg));
  if (c.rig) L.push('Права на использование (+' + s.rig + '%): +' + money(c.rig));
  if (c.prem) L.push('Приоритетное выполнение (+25%): +' + money(c.prem));
  if (c.wear + c.tax) L.push('Сопутствующие расходы (оборудование, ПО, налог): +' + money(c.wear + c.tax));
  if (c.dis) L.push('Скидка (−' + s.dis + '%): −' + money(c.dis));
  L.push('');
  L.push('ИТОГО: ' + money(c.total));
  return L.join('\r\n');
}

// ---------- редактор прайса ----------
function renderPrice() {
  const box = $('plist'); box.innerHTML = '';
  state.catalog.forEach((it) => {
    const r = el('div', 'pitem');
    const nm = el('input', 'nm'); nm.value = it.name; nm.oninput = () => { it.name = nm.value; };
    const x = el('button', 'x', '✕'); x.onclick = () => { state.catalog = state.catalog.filter((q) => q !== it); renderPrice(); };
    const cat = el('select', 'cat');
    CATS.forEach((c) => { const o = el('option', '', c); o.value = c; cat.appendChild(o); });
    cat.value = it.cat; cat.onchange = () => { it.cat = cat.value; };
    r.append(nm, x, cat);
    const ps = [0, 1, 2].map((i) => {
      const p = el('input', 'pp'); p.type = 'number'; p.min = 0; p.value = it.p[i]; p.title = LV[i];
      p.oninput = () => { it.p[i] = Math.max(0, parseFloat(p.value) || 0); };
      return p;
    });
    r.append(...ps);
    const ty = el('select', 'ty');
    Object.entries(TYPES).forEach(([k, t]) => { const o = el('option', '', t); o.value = k; ty.appendChild(o); });
    ty.value = it.type;
    const gl = el('label', 'gr'); gl.append(document.createTextNode('Game ready, +%'));
    const gi = el('input'); gi.type = 'number'; gi.min = 0; gi.value = it.gr || 0; gi.title = '0 — не показывать галочку';
    gi.oninput = () => { it.gr = Math.max(0, parseFloat(gi.value) || 0); };
    gl.appendChild(gi);
    const sync = () => {
      ps[1].style.visibility = ps[2].style.visibility = hasLv(it) ? 'visible' : 'hidden';
      ps[0].title = isHour(it) ? '₽ за час' : hasLv(it) ? LV[0] : 'Цена';
      gl.style.display = isHour(it) ? 'none' : '';
    };
    ty.onchange = () => { it.type = ty.value; sync(); };
    r.append(ty, gl); sync();
    box.appendChild(r);
  });
}
function closePrice() {
  $('modal').hidden = true;
  save(); renderLib(); renderLines();
}

// ---------- кнопки ----------
$('btnMin').onclick = () => window.api.minimize();
$('btnClose').onclick = () => window.api.close();
const applyPin = () => { $('btnPin').classList.toggle('on', !!state.set.pin); window.api.pin(!!state.set.pin); };
$('btnPin').onclick = () => { state.set.pin = !state.set.pin; save(); applyPin(); };

// очистка в два клика, чтобы не стереть смету случайно
let clearT;
$('btnClear').onclick = () => {
  const b = $('btnClear');
  if (!state.lines.length) return;
  if (b.dataset.armed) {
    clearTimeout(clearT); delete b.dataset.armed; b.textContent = 'очистить';
    state.lines = []; save(); renderLines();
  } else {
    b.dataset.armed = '1'; b.textContent = 'точно?';
    clearT = setTimeout(() => { delete b.dataset.armed; b.textContent = 'очистить'; }, 2000);
  }
};
document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !$('modal').hidden) closePrice(); });
$('btnPrice').onclick = () => { renderPrice(); $('modal').hidden = false; };
$('btnDone').onclick = closePrice;
$('btnAdd').onclick = () => {
  state.catalog.push({ id: uid(), cat: state.cat === 'Все' ? CATS[0] : state.cat, name: 'Новый блок', p: [1000, 3000, 8000], type: 'lv' });
  renderPrice(); $('plist').scrollTop = $('plist').scrollHeight;
};
$('btnReset').onclick = () => {
  state.catalog = cloneDefaults(); renderPrice();
};
$('btnCopy').onclick = () => { window.api.copy(clientText()); toast('Скопировано'); };
$('btnSave').onclick = async () => {
  const ok = await window.api.saveText(clientText(), 'Расчёт.txt');
  if (ok) toast('Файл сохранён');
};

// ---------- старт ----------
renderChips(); renderLib(); initSettings(); applyPin();
