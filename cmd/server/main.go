// cmd/server/main.go
package main

import (
	"fmt"
	"log/slog"
	"net/http"

	"shaman-ai/internal/config" 
	"shaman-ai/internal/db"
	"shaman-ai/internal/handlers"
	"shaman-ai/internal/utils"
)

func main() {
	config.InitLogger()
	slog.Info("Запуск сервера shaman-ai...")

	configPath := "configs/config.yaml" 
	cfg, err := config.LoadConfig(configPath)
	if err != nil {
		slog.Error("Критическая ошибка: не удалось загрузить конфигурацию", "path", configPath, "error", err)
		fmt.Printf("Критическая ошибка: не удалось загрузить конфигурацию: %v\n", err)
		return
	}
	slog.Info("Конфигурация успешно загружена", "site_name", cfg.SiteName)

	systemPrompt, err := utils.LoadSystemPrompt(cfg.Ollama.SystemPromptPath)
	if err != nil {
		slog.Error("Критическая ошибка: не удалось загрузить системный промпт", "path", cfg.Ollama.SystemPromptPath, "error", err)
		fmt.Printf("Критическая ошибка: не удалось загрузить системный промпт: %v\n", err)
		return
	}
	slog.Info("Системный промпт успешно загружен")

	err = db.InitDB(cfg.Database.Path)
	if err != nil {
		slog.Error("Критическая ошибка: не удалось инициализировать базу данных", "path", cfg.Database.Path, "error", err)
		fmt.Printf("Критическая ошибка: не удалось инициализировать базу данных: %v\n", err)
		// return 
	}
	if db.DB != nil {
		defer db.DB.Close()
	}

	appHandlers, err := handlers.NewAppHandlers(cfg)
	if err != nil {
		slog.Error("Критическая ошибка: не удалось инициализировать обработчики", "error", err)
		fmt.Printf("Критическая ошибка: не удалось инициализировать обработчики: %v\n", err)
		return
	}

	mux := http.NewServeMux()

	fs := http.FileServer(http.Dir("./static"))
	mux.Handle("/static/", http.StripPrefix("/static/", fs))
	slog.Info("Статические файлы настроены для раздачи из папки ./static")

	mux.HandleFunc("/", appHandlers.WelcomePageHandler)           
	mux.HandleFunc("/dashboard", appHandlers.DashboardPageHandler) 

	mux.HandleFunc("/api/dialogue", handlers.DialogueHandler(cfg, systemPrompt))

	// !! TODO: Добавить маршруты для /login, /register, /logout, /api/sessions !!

	addr := ":8080"
	slog.Info("Сервер shaman-ai запущен и слушает", "address", fmt.Sprintf("http://localhost%s", addr))
	err = http.ListenAndServe(addr, mux)
	if err != nil {
		slog.Error("Критическая ошибка: не удалось запустить HTTP-сервер", "address", addr, "error", err)
		fmt.Printf("Критическая ошибка: не удалось запустить HTTP-сервер: %v\n", err)
	}
}