// static/js/init.js
import { sendToAPI } from "./api.js";
import { startRecording, stopRecording } from "./recorder.js";
import { startPlayer } from "./player.js";
import { startAnimation, stopAnimation } from "./animation.js";

document.addEventListener("DOMContentLoaded", () => {
  const startBtn = document.querySelector("#start-button");

  startBtn.addEventListener("click", async () => {
    try {
      startAnimation();
      const text = await startRecording(); // получаем распознанный текст

      if (!text || !text.trim()) {
        throw new Error("Речь не распознана");
      }

      const aiReply = await sendToAPI({ prompt: text });
      stopAnimation();

      console.log("Ответ ИИ:", aiReply);
      await startPlayer(aiReply); // озвучивает ответ
    } catch (err) {
      stopAnimation();
      console.error("Ошибка диалога:", err.message);
    }
  });
});
