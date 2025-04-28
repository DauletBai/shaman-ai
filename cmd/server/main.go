// cmd/server/main.go
package main

import (
	"log"
	"log/slog"
	"net/http"
	"html/template"

	"shaman-ai/internal/config"
	"shaman-ai/internal/handlers"
)

var (
	appConfig *config.Config
	tmpl      *template.Template
)

func main() {
	config.InitLogger()

	var err error
	appConfig, err = config.LoadConfig("./configs/config.yaml")
	if err != nil {
		log.Fatalf("Ошибка загрузки конфига: %v", err)
	}

	slog.Info("Конфигурация загружена", "site_name", appConfig.SiteName, "year", appConfig.CurrentYear)

	// Настройка маршрутов
	mux := http.NewServeMux()

	// Обслуживание статики
	fs := http.FileServer(http.Dir("./static"))
	mux.Handle("/static/", http.StripPrefix("/static/", fs))

	mux.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		tmpl := template.Must(template.ParseFiles(
			"templates/base.html",
			"templates/parts/head.html",
			"templates/parts/header.html",
			"templates/parts/footer.html",
			"templates/pages/welcome.html",
		))

		data := map[string]interface{}{
			"SiteName":        appConfig.SiteName,
			"SiteDescription": appConfig.SiteDescription,
			"CurrentYear":     appConfig.CurrentYear,
		}
	
		if err := tmpl.ExecuteTemplate(w, "base.html", data); err != nil {
			slog.Error("Ошибка рендеринга страницы", "error", err)
			http.Error(w, "Внутренняя ошибка сервера", http.StatusInternalServerError)
		}
	})

	// Передаем шаблоны в хендлеры
	handlers.InitHandlers(appConfig, tmpl)

	// Роуты
	mux.HandleFunc("/api/dialogue", handlers.DialogueHandler)

	addr := ":8080"
	slog.Info("Запуск Shaman-AI сервера", "address", addr)
	if err := http.ListenAndServe(addr, mux); err != nil {
		slog.Error("Ошибка запуска сервера", "error", err)
	}
}