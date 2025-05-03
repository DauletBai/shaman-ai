// static/js/player.js
export async function startPlayer(text) {
  try {
    const response = await fetch("/api/tts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });

    if (!response.ok) {
      throw new Error("Ошибка генерации аудио");
    }

    const blob = await response.blob();
    const url = URL.createObjectURL(blob);

    const audio = new Audio(url);
    await audio.play();
  } catch (err) {
    console.error("Ошибка воспроизведения аудио:", err.message);
  }
}

export { startPlayer };