package main

import (
	"fmt"
	"log"

	"shaman-ai/internal/llm"
)

func main() {
	fmt.Println("Тест запроса к LLM через Ollama")

	prompt := "Как мне успокоиться после тяжёлого рабочего дня?"

	response, err := llm.GenerateResponse(prompt)
	if err != nil {
		log.Fatalf("Ошибка генерации ответа: %v", err)
	}

	fmt.Println("Ответ модели:")
	fmt.Println(response)
}