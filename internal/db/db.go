// internal/db/db.go
package db

import (
	"database/sql"
	"fmt"
	"log/slog"
	"time"

	_ "github.com/mattn/go-sqlite3"
)

var DB *sql.DB

func InitDB(dbPath string) error {
	var err error
	DB, err = sql.Open("sqlite3", dbPath)
	if err != nil {
		return fmt.Errorf("ошибка открытия файла БД '%s': %w", dbPath, err)
	}

	if err = DB.Ping(); err != nil {
		return fmt.Errorf("ошибка подключения к БД '%s': %w", dbPath, err)
	}

	query := `
	CREATE TABLE IF NOT EXISTS dialogues (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		user_prompt TEXT NOT NULL,
		ai_response TEXT NOT NULL,
		created_at DATETIME DEFAULT CURRENT_TIMESTAMP
	);
	`
	_, err = DB.Exec(query)
	if err != nil {
		DB.Close()
		return fmt.Errorf("ошибка создания таблицы 'dialogues': %w", err)
	}

	slog.Info("База данных успешно инициализирована", "path", dbPath)
	return nil
}

func SaveDialogue(userPrompt, aiResponse string) error {
	if DB == nil {
		return fmt.Errorf("база данных не инициализирована")
	}

	query := `INSERT INTO dialogues (user_prompt, ai_response, created_at) VALUES (?, ?, ?)`
	_, err := DB.Exec(query, userPrompt, aiResponse, time.Now())
	if err != nil {
		return fmt.Errorf("ошибка сохранения диалога в БД: %w", err)
	}
	return nil
}