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

const synth = ('speechSynthesis' in window) ? window.speechSynthesis : null;
let currentUtterance = null;

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

function speakText(text) {
    if (!synth || !text) {
        return;
    }

    if (synth.speaking) {
        console.warn('Синтезатор уже говорит, отмена предыдущей фразы.');
        synth.cancel();
    }

    const cleanText = text.replace(/[\*\_]/g, '');

    currentUtterance = new SpeechSynthesisUtterance(cleanText);
    currentUtterance.lang = 'ru-RU';

    currentUtterance.onerror = (event) => {
        console.error('Ошибка SpeechSynthesis:', event.error);
        speechError.textContent = 'Ошибка синтеза речи.';
        speechError.style.display = 'block';
    };
    currentUtterance.onend = () => {
        console.log('Синтез речи завершен.');
        currentUtterance = null;
    };

    console.log('Запуск синтеза речи...');
    setTimeout(() => { synth.speak(currentUtterance); }, 150);
}

function stopSpeech() {
    if (synth && synth.speaking) {
        console.log('Остановка синтеза речи.');
        synth.cancel();
        currentUtterance = null;
    }
}

chatForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const userText = userInput.value.trim();
    if (!userText) return;

    addMessage('User', userText);
    userInput.value = '';
    setLoading(true);
    speechError.style.display = 'none';

    stopSpeech(); 

    try {
        const aiResponse = await sendPromptToAPI(userText);
        addMessage('Assistant', aiResponse);
        speakText(aiResponse); 

    } catch (error) {
        const errorMsg = `Произошла ошибка: ${error.message}. Попробуйте еще раз.`;
        addMessage('Assistant', errorMsg);
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
        let transcript = event.results[0][0].transcript.trim();
        console.log('Распознано (очищено):', transcript);
        userInput.value = transcript;
        userInput.focus();
    };
    recognition.onerror = (event) => {
         console.error('Ошибка SpeechRecognition:', event.error);
         let errorMessage = 'Произошла ошибка распознавания.';
         speechError.textContent = errorMessage;
         speechError.style.display = 'block';
         stopRecordingVisuals();
    };
    recognition.onend = () => {
         console.log('Распознавание завершено.');
         stopRecordingVisuals();
    };

} else {
    console.warn("Web Speech API (Recognition) не поддерживается этим браузером.");
    if (recordButton) recordButton.style.display = 'none';
}

function stopRecordingVisuals() {
     isRecording = false;
     if (micIcon) {
         micIcon.classList.remove('bi-stop-circle-fill', 'text-danger');
         micIcon.classList.add('bi-mic-fill');
     }
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
             } catch (error) { /*...*/ }
         } else {
             recognition.stop();
             console.log('Остановка записи вручную...');
         }
    });
}

if (!synth) {
     console.warn("Web Speech API (Synthesis) не поддерживается этим браузером.");
     // Можно добавить сообщение для пользователя или скрыть элементы управления TTS, если они будут
}

console.log("Логика чата инициализирована.");
userInput.focus();