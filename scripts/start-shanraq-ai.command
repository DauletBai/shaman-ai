#!/bin/bash
echo "Проверка Ollama..."
if ! pgrep -x "ollama" > /dev/null
then
  echo "Запуск Ollama..."
  ollama serve &
  sleep 5
else
  echo "Ollama уже работает."
fi

echo "Запуск Shanraq-AI сервера..."
make run &

sleep 2
echo "Открытие браузера..."
open http://localhost:8080