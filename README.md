# Shaman AI

**Shaman AI** — Family AI assistant for psychological support.

## Tech stack:
- Go 1.24
- HTML5 + Bootstrap 5.3
- SQLite (while) / PostgreSQL (Later)
- Ollama LLM integration
- Static build, minimal dependencies

## Repository structure:
cmd/        - Entry point (Go server)
configs/    - Configuration files (yaml)
internal/   - Main business logic of the project
scripts/    - Launch scripts, migrations
static/     - Static files (css, js, svg, mp3)
templates/  - HTML templates
Makefile    - Automation of build and launch
README.md   - Project description

## How to run a project locally:

```bash
make start
# 1. Download and unzip the shanraq-ai project
# 2. Go to the project folder
cd shanraq-ai

# 3. Install Ollama (if you haven't already)
brew install ollama

# 4. Launch Ollama
ollama serve

# 5. Download the required model
ollama pull phi3

# 6. Install Go dependencies
go mod tidy

# 7. Start Shanraq AI server
make run

# 8. Open in browser
http://localhost:8080

# Shanraq-AI

Therapeutic AI assistant for calm voice sessions.

---

## Installation

1. Install Ollama:

```bash
brew install ollama