// static/js/chat.js
import { sendPromptToAPI } from './api.js';

const chatBox = document.getElementById('chat-box');
const chatForm = document.getElementById('chat-form');
const userInput = document.getElementById('user-input');
const sendButton = document.getElementById('send-button');
const loadingIndicator = document.getElementById('loading-indicator');
const recordButton = document.getElementById('record-button'); 
const micIcon = document.getElementById('mic-icon');        
const speechError = document.getElementById('speech-error'); 

function addMessage(sender, text) {
    const messageDiv = document.createElement('div');
    messageDiv.classList.add('message', sender.toLowerCase()); 

    const badge = document.createElement('span');
    badge.classList.add('badge', 'me-2');
    badge.textContent = sender === 'User' ? 'Вы' : 'Shaman'; 

     if (sender === 'User') {
        badge.classList.add('bg-success'); 
    } else {
        badge.classList.add('bg-info');
    }

    const textSpan = document.createElement('span');
    textSpan.innerHTML = text.replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\n/g, '<br>');

    messageDiv.appendChild(badge);
    messageDiv.appendChild(textSpan);
    chatBox.appendChild(messageDiv);
    chatBox.scrollTop = chatBox.scrollHeight;
}

function setLoading(isLoading) {
    if (isLoading) {
        loadingIndicator.style.display = 'block';
        sendButton.disabled = true;
        userInput.disabled = true;
        recordButton.disabled = true; 
    } else {
        loadingIndicator.style.display = 'none';
        sendButton.disabled = false;
        userInput.disabled = false;
        recordButton.disabled = false; 
        userInput.focus();
    }
}

chatForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const userText = userInput.value.trim();
    if (!userText) return;
    addMessage('User', userText);
    userInput.value = '';
    setLoading(true);
    try {
        const aiResponse = await sendPromptToAPI(userText);
        addMessage('Assistant', aiResponse);
    } catch (error) {
        addMessage('Assistant', `Произошла ошибка: ${error.message}. Попробуйте еще раз.`);
        console.error("Ошибка в процессе диалога:", error);
    } finally {
        setLoading(false);
    }
});

userInput.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        chatForm.requestSubmit();
    }
});

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
let recognition = null;
let isRecording = false;

if (SpeechRecognition) {
    recognition = new SpeechRecognition();
    recognition.continuous = false; 
    recognition.lang = 'ru-RU';    
    recognition.interimResults = false; 

    recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        console.log('Распознано:', transcript);
        // Добавляем распознанный текст в поле ввода
        // Можно добавить к существующему тексту или заменить:
        // userInput.value += (userInput.value ? ' ' : '') + transcript; // Добавить
        userInput.value = transcript; 
        userInput.focus(); 
    };

    recognition.onerror = (event) => {
        console.error('Ошибка SpeechRecognition:', event.error);
        let errorMessage = 'Произошла ошибка распознавания.';
        if (event.error === 'no-speech') {
            errorMessage = 'Речь не распознана. Попробуйте еще раз.';
        } else if (event.error === 'audio-capture') {
            errorMessage = 'Не удалось получить доступ к микрофону.';
        } else if (event.error === 'not-allowed') {
            errorMessage = 'Доступ к микрофону запрещен.';
        }
        speechError.textContent = errorMessage;
        speechError.style.display = 'block';
        stopRecordingVisuals(); 
    };

    recognition.onend = () => {
        console.log('Распознавание завершено.');
        stopRecordingVisuals();
    };

} else {
    console.warn("Web Speech API не поддерживается этим браузером.");
    if (recordButton) {
        recordButton.style.display = 'none';
    }
}

function stopRecordingVisuals() {
    isRecording = false;
    if (micIcon) {
        micIcon.classList.remove('bi-stop-circle-fill', 'text-danger'); 
        micIcon.classList.add('bi-mic-fill'); 
    }
     // Можно убрать disabled, если хотим разрешить сразу новый ввод
     // userInput.disabled = false;
     // sendButton.disabled = false;
}

if (recordButton && recognition) {
    recordButton.addEventListener('click', () => {
        speechError.style.display = 'none';

        if (!isRecording) {
            try {
                recognition.start();
                isRecording = true;
                console.log('Начало записи...');
                micIcon.classList.remove('bi-mic-fill');
                micIcon.classList.add('bi-stop-circle-fill', 'text-danger');
                // Можно блокировать поле ввода и кнопку отправки во время записи
                // userInput.disabled = true;
                // sendButton.disabled = true;
            } catch (error) {
                console.error("Не удалось начать запись:", error);
                speechError.textContent = 'Не удалось начать запись.';
                speechError.style.display = 'block';
                isRecording = false; 
            }
        } else {
            recognition.stop(); 
            console.log('Остановка записи вручную...');
        }
    });
}

console.log("Логика чата инициализирована.");
userInput.focus();