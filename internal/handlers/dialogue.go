// internal/handlers/dialogue.go
package handlers

import (
	"bytes"
	"encoding/json"
	"io"
	"mime/multipart"
	"net/http"
	"os"
)

var systemPrompt string

func LoadPrompt(path string) error {
	content, err := os.ReadFile(path)
	if err != nil {
		return err
	}
	systemPrompt = string(content)
	return nil
}

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

	audioData, err := io.ReadAll(file)
	if err != nil {
		http.Error(w, "Ошибка чтения файла", http.StatusInternalServerError)
		return
	}

	transcript, err := transcribeAudio(audioData)
	if err != nil {
		http.Error(w, "Ошибка распознавания речи", http.StatusInternalServerError)
		return
	}

	answer, err := generateAnswer(transcript)
	if err != nil {
		http.Error(w, "Ошибка генерации ответа", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{
		"answer": answer,
	})
}

func transcribeAudio(audioData []byte) (string, error) {
	body := &bytes.Buffer{}
	writer := multipart.NewWriter(body)
	part, _ := writer.CreateFormFile("audio", "audio.wav")
	part.Write(audioData)
	writer.Close()

	req, _ := http.NewRequest("POST", "http://localhost:11434/api/whisper", body)
	req.Header.Set("Content-Type", writer.FormDataContentType())

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	var result struct {
		Transcript string `json:"transcript"`
	}
	json.NewDecoder(resp.Body).Decode(&result)

	return result.Transcript, nil
}

func generateAnswer(question string) (string, error) {
	payload := map[string]string{
		"model":  "shaman",
		"prompt": systemPrompt + "\nПользователь сказал: " + question,
	}

	data, _ := json.Marshal(payload)

	resp, err := http.Post("http://localhost:11434/api/generate", "application/json", bytes.NewReader(data))
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	var result struct {
		Response string `json:"response"`
	}
	json.NewDecoder(resp.Body).Decode(&result)

	return result.Response, nil
}