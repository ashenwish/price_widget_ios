'use strict';
// Замена Electron-моста (preload.js) для браузера — app.js остаётся общим с десктопом.

function copyFallback(text) {
  const t = document.createElement('textarea');
  t.value = text; t.setAttribute('readonly', ''); t.style.position = 'fixed'; t.style.opacity = '0';
  document.body.appendChild(t); t.select(); t.setSelectionRange(0, text.length);
  document.execCommand('copy'); t.remove();
}

window.api = {
  minimize() {},
  close() {},
  pin() {},
  copy(text) {
    if (navigator.clipboard) navigator.clipboard.writeText(text).catch(() => copyFallback(text));
    else copyFallback(text);
  },
  // iOS: системное меню «Поделиться» (Telegram, Заметки, почта…); иначе — скачивание .txt
  async saveText(text, name) {
    if (navigator.share) {
      try { await navigator.share({ title: name.replace(/\.txt$/, ''), text }); return true; }
      catch (e) { return false; }
    }
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob(['﻿' + text], { type: 'text/plain;charset=utf-8' }));
    a.download = name; a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    return true;
  },
};

if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(() => {});
