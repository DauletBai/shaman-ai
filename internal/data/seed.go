package data

import (
	"encoding/json"
	"fmt"
	"os"
)

// Message структура одного диалога
type Message struct {
	Role    string `json:"role"`
	Content string `json:"content"`
}

// LoadDialogues загружает обучающие диалоги из JSON-файла
func LoadDialogues(filePath string) ([]Message, error) {
	file, err := os.ReadFile(filePath)
	if err != nil {
		return nil, fmt.Errorf("ошибка чтения файла диалогов: %w", err)
	}

	var dialogues []Message
	if err := json.Unmarshal(file, &dialogues); err != nil {
		return nil, fmt.Errorf("ошибка разбора JSON: %w", err)
	}

	return dialogues, nil
}