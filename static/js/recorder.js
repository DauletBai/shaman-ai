// static/js/recorder.js
let mediaRecorder;
let audioChunks = [];

export async function startRecording() {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  mediaRecorder = new MediaRecorder(stream);

  mediaRecorder.ondataavailable = (event) => {
    audioChunks.push(event.data);
  };

  mediaRecorder.start();
}

export async function stopRecording() {
  return new Promise((resolve, reject) => {
    if (!mediaRecorder) return reject("Recorder not started");

    mediaRecorder.onstop = () => {
      const blob = new Blob(audioChunks, { type: "audio/webm" });
      audioChunks = [];
      resolve(blob);
    };

    mediaRecorder.stop();
  });
}

export { stopRecording, startRecording };