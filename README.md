# PADEL CLAUB — Telegram Mini App

Admin Mini App для бота `@PadelMastersDev_bot`. Whoop-style тёмная тема, mobile-first. Сосуществует параллельно с боевым `@PadelMasters_bot` — использует **отдельную копию БД** (`padel-dev.db`), чтобы тесты Лизы не задевали реальные турниры.

## Структура репо

```
padel-mini-app/
├── design/   — дизайн-прототип из Claude Design (статика, Babel-standalone)
├── webapp/   — production фронт (Vite + React + TS), деплой на Vercel
└── backend/  — FastAPI на Ubuntu сервере, читает padel-dev.db (sandbox)
```

## Архитектура

```
Telegram Mini App (WebApp)
   ▼ статика
[Vercel] padel-app.vercel.app
   ▼ HTTPS API
[Cloudflare Tunnel] padel-api.cryptostart.my
   ▼
[Ubuntu] FastAPI :8001
   ▼
[Ubuntu] padel-dev.db (sandbox для Лизы)
```

Боевой `@PadelMasters_bot` продолжает работать на той же машине, использует свою `/home/ubuntu/padel-bot/padel.db`. Не трогаем.

## Как запустить локально (dev)

### Backend
```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8001
```

### Webapp
```bash
cd webapp
npm install
npm run dev
# открыть http://localhost:5173/
```

### Дизайн-прототип (если хочется посмотреть оригинальные мокапы)
```bash
cd design
python3 -m http.server 8080
# http://localhost:8080/
```

## Снимок БД с прода

При начале каждой сессии тестирования:
```bash
sqlite3 /home/ubuntu/padel-bot/padel.db ".backup '/home/ubuntu/padel-mini-app/padel-dev.db'"
```

Это безопасно — даже если у бота WAL и активные writers.
