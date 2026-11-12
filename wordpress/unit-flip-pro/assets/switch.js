/* Unit Flip Pro: lets visitors choose metric, US or both. The choice is kept in localStorage. */
(function () {
	'use strict';
	var KEY = 'unitFlipSystem';
	function read() { try { return localStorage.getItem(KEY) || 'both'; } catch (e) { return 'both'; } }
	function save(v) { try { localStorage.setItem(KEY, v); } catch (e) { /* private mode */ } }

	function apply(pick) {
		var spans = document.querySelectorAll('.unit-flip--auto');
		for (var i = 0; i < spans.length; i++) {
			var s = spans[i];
			var orig = s.querySelector('.unit-flip__orig');
			var alt = s.querySelector('.unit-flip__alt');
			if (!orig || !alt) { continue; }
			if (!s.hasAttribute('data-uf-orig-html')) { s.setAttribute('data-uf-orig-html', orig.innerHTML); }
			var flip = pick !== 'both' && s.getAttribute('data-uf-system') !== pick;
			if (pick === 'both') {
				orig.innerHTML = s.getAttribute('data-uf-orig-html');
				alt.hidden = false;
				s.removeAttribute('title');
			} else if (flip) {
				orig.textContent = s.getAttribute('data-uf-alt');
				alt.hidden = true;
				s.setAttribute('title', s.getAttribute('data-uf-orig-html').replace(/<[^>]*>/g, ''));
			} else {
				orig.innerHTML = s.getAttribute('data-uf-orig-html');
				alt.hidden = true;
				s.removeAttribute('title');
			}
		}
		var buttons = document.querySelectorAll('.unit-flip-switch [data-uf-pick]');
		for (var j = 0; j < buttons.length; j++) {
			buttons[j].setAttribute('aria-pressed', buttons[j].getAttribute('data-uf-pick') === pick ? 'true' : 'false');
		}
	}

	function boot() {
		document.addEventListener('click', function (e) {
			var b = e.target.closest && e.target.closest('.unit-flip-switch [data-uf-pick]');
			if (!b) { return; }
			var pick = b.getAttribute('data-uf-pick');
			save(pick);
			apply(pick);
		});
		apply(read());
	}
	if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', boot); } else { boot(); }
})();
