// internal/whisper/whisper.go
package whisper

import (
	"bytes"
	"os/exec"
)

func Recognize(audioPath string) (string, error) {
	cmd := exec.Command("whisper", audioPath, "--model", "small", "--language", "ru", "--output_format", "txt")
	var out bytes.Buffer
	cmd.Stdout = &out

	err := cmd.Run()
	if err != nil {
		return "", err
	}

	return out.String(), nil
}