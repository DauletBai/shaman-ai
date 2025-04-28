// static/js/app.js — Голосовое общение с Shaman-AI

let recognition;
let isListening = false;

window.onload = () => {
    const startButton = document.getElementById('start-button');
    if (startButton) {
        startButton.onclick = () => {
            startButton.classList.add('fade-out');
            setTimeout(() => {
                startButton.style.display = 'none';
                startSession();
            }, 5000);
        };
    }
};

async function startSession() {
    await say("Здравствуйте, я Shaman, ваш цифровой помощник. Прежде чем мы начнём наш терапевтический сеанс, позвольте ознакомить вас с инструкцией. Когда закончите говорить, скажите \"я закончил\" для моего ответа, или \"на сегодня хватит\" чтобы завершить сессию. Скажите, с какой проблемой вы обратились ко мне.");
    startSpeechRecognition();
    await say("Очень хорошо. Давайте начнём. В начале, сделайте глубокий вздох и на выдохе, закройте глаза. И, позвольте всем своим мышцам расслабиться.");
}

function startSpeechRecognition() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognition = new SpeechRecognition();
    recognition.lang = 'ru-RU';
    recognition.interimResults = false;
    recognition.continuous = false;

    recognition.onresult = async (event) => {
        const transcript = Array.from(event.results)
            .map(result => result[0].transcript)
            .join(' ')
            .trim();

        console.log("Распознано:", transcript);

        if (transcript) {
            await sendDialogue(transcript);
        }
    };

    recognition.onerror = (event) => {
        console.error("Ошибка распознавания:", event.error);
    };

    recognition.onend = () => {
        console.log("Распознавание завершено.");
    };

    recognition.start();
    isListening = true;
}

async function sendDialogue(userText) {
    try {
        const response = await fetch("/api/dialogue", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ user_text: userText })
        });

        if (!response.ok) {
            console.error("Ошибка ответа от сервера:", response.status);
            return;
        }

        const data = await response.json();
        console.log("Ответ от Shaman-AI:", data.answer);

        await say(data.answer);

        // После ответа — снова начать слушать пользователя
        setTimeout(() => {
            startSpeechRecognition();
        }, 10000);

    } catch (error) {
        console.error("Ошибка отправки диалога:", error);
    }
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
