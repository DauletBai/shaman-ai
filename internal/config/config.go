// internal/config/config.go
package config

import (
	"fmt"
	"log/slog"
	"os"
	"time"

	"gopkg.in/yaml.v3"
)

type Config struct {
	SiteName        string `yaml:"site_name"`
	SiteDescription string `yaml:"site_description"`
	CurrentYear     int    `yaml:"current_year"`
}

func LoadConfig(filename string) (*Config, error) {
	file, err := os.Open(filename)
	if os.IsNotExist(err) {
		return nil, fmt.Errorf("файл конфигурации не найден: %s", filename)
	}
	if err != nil {
		return nil, err
	}
	defer file.Close()

	var cfg Config
	if err := yaml.NewDecoder(file).Decode(&cfg); err != nil {
		return nil, err
	}

	if cfg.CurrentYear == 0 {
		cfg.CurrentYear = time.Now().Year()
	}

	return &cfg, nil
}

func InitLogger() {
	logger := slog.New(slog.NewTextHandler(os.Stdout, &slog.HandlerOptions{
		Level: slog.LevelInfo,
	}))
	slog.SetDefault(logger)
}