const video = document.getElementById("video");
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const btnCapture = document.getElementById("btnCapture");
const btnDownload = document.getElementById("btnDownload");
const preview = document.getElementById("preview");
const btnToggleCamera = document.getElementById("btnToggleCamera");

let cameraStream = null;
let isCameraOn = true;
let latestMask = null;

const segmenter = new SelfieSegmentation({
  locateFile: (file) => {
    return `https://cdn.jsdelivr.net/npm/@mediapipe/selfie_segmentation/${file}`;
  },
});
segmenter.setOptions({ modelSelection: 1 });
segmenter.onResults(onResults);

function onResults(results) {
  latestMask = results.segmentationMask;
}

async function setupCamera() {
  cameraStream = await navigator.mediaDevices.getUserMedia({
    video: true,
    audio: false,
  });
  video.srcObject = cameraStream;
  return new Promise((resolve) => {
    video.onloadedmetadata = () => resolve();
  });
}

function stopCamera() {
  if (cameraStream) {
    cameraStream.getTracks().forEach((track) => track.stop());
    video.srcObject = null;
    latestMask = null; // limpiar para que no se siga procesando
  }
}

async function processVideo() {
  if (isCameraOn) {
    await segmenter.send({ image: video });
    requestAnimationFrame(processVideo);
  }
}

function drawPersonWithoutBackground() {
  if (!latestMask) return;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Guardar estado y aplicar transformación espejo horizontal
  ctx.save();
  ctx.translate(canvas.width, 0);  // Mueve el origen al lado derecho
  ctx.scale(-1, 1);                // Escala horizontal negativa para invertir

  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

  ctx.globalCompositeOperation = "destination-in";
  ctx.drawImage(latestMask, 0, 0, canvas.width, canvas.height);

  ctx.restore();                  // Restaurar estado para no afectar otras operaciones
  ctx.globalCompositeOperation = "source-over";
}


btnCapture.onclick = () => {
  drawPersonWithoutBackground();
  const dataURL = canvas.toDataURL("image/png");

  // Mostrar previsualización
  preview.src = dataURL;
  preview.style.display = "block";

  // Habilitar botón de descarga
  btnDownload.style.display = "inline-block";

  // Guardar temporalmente el DataURL para descarga
  btnDownload.dataset.url = dataURL;
};

btnDownload.onclick = () => {
  const a = document.createElement("a");
  a.href = btnDownload.dataset.url;
  a.download = "foto_sin_fondo.png";
  a.click();
};

btnToggleCamera.onclick = async () => {
  if (isCameraOn) {
    stopCamera();
    btnToggleCamera.textContent = "Activar Cámara";
    isCameraOn = false;
  } else {
    await setupCamera();
    video.play();
    isCameraOn = true;
    btnToggleCamera.textContent = "Desactivar Cámara";
    processVideo(); // reiniciar procesamiento al volver a encender
  }
};

async function main() {
  await setupCamera();
  video.play();
  processVideo();
}

main();
