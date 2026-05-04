# PADEL CLAUB — Telegram Mini App

Admin Mini App для бота `@PadelMastersDev_bot`, дополняющего основной `@PadelMasters_bot`. Whoop-style тёмная тема, mobile-first.

## Текущий статус

Это **дизайн-прототип из Claude Design** — React-компоненты, отрисованные на Figma-style canvas (`design-canvas.jsx`). Все экраны из ТЗ есть:

- 8.1 Home (active + empty)
- 8.2 Live Round
- 8.3 Court Detail / Result Entry
- 8.4 Tournament Finished
- 8.5 Players Library / 8.6 Player Edit
- 8.7 New Tournament Wizard (9 steps)
- 8.8 History / 8.9 Tournament Detail / 8.10 Round Detail
- States: skeleton / empty / error / edge cases
- Foundations: tokens, level badges, ring sizes
- Interactive prototype (Home → Live Round → Court Detail → Result)

## Как запустить локально

Прототип использует Babel standalone — никакой сборки не требуется:

```bash
cd frontend
python3 -m http.server 8080
# открыть http://localhost:8080/
```

## Структура

```
frontend/
├── index.html              # entry, подключает все jsx через babel-standalone
├── design-canvas.jsx       # Figma-style canvas с pan/zoom для отображения экранов
└── src/
    ├── tokens.jsx          # design tokens (T.bg, T.accent, levels, ...)
    ├── data.jsx            # mock data (PLAYERS, COURTS, LEADERBOARD)
    ├── components.jsx      # Ring, LevelBadge, SideBadge, CourtCard, Phone, ...
    ├── screens-1.jsx       # Home, Live Round
    ├── screens-2.jsx       # Court Detail, Finished, Players, Player Edit
    ├── screens-wizard.jsx  # New Tournament Wizard (9 steps)
    ├── screens-history.jsx # History, Tournament Detail, Round Detail, States
    └── prototype.jsx       # Интерактивный прототип
```

## Roadmap → production

Текущий код — **прототип без bundler'а**. Чтобы стать настоящей Telegram Mini App:

1. Конвертировать в Vite + React + TypeScript
2. Заменить `window.X` globals на правильные ES модули (import/export)
3. Подключить `@telegram-apps/sdk` (BackButton, MainButton, HapticFeedback, theme)
4. Подключить backend API (FastAPI на сервере, та же `padel.db` что у бота)
5. Настроить Telegram WebApp initData валидацию (HMAC по токену)
6. Деплой фронта на Vercel
7. Привязать URL к боту через BotFather (`/setmenubutton`)
