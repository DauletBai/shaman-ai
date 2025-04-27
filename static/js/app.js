// app.js
let mediaRecorder;
let audioChunks = [];
let recognition;
let isListening = false;
let stopRequested = false;
let backgroundMusic = document.getElementById('background-music');
let lastTranscriptTime = Date.now();
let silenceTimer = null;

async function startSession() {
    await say("Здравствуйте, я Shaman, ваш ИИ-помощник. Пожалуйста, закройте глаза и расскажите, что вас беспокоит. Скажите 'я закончил' для ответа, или 'на сегодня хватит' чтобы завершить.");
    startRecognitionAndRecording();
}

function say(text) {
    return new Promise((resolve) => {
        const utter = new SpeechSynthesisUtterance(text);
        utter.lang = 'ru-RU';
        utter.onstart = startWaveAnimation;
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

        if (transcript.includes('я закончил')) {
            handleFinishWithAnswer();
        } else if (transcript.includes('на сегодня хватит') || transcript.includes('продолжим завтра')) {
            handleImmediateEnd();
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

async function handleFinishWithAnswer() {
    console.log("Обработка завершения с ответом...");
    stopListening();
    await processAudio();
    await say("Хотите продолжить разговор или завершим сессию?");
    waitForContinueOrExit();
}

async function handleImmediateEnd() {
    console.log("Немедленное завершение сессии...");
    stopListening();
    await say("Хорошо, сессия завершена. Будьте здоровы!");
    setTimeout(() => {
        window.location.reload();
    }, 3000);
}

async function waitForContinueOrExit() {
    try {
        await startRecognitionAndRecording();
    } catch (error) {
        console.error("Ошибка при возобновлении сессии:", error);
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
                try { await backgroundMusic.play(); } catch (err) { console.warn("Не удалось запустить музыку:", err); }
                await say(data.answer);
                await fadeOutMusic();
            }
        } else {
            console.error("Ошибка сервера:", response.status);
        }
    } catch (error) {
        console.error("Ошибка при отправке аудио:", error);
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
            say("Я вас слушаю...");
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
    }
};
