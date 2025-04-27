// internal/tts/tts.go
package tts

import (
	"os/exec"
)

func Speak(text string) error {
	cmd := exec.Command("say", text)
	return cmd.Run()
}