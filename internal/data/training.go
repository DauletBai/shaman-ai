// internal/data/training.go
package data

// TrainingPair представляет собой пару вопрос-ответ для обучения ИИ
type TrainingPair struct {
    Question string `json:"question"`
    Answer   string `json:"answer"`
}