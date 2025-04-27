package llm

import (
	"bytes"
	"encoding/json"
	"errors"
	"net/http"
	"strings"
)

const ollamaURL = "http://localhost:11434/api/generate"

type OllamaRequest struct {
	Model  string `json:"model"`
	Prompt string `json:"prompt"`
	Stream bool   `json:"stream"`
}

// Определяем настроение клиента на основе ключевых слов
func detectEmotion(text string) string {
	lowered := strings.ToLower(text)

	happyWords := []string{"рад", "счастлив", "доволен", "благодарен", "вдохновлен", "замечательно"}
	sadWords := []string{"грусть", "плохо", "устал", "разочарован", "печаль", "тревога", "подавлен"}
	angryWords := []string{"злюсь", "раздражен", "возмущен", "несправедливость", "гнев"}

	for _, word := range happyWords {
		if strings.Contains(lowered, word) {
			return "happy"
		}
	}
	for _, word := range sadWords {
		if strings.Contains(lowered, word) {
			return "sad"
		}
	}
	for _, word := range angryWords {
		if strings.Contains(lowered, word) {
			return "angry"
		}
	}
	return "neutral"
}

// Строим промпт в зависимости от эмоции клиента
func BuildTherapyPrompt(clientText string) string {
	emotion := detectEmotion(clientText)

	baseContext := `
Ты — Shaman-AI, семейный ИИ-помощник.
Твоя задача — слушать клиента очень внимательно, говорить мягко, бережно, поддерживающе.
Ты не даёшь советов без запроса клиента.
Ты стараешься создать безопасную атмосферу доверия.`

	var emotionContext string

	switch emotion {
	case "happy":
		emotionContext = "Клиент чувствует радость или вдохновение. Поддержи это настроение, вырази искреннюю радость за клиента."
	case "sad":
		emotionContext = "Клиент испытывает грусть или тревогу. Ответь очень бережно, с поддержкой и теплом."
	case "angry":
		emotionContext = "Клиент выражает гнев или раздражение. Ответь спокойно, уравновешенно, помоги снизить напряжение."
	default:
		emotionContext = "Поддерживай общее спокойствие, проявляй внимание и интерес к чувствам клиента."
	}

	finalPrompt := baseContext + "\n\n" + emotionContext + "\n\nКлиент сказал:\n\n\"" + clientText + "\"\n\nОтветь как Shaman-AI."

	return finalPrompt
}

// Генерация ответа через Ollama
func GenerateResponse(clientText string) (string, error) {
	preparedPrompt := BuildTherapyPrompt(clientText)

	payload := OllamaRequest{
		Model:  "phi3:latest",
		Prompt: preparedPrompt,
		Stream: false,
	}
	body, _ := json.Marshal(payload)

	resp, err := http.Post(ollamaURL, "application/json", bytes.NewBuffer(body))
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	var result struct {
		Response string `json:"response"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return "", err
	}

	if result.Response == "" {
		return "", errors.New("пустой ответ от модели")
	}

	return result.Response, nil
}