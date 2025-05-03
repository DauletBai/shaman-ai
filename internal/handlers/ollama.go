// internal/handlers/ollama.go
package handlers

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"log/slog"
	"net/http"
	"time"
	"strings"
)

type OllamaRequest struct {
	Model   string                 `json:"model"`          
	Prompt  string                 `json:"prompt"`         
	Stream  bool                   `json:"stream"`           
	Options map[string]interface{} `json:"options,omitempty"` 
}

type OllamaResponse struct {
	Model     string    `json:"model"`
	CreatedAt time.Time `json:"created_at"`
	Response  string    `json:"response"` 
	Done      bool      `json:"done"`
}

func GenerateAIResponse(ollamaURL, model, systemPrompt, userPrompt string) (string, error) {

	promptCore := systemPrompt

	instruction := "\n\nЗАДАНИЕ: Напиши следующий ответ ассистента (Помощник) на последнее сообщение Пользователя, строго следуя правилам и структуре ответа, указанным в системных инструкциях. Сгенерируй ТОЛЬКО ОДНУ реплику Помощника и остановись."

	dialogueContext := "\n\nПользователь: " + userPrompt

	assistantLabel := "\nПомощник:"

	fullPrompt := promptCore + instruction + dialogueContext + assistantLabel

	stopSequences := []string{"Пользователь:", "\nПользователь:", "User:", "\nUser:"}

	requestPayload := OllamaRequest{
		Model:  model,
		Prompt: fullPrompt,
		Stream: false,
		Options: map[string]interface{}{ 
			"stop": stopSequences,
		},
	}

	jsonData, err := json.Marshal(requestPayload)
	if err != nil {
		return "", fmt.Errorf("ошибка кодирования запроса для Ollama: %w", err)
	}

	apiURL := fmt.Sprintf("%s/api/generate", ollamaURL)

	slog.Debug("Отправка запроса к Ollama", "url", apiURL, "model", model, "stop_sequences", stopSequences)
	resp, err := http.Post(apiURL, "application/json", bytes.NewBuffer(jsonData))
	if err != nil {
		return "", fmt.Errorf("ошибка отправки запроса к Ollama API (%s): %w", apiURL, err)
	}
	defer resp.Body.Close()

	bodyBytes, err := io.ReadAll(resp.Body)
	if err != nil {
		return "", fmt.Errorf("ошибка чтения ответа от Ollama: %w", err)
	}

	if resp.StatusCode != http.StatusOK {
		slog.Error("Ollama вернул ошибку", "status_code", resp.StatusCode, "response_body", string(bodyBytes))
		return "", fmt.Errorf("ошибка от Ollama: статус %d, тело ответа: %s", resp.StatusCode, string(bodyBytes))
	}

	var ollamaResp OllamaResponse
	if err := json.Unmarshal(bodyBytes, &ollamaResp); err != nil {
		slog.Error("Не удалось декодировать JSON от Ollama", "response_body", string(bodyBytes), "error", err)
		return "", fmt.Errorf("ошибка декодирования ответа от Ollama: %w", err)
	}

	cleanedResponse := ollamaResp.Response
	for _, stop := range stopSequences {
		if suffixIndex := len(cleanedResponse) - len(stop); suffixIndex >= 0 && cleanedResponse[suffixIndex:] == stop {
			cleanedResponse = cleanedResponse[:suffixIndex]
			break 
		}
	}
	cleanedResponse = strings.TrimSpace(cleanedResponse)


	slog.Info("Сгенерирован ответ ИИ", "response", cleanedResponse) 
	return cleanedResponse, nil
}