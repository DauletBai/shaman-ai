package handlers

import (
	"encoding/json"
	"io"
	"net/http"
	"os"

	"shaman-ai/internal/whisper"
	"shaman-ai/internal/llm"
)

func DialogueHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Метод не поддерживается", http.StatusMethodNotAllowed)
		return
	}

	file, _, err := r.FormFile("audio")
	if err != nil {
		http.Error(w, "Ошибка получения файла", http.StatusBadRequest)
		return
	}
	defer file.Close()

	tmpFile := "./temp_audio.wav"
	out, _ := os.Create(tmpFile)
	defer out.Close()

	io.Copy(out, file)

	text, err := whisper.Recognize(tmpFile)
	if err != nil {
		http.Error(w, "Ошибка распознавания речи", http.StatusInternalServerError)
		return
	}

	answer, err := llm.GenerateResponse(text)
	if err != nil {
		http.Error(w, "Ошибка генерации ответа", http.StatusInternalServerError)
		return
	}

	response := map[string]string{
		"answer": answer,
	}

	json.NewEncoder(w).Encode(response)
}