# 1. Скачать и распаковать проект shanraq-ai
# 2. Перейти в папку проекта
cd shanraq-ai

# 3. Установить Ollama (если ещё не стоит)
brew install ollama

# 4. Запустить Ollama
ollama serve

# 5. Скачать нужную модель
ollama pull phi3

# 6. Установить зависимости Go
go mod tidy

# 7. Запустить сервер Shanraq-AI
make run

# 8. Открыть в браузере
http://localhost:8080

# Shanraq-AI

Терапевтический ИИ-помощник для спокойных голосовых сессий.

---

## Установка

1. Установите Ollama:

```bash
brew install ollama