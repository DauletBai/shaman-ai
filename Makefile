# Makefile for Ollama
install-ollama:
	brew install ollama

start-ollama:
	ollama serve

pull-model:
	ollama pull phi3

run:
	go run ./cmd/server/main.go
