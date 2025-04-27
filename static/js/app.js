let mediaRecorder;
let audioChunks = [];
let recognition;
let isListening = false;
let stopRequested = false;
let backgroundMusic = document.getElementById('background-music');
let lastTranscriptTime = Date.now();
let silenceTimer = null;

async function startSession() {
    await say("Здравствуйте, я Shaman работающий на Искуственном Интелекте, ваш семейный помощник. Пожалуйста, закройте глаза, расслабьтесь и расскажите, что вас беспокоит. Когда захотите получить ответ, скажите 'я закончил'. Чтобы завершить сессию, скажите 'на сегодня хватит' или 'продолжим завтра'.");
    startRecognitionAndRecording();
}

function say(text) {
    return new Promise((resolve) => {
        const utter = new SpeechSynthesisUtterance(text);
        utter.lang = 'ru-RU';
        // Когда ИИ начинает говорить — волны анимируются
        utter.onstart = () => {
            startWaveAnimation();
        };
        // Когда ИИ заканчивает говорить — волны замирают
        utter.onend = () => {
            stopWaveAnimation();
            resolve();
        };

        speechSynthesis.speak(utter);
    });
}

async function startRecognitionAndRecording() {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaRecorder = new MediaRecorder(stream);
    audioChunks = [];

    mediaRecorder.ondataavailable = event => {
        audioChunks.push(event.data);
    };

    mediaRecorder.onstop = processAudio;
    mediaRecorder.start();
    startWaveAnimation();
    startSpeechRecognition();
}

function startSpeechRecognition() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognition = new SpeechRecognition();
    recognition.lang = 'ru-RU';
    recognition.interimResults = true;
    recognition.continuous = true;

    recognition.onresult = event => {
        const transcript = Array.from(event.results)
            .map(result => result[0])
            .map(result => result.transcript)
            .join(' ')
            .toLowerCase();

        console.log("Распознано:", transcript);

        if (transcript.trim() !== "") {
            lastTranscriptTime = Date.now();
            startWaveAnimation();
            resetSilenceTimer();
        }

        if (transcript.includes('я закончил') || transcript.includes('на сегодня хватит') || transcript.includes('продолжим завтра')) {
            stopListening();
        }
    };

    recognition.start();
    isListening = true;

    monitorSilence();
}

function stopListening() {
    if (isListening) {
        recognition.stop();
        isListening = false;
    }
    stopRecording();
}

function stopRecording() {
    if (mediaRecorder && mediaRecorder.state !== "inactive") {
        mediaRecorder.stop();
        stopWaveAnimation();
    }
}

async function processAudio() {
    const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
    const formData = new FormData();
    formData.append("audio", audioBlob, "voice.wav");

    try {
        const response = await fetch("/api/dialogue", {
            method: "POST",
            body: formData
        });

        if (response.ok) {
            const data = await response.json();

            if (data.answer) {
                try {
                    await backgroundMusic.play();
                } catch (err) {
                    console.warn("Не удалось автоматически запустить музыку:", err);
                }

                await say(data.answer);
                await fadeOutMusic();

                await say("Я внимательно слушаю вас. Продолжайте, если хотите.");
                startRecognitionAndRecording();
            }
        } else {
            console.error("Ошибка ответа от сервера:", response.status);
        }
    } catch (error) {
        console.error("Ошибка отправки аудио:", error);
    }
}

async function fadeOutMusic() {
    const fadeDuration = 5000;
    const fadeSteps = 50;
    const fadeStepTime = fadeDuration / fadeSteps;
    const volumeStep = backgroundMusic.volume / fadeSteps;

    return new Promise((resolve) => {
        let fadeInterval = setInterval(() => {
            if (backgroundMusic.volume > 0.01) {
                backgroundMusic.volume -= volumeStep;
            } else {
                clearInterval(fadeInterval);
                backgroundMusic.pause();
                backgroundMusic.currentTime = 0;
                backgroundMusic.volume = 0.2;
                resolve();
            }
        }, fadeStepTime);
    });
}

function startWaveAnimation() {
    document.querySelectorAll('.bar').forEach(bar => {
        bar.classList.add('animate');
        bar.classList.remove('paused');
    });
}

function stopWaveAnimation() {
    document.querySelectorAll('.bar').forEach(bar => {
        bar.classList.remove('animate');
        bar.classList.add('paused');
    });
}

function monitorSilence() {
    if (silenceTimer) clearInterval(silenceTimer);

    silenceTimer = setInterval(() => {
        const now = Date.now();
        const silenceDuration = now - lastTranscriptTime;

        if (silenceDuration > 3000 && silenceDuration < 20000) {
            stopWaveAnimation();
        }

        if (silenceDuration >= 20000 && isListening) {
            console.log("Долгое молчание...");
            stopWaveAnimation();
            isListening = false;
            recognition.stop();
            say("Я внимательно вас слушаю...");
            setTimeout(() => {
                startRecognitionAndRecording();
            }, 5000);
        }
    }, 4000);
}

function resetSilenceTimer() {
    lastTranscriptTime = Date.now();
}

window.onload = () => {
    const startButton = document.getElementById('start-button');
    if (startButton) {
        startButton.onclick = () => {
            startButton.classList.add('fade-out');
            setTimeout(() => {
                startButton.style.display = 'none';
                startSession();
            }, 500);
        };
    } else {
        startSession();
    }
};

window.onload = () => {
    const authContainer = document.getElementById('auth-container');
    if (authContainer) {
        loadLoginForm();
    }
};

function loadLoginForm() {
    const authContainer = document.getElementById('auth-container');
    authContainer.innerHTML = `
        <form id="login-form">
            <div class="mb-3">
                <label for="loginEmail" class="form-label">Email</label>
                <input type="email" class="form-control" id="loginEmail" required>
            </div>
            <div class="mb-3">
                <label for="loginPassword" class="form-label">Пароль</label>
                <input type="password" class="form-control" id="loginPassword" required>
            </div>
            <button type="submit" class="btn btn-primary w-100">Войти</button>
        </form>
        <div class="text-center mt-3">
            <a href="#" onclick="loadRegisterForm()">Нет аккаунта? Регистрация</a>
        </div>
    `;
}

function loadRegisterForm() {
    const authContainer = document.getElementById('auth-container');
    authContainer.innerHTML = `
        <form id="register-form">
            <div class="mb-3">
                <label for="registerName" class="form-label">Имя</label>
                <input type="text" class="form-control" id="registerName" required>
            </div>
            <div class="mb-3">
                <label for="registerEmail" class="form-label">Email</label>
                <input type="email" class="form-control" id="registerEmail" required>
            </div>
            <div class="mb-3">
                <label for="registerPassword" class="form-label">Пароль</label>
                <input type="password" class="form-control" id="registerPassword" required>
            </div>
            <button type="submit" class="btn btn-success w-100">Зарегистрироваться</button>
        </form>
        <div class="text-center mt-3">
            <a href="#" onclick="loadLoginForm()">Уже есть аккаунт? Войти</a>
        </div>
    `;
}