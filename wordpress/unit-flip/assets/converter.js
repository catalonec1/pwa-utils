/* Unit Flip converter widget. Builds controls inside each .unit-flip-converter element. */
(function () {
	'use strict';
	var data = window.unitFlipData;
	if (!data) { return; }

	var FUEL = { kml: 100, mpg: 235.214583, mpgUK: 282.480936 };

	function toBase(cat, unit, v) {
		if (cat === 'temperature') { return unit === 'F' ? (v - 32) * 5 / 9 : unit === 'K' ? v - 273.15 : v; }
		if (cat === 'fuel') { return FUEL[unit] ? (v === 0 ? Infinity : FUEL[unit] / v) : v; }
		return v * data.units[cat][unit];
	}
	function fromBase(cat, unit, v) {
		if (cat === 'temperature') { return unit === 'F' ? v * 9 / 5 + 32 : unit === 'K' ? v + 273.15 : v; }
		if (cat === 'fuel') { return FUEL[unit] ? (v === 0 ? Infinity : FUEL[unit] / v) : v; }
		return v / data.units[cat][unit];
	}
	function convert(cat, from, to, v) { return fromBase(cat, to, toBase(cat, from, v)); }
	function format(n) {
		if (!isFinite(n)) { return n === Infinity ? '∞' : '—'; }
		if (n === 0) { return '0'; }
		var abs = Math.abs(n);
		if (abs >= 1e15 || abs < 1e-9) { return n.toExponential(5); }
		return String(Number(n.toPrecision(8)));
	}
	function el(tag, attrs) {
		var e = document.createElement(tag);
		Object.keys(attrs || {}).forEach(function (k) { e.setAttribute(k, attrs[k]); });
		return e;
	}
	var uid = 0;

	function build(root) {
		var cat = root.getAttribute('data-category');
		if (!data.units[cat]) { return; }
		var units = Object.keys(data.units[cat]);
		var id = 'unit-flip-' + (++uid);
		root.innerHTML = '';

		var title = el('div', { 'class': 'unit-flip-converter__title' });
		title.textContent = data.labels[cat] || cat;

		var input = el('input', { type: 'number', step: 'any', id: id + '-v', 'class': 'unit-flip-converter__value', inputmode: 'decimal' });
		input.value = root.getAttribute('data-value') || '1';
		var lv = el('label', { 'for': id + '-v', 'class': 'screen-reader-text' }); lv.textContent = data.i18n.value;

		function select(sfx, label, current) {
			var s = el('select', { id: id + sfx });
			units.forEach(function (u) {
				var o = el('option', { value: u }); o.textContent = data.symbols[u] || u;
				if (u === current) { o.selected = true; }
				s.appendChild(o);
			});
			var l = el('label', { 'for': id + sfx, 'class': 'screen-reader-text' }); l.textContent = label;
			return [l, s];
		}
		var f = select('-f', data.i18n.from, root.getAttribute('data-from'));
		var t = select('-t', data.i18n.to, root.getAttribute('data-to'));
		var swap = el('button', { type: 'button', 'class': 'unit-flip-converter__swap', 'aria-label': data.i18n.swap, title: data.i18n.swap });
		swap.textContent = '⇄';
		var out = el('output', { 'class': 'unit-flip-converter__result', 'for': id + '-v ' + id + '-f ' + id + '-t', 'aria-live': 'polite' });

		function update() {
			var raw = String(input.value).replace(',', '.');
			var v = parseFloat(raw);
			if (raw === '' || isNaN(v)) { out.textContent = '—'; return; }
			out.textContent = format(convert(cat, f[1].value, t[1].value, v)) + ' ' + (data.symbols[t[1].value] || t[1].value);
		}
		swap.addEventListener('click', function () {
			var a = f[1].value; f[1].value = t[1].value; t[1].value = a; update();
		});
		[input, f[1], t[1]].forEach(function (c) { c.addEventListener('input', update); c.addEventListener('change', update); });

		var row = el('div', { 'class': 'unit-flip-converter__row' });
		[lv, input, f[0], f[1], swap, t[0], t[1]].forEach(function (c) { row.appendChild(c); });
		root.appendChild(title);
		root.appendChild(row);
		root.appendChild(out);
		update();
	}

	function boot() {
		var nodes = document.querySelectorAll('.unit-flip-converter');
		for (var i = 0; i < nodes.length; i++) { build(nodes[i]); }
	}
	if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', boot); } else { boot(); }
	window.unitFlipConvert = convert;
})();
