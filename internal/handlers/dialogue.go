// internal/handleers/dialogue.go
package handlers

import (
	"encoding/json"
	"log/slog"
	"net/http"

	"shaman-ai/internal/config" 
	"shaman-ai/internal/db"     
)

type DialogueRequest struct {
	Prompt string `json:"prompt"` 
}

type DialogueResponse struct {
	Response string `json:"response"`
}

func DialogueHandler(appConfig *config.Config, systemPrompt string) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPost {
			slog.Warn("Неверный метод для /api/dialogue", "method", r.Method)
			http.Error(w, "Метод не поддерживается", http.StatusMethodNotAllowed)
			return
		}

		var req DialogueRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			slog.Error("Ошибка декодирования JSON в /api/dialogue", "error", err)
			http.Error(w, "Некорректный формат запроса", http.StatusBadRequest)
			return
		}
		if req.Prompt == "" {
			slog.Warn("Получен пустой промпт в /api/dialogue")
			http.Error(w, "Промпт не может быть пустым", http.StatusBadRequest)
			return
		}
		slog.Info("Получен запрос от пользователя", "prompt", req.Prompt)

		aiResponse, err := GenerateAIResponse(
			appConfig.Ollama.URL,
			appConfig.Ollama.Model,
			systemPrompt,
			req.Prompt,
		)
		if err != nil {
			slog.Error("Ошибка при генерации ответа ИИ", "error", err)
			http.Error(w, "Ошибка взаимодействия с ИИ", http.StatusInternalServerError)
			return
		}
		slog.Info("Сгенерирован ответ ИИ", "response", aiResponse)

		err = db.SaveDialogue(req.Prompt, aiResponse)
		if err != nil {
			slog.Error("Не удалось сохранить диалог в БД", "error", err)
		}

		resp := DialogueResponse{Response: aiResponse}
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK) 
		if err := json.NewEncoder(w).Encode(resp); err != nil {
			slog.Error("Ошибка кодирования JSON-ответа в /api/dialogue", "error", err)
		}
	}
}