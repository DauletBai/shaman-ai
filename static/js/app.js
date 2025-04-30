// static/js/app.js
document.addEventListener('DOMContentLoaded', function () {
    const startButton = document.getElementById('start-button');
    let recognition;
    let isRecognizing = false;

    if (startButton) {
        startButton.addEventListener('click', () => {
            if (isRecognizing) {
                recognition.stop();
                isRecognizing = false;
                startButton.textContent = 'Start session';
                return;
            }

            startButton.textContent = 'Listening...';

            recognition = new webkitSpeechRecognition();
            recognition.lang = 'ru-RU';
            recognition.continuous = false;
            recognition.interimResults = false;
            isRecognizing = true;

            recognition.onresult = async (event) => {
                const transcript = Array.from(event.results)
                    .map(result => result[0].transcript)
                    .join(' ')
                    .trim();

                if (transcript) {
                    await sendDialogue(transcript);
                }
            };

            recognition.onerror = (event) => {
                console.error('Speech recognition error:', event.error);
                isRecognizing = false;
                startButton.textContent = 'Start session';
            };

            recognition.onend = () => {
                isRecognizing = false;
                startButton.textContent = 'Start session';
            };

            recognition.start();
        });
    }

    function startWaveAnimation() {
        document.querySelectorAll('.bar').forEach(bar => bar.classList.add('animate'));
    }

    function stopWaveAnimation() {
        document.querySelectorAll('.bar').forEach(bar => bar.classList.remove('animate'));
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

    async function sendDialogue(prompt) {
        try {
            const response = await fetch('/api/dialogue', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt })
            });

            if (!response.ok) {
                throw new Error(`Ошибка ответа от сервера: ${response.status}`);
            }

            const data = await response.json();
            await say(data.response);
        } catch (error) {
            console.error('Ошибка при запросе к API:', error);
        }
    }
});
