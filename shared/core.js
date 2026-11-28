/* Shared helpers: language, theme, service worker, Pro unlock (Microsoft Store Digital Goods API). */
(function (global) {
  'use strict';
  const LANGS = ['ro', 'en', 'ru'];
  const STORE_BILLING = 'https://store.microsoft.com/billing';

  function store(key, val) {
    try {
      if (val === undefined) return localStorage.getItem(key);
      localStorage.setItem(key, val);
    } catch (e) { /* storage unavailable */ }
    return null;
  }

  function detectLang() {
    const saved = store('lang');
    if (LANGS.includes(saved)) return saved;
    const nav = (navigator.language || 'en').slice(0, 2).toLowerCase();
    return LANGS.includes(nav) ? nav : 'en';
  }

  const COMMON = {
    ro: { proTitle: 'Versiunea Pro', proBuy: 'Deblochează Pro', proStoreOnly: 'Pro se cumpără din aplicația instalată din Microsoft Store.', theme: 'Temă', language: 'Limba', privacy: 'Confidențialitate', offline: 'Funcționează și fără internet.', copy: 'Copiază', copied: 'Copiat', clear: 'Golește' },
    en: { proTitle: 'Pro version', proBuy: 'Unlock Pro', proStoreOnly: 'Pro can be bought in the app installed from the Microsoft Store.', theme: 'Theme', language: 'Language', privacy: 'Privacy', offline: 'Works offline too.', copy: 'Copy', copied: 'Copied', clear: 'Clear' },
    ru: { proTitle: 'Версия Pro', proBuy: 'Открыть Pro', proStoreOnly: 'Pro можно купить в приложении, установленном из Microsoft Store.', theme: 'Тема', language: 'Язык', privacy: 'Конфиденциальность', offline: 'Работает и без интернета.', copy: 'Копировать', copied: 'Скопировано', clear: 'Очистить' }
  };

  const Core = {
    lang: 'en',
    dict: {},
    t(key, vars) {
      const d = this.dict[this.lang] || {};
      let s = d[key] != null ? d[key] : (this.dict.en && this.dict.en[key] != null ? this.dict.en[key] : key);
      if (vars) for (const k in vars) s = s.split('{' + k + '}').join(vars[k]);
      return s;
    },
    applyI18n(root) {
      (root || document).querySelectorAll('[data-i18n]').forEach(el => { el.textContent = this.t(el.dataset.i18n); });
      (root || document).querySelectorAll('[data-i18n-ph]').forEach(el => { el.placeholder = this.t(el.dataset.i18nPh); });
      (root || document).querySelectorAll('[data-i18n-aria]').forEach(el => { el.setAttribute('aria-label', this.t(el.dataset.i18nAria)); });
      document.documentElement.lang = this.lang;
      const title = this.t('appName');
      if (title !== 'appName') document.title = title;
    },
    init(dict, onLang) {
      this.dict = {};
      for (const l of LANGS) this.dict[l] = Object.assign({}, COMMON[l], dict[l]);
      this.lang = detectLang();
      const sel = document.getElementById('lang');
      if (sel) {
        sel.value = this.lang;
        sel.addEventListener('change', () => {
          this.lang = sel.value; store('lang', this.lang); this.applyI18n(); if (onLang) onLang();
        });
      }
      const theme = store('theme');
      if (theme) document.documentElement.dataset.theme = theme;
      const tb = document.getElementById('theme');
      if (tb) tb.addEventListener('click', () => {
        const dark = document.documentElement.dataset.theme
          ? document.documentElement.dataset.theme === 'dark'
          : matchMedia('(prefers-color-scheme: dark)').matches;
        const next = dark ? 'light' : 'dark';
        document.documentElement.dataset.theme = next; store('theme', next);
      });
      this.applyI18n();
      if ('serviceWorker' in navigator && location.protocol !== 'file:') {
        navigator.serviceWorker.register('sw.js').catch(() => {});
      }
    },
    store,

    /* ---- Pro unlock ----
       In the Microsoft Store build, purchases go through the Store (Digital Goods API + Payment Request).
       On the plain web there is no billing service, so Pro stays locked and the UI points to the Store. */
    pro: { owned: false, available: false },
    async checkPro(sku) {
      this.pro.owned = store('pro:' + sku) === '1';
      if (!('getDigitalGoodsService' in window)) return this.pro;
      try {
        const svc = await window.getDigitalGoodsService(STORE_BILLING);
        this.pro.available = !!svc;
        if (svc) {
          const list = await svc.listPurchases();
          this.pro.owned = list.some(p => p.itemId === sku);
          store('pro:' + sku, this.pro.owned ? '1' : '0');
        }
      } catch (e) { /* offline or not a Store install: keep cached value */ }
      return this.pro;
    },
    async buyPro(sku) {
      if (!this.pro.available || typeof PaymentRequest === 'undefined') return false;
      try {
        const req = new PaymentRequest([{ supportedMethods: STORE_BILLING, data: { sku } }]);
        const res = await req.show();
        await res.complete('success');
        return (await this.checkPro(sku)).owned;
      } catch (e) { return false; }
    },
    /* Wires a standard Pro box: #proBox, #proBuy, #proStatus. */
    async wirePro(sku, onChange) {
      const box = document.getElementById('proBox');
      const buy = document.getElementById('proBuy');
      const status = document.getElementById('proStatus');
      const render = () => {
        if (!box) return;
        if (this.pro.owned) { box.classList.add('hidden'); }
        else {
          box.classList.remove('hidden');
          buy.disabled = !this.pro.available;
          status.textContent = this.pro.available ? '' : this.t('proStoreOnly');
        }
        if (onChange) onChange(this.pro.owned);
      };
      if (buy) buy.addEventListener('click', async () => { await this.buyPro(sku); render(); });
      await this.checkPro(sku);
      render();
    }
  };

  Core.LANGS = LANGS;
  Core.COMMON = COMMON;
  global.Core = Core;
})(typeof window !== 'undefined' ? window : globalThis);
