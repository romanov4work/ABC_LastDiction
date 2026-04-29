# Backend для Whisper

## Запуск сервера:

```bash
cd backend
python server.py
```

Сервер запустится на http://localhost:5000

## Запуск через Ngrok (для доступа из интернета):

1. Скачай ngrok: https://ngrok.com/download
2. Запусти в отдельном терминале:
```bash
ngrok http 5000
```

3. Скопируй URL типа `https://abc123.ngrok-free.app`
4. Вставь этот URL в фронт (game.js)

## API endpoints:

- `GET /health` - проверка что сервер работает
- `POST /transcribe` - распознавание речи
  - Принимает: `audio` (файл)
  - Возвращает: `{"text": "распознанный текст", "success": true}`

## Модель:
- Whisper **large** (самая точная, ~3GB)
- Язык: русский
