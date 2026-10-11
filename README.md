# Калькулятор — версия для iPhone (PWA)

`app.js` и `style.css` — копии из `../price_widget`. Логику и общий вид правь там и копируй сюда.
Здесь только своё: `index.html`, `api.js` (замена Electron), `mobile.css`, `manifest.webmanifest`, `sw.js`, `icons/`.

## Выложить на GitHub Pages

1. github.com → **New repository** → имя, например `price-calc`, **Public** → Create.
2. На странице репозитория: **uploading an existing file** → перетащи всё содержимое этой папки (вместе с `icons`) → Commit.
3. **Settings → Pages** → Source: *Deploy from a branch*, Branch: `main` / `(root)` → Save.
4. Через 1–2 минуты сайт откроется по адресу `https://<логин>.github.io/price-calc/`.

## Установить на iPhone

Safari → открыть адрес → **Поделиться** → **На экран «Домой»**.

## Обновить

Загрузи изменённые файлы в репозиторий так же (с заменой). Телефон подтянет их при следующем запуске с интернетом.
