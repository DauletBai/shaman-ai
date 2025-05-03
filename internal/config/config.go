// internal/config/config.go
package config

import (
	"fmt"
	"log/slog"
	"os"
	"time"

	"gopkg.in/yaml.v3"
)

type OllamaConfig struct {
	URL              string `yaml:"url"`
	Model            string `yaml:"model"`
	SystemPromptPath string `yaml:"system_prompt_path"`
}

type DatabaseConfig struct {
	Path string `yaml:"path"`
}

type Config struct {
	SiteName        string         `yaml:"site_name"`
	SiteDescription string         `yaml:"site_description"`
	CurrentYear     int            `yaml:"current_year"`
	Ollama          OllamaConfig   `yaml:"ollama"`
	Database        DatabaseConfig `yaml:"database"`
}

func LoadConfig(filename string) (*Config, error) {
	file, err := os.Open(filename)
	if os.IsNotExist(err) {
		return nil, fmt.Errorf("файл конфигурации не найден: %s", filename)
	}
	if err != nil {
		return nil, fmt.Errorf("ошибка открытия файла конфигурации '%s': %w", filename, err)
	}
	defer file.Close()

	var cfg Config
	if err := yaml.NewDecoder(file).Decode(&cfg); err != nil {
		return nil, fmt.Errorf("ошибка декодирования YAML из файла '%s': %w", filename, err)
	}

	if cfg.CurrentYear == 0 {
		cfg.CurrentYear = time.Now().Year()
	}

	if cfg.Ollama.URL == "" {
		return nil, fmt.Errorf("поле 'ollama.url' не задано в конфигурации")
	}
	if cfg.Ollama.Model == "" {
		return nil, fmt.Errorf("поле 'ollama.model' не задано в конфигурации")
	}
	if cfg.Ollama.SystemPromptPath == "" {
		return nil, fmt.Errorf("поле 'ollama.system_prompt_path' не задано в конфигурации")
	}
    if cfg.Database.Path == "" {
		return nil, fmt.Errorf("поле 'database.path' не задано в конфигурации")
	}

	return &cfg, nil
}

func InitLogger() {
	logger := slog.New(slog.NewTextHandler(os.Stdout, &slog.HandlerOptions{
		Level: slog.LevelInfo, 
	}))
	slog.SetDefault(logger)
}