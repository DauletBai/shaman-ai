// internal/handlers/pages.go
package handlers

import (
	"html/template"
	"net/http"
	"time"

	"shaman-ai/internal/config"
)

var (
	cfg  *config.Config
	tmpl *template.Template
)

func InitHandlers(c *config.Config, t *template.Template) {
	cfg = c
	tmpl = t
}

// WelcomeHandler обрабатывает запрос на главную страницу
func WelcomeHandler(w http.ResponseWriter, r *http.Request) {
	data := map[string]interface{}{
		"SiteName":        cfg.SiteName,
		"SiteDescription": cfg.SiteDescription,
		"CurrentYear":     time.Now().Year(),
	}

	err := tmpl.ExecuteTemplate(w, "base.html", data)
	if err != nil {
		http.Error(w, "Ошибка рендеринга страницы", http.StatusInternalServerError)
	}
}