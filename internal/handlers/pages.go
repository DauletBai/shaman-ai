// internal/handlers/pages.go
package handlers

import (
	"fmt"
	"html/template"
	"log/slog"
	"net/http"
	"os"
	"path/filepath"

	"shaman-ai/internal/config" 
)

type AppHandlers struct {
	Config    *config.Config
	BaseTmpl  *template.Template 
	PagesPath string             
}

func NewAppHandlers(cfg *config.Config) (*AppHandlers, error) {
	baseTmpl, err := parseBaseTemplates("templates")
	if err != nil {
		return nil, fmt.Errorf("failed to parse base templates: %w", err)
	}

	return &AppHandlers{
		Config:    cfg,
		BaseTmpl:  baseTmpl,
		PagesPath: filepath.Join("templates", "pages"), 
	}, nil
}

func parseBaseTemplates(dir string) (*template.Template, error) {
	layoutFiles := []string{}
	baseFile := filepath.Join(dir, "base.html")
	if _, err := os.Stat(baseFile); os.IsNotExist(err) {
		return nil, fmt.Errorf("base template base.html not found")
	}
	layoutFiles = append(layoutFiles, baseFile)

	partFiles, _ := filepath.Glob(filepath.Join(dir, "parts", "*.html")) 
	layoutFiles = append(layoutFiles, partFiles...)

	slog.Info("Parsing layout files", "files", layoutFiles)

	tmpl, err := template.ParseFiles(layoutFiles...)
	if err != nil {
		return nil, fmt.Errorf("error parsing layout templates: %w", err)
	}
	slog.Info("Base HTML templates successfully parsed")
	return tmpl, nil
}

func (h *AppHandlers) renderPage(w http.ResponseWriter, pageName string, data map[string]interface{}) {
	pagePath := filepath.Join(h.PagesPath, pageName)
	if _, err := os.Stat(pagePath); os.IsNotExist(err) {
		slog.Error("Page template file not found", "page", pageName, "path", pagePath)
		http.Error(w, "Internal Server Error (Page Not Found)", http.StatusInternalServerError)
		return
	}

	tmpl, err := h.BaseTmpl.Clone()
	if err != nil {
		slog.Error("Failed to clone base template", "error", err)
		http.Error(w, "Internal Server Error", http.StatusInternalServerError)
		return
	}

	tmpl, err = tmpl.ParseFiles(pagePath)
	if err != nil {
		slog.Error("Failed to parse page template", "page", pageName, "path", pagePath, "error", err)
		http.Error(w, "Internal Server Error", http.StatusInternalServerError)
		return
	}

	err = tmpl.ExecuteTemplate(w, "base.html", data)
	if err != nil {
		slog.Error("Error executing template", "template", "base.html", "page", pageName, "error", err)
		if !isHeadersSent(w) {
			http.Error(w, "Internal Server Error", http.StatusInternalServerError)
		}
	}
}

func isHeadersSent(w http.ResponseWriter) bool {
	_, ok := w.(interface{ Status() int }) // Check if it's a ResponseWriter wrapper that tracks status
	return ok
}

func (h *AppHandlers) WelcomePageHandler(w http.ResponseWriter, r *http.Request) {
	if r.URL.Path != "/" {
		http.NotFound(w, r)
		return
	}
	data := map[string]interface{}{
		"SiteName":        h.Config.SiteName,
		"SiteDescription": h.Config.SiteDescription,
		"CurrentYear":     h.Config.CurrentYear,
		"IsDashboard":     false,
	}
	h.renderPage(w, "welcome.html", data) 
}

func (h *AppHandlers) DashboardPageHandler(w http.ResponseWriter, r *http.Request) {
	data := map[string]interface{}{
		"SiteName":        h.Config.SiteName,
		"SiteDescription": h.Config.SiteDescription,
		"CurrentYear":     h.Config.CurrentYear,
		"IsDashboard":     true,
		// TODO: Pass user ID
	}
	h.renderPage(w, "dashboard.html", data) 
}