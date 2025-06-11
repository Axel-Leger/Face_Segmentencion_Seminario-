const video = document.getElementById("video");
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const btnCapture = document.getElementById("btnCapture");
const btnDownload = document.getElementById("btnDownload");
const preview = document.getElementById("preview");

async function setupCamera() {
  const stream = await navigator.mediaDevices.getUserMedia({
    video: true,
    audio: false,
  });
  video.srcObject = stream;
  return new Promise((resolve) => {
    video.onloadedmetadata = () => resolve();
  });
}

const segmenter = new SelfieSegmentation({
  locateFile: (file) => {
    return `https://cdn.jsdelivr.net/npm/@mediapipe/selfie_segmentation/${file}`;
  },
});
segmenter.setOptions({ modelSelection: 1 });
segmenter.onResults(onResults);

let latestMask = null;

function onResults(results) {
  latestMask = results.segmentationMask;
}

async function processVideo() {
  await segmenter.send({ image: video });
  requestAnimationFrame(processVideo);
}

function drawPersonWithoutBackground() {
  if (!latestMask) return;

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

  ctx.globalCompositeOperation = "destination-in";
  ctx.drawImage(latestMask, 0, 0, canvas.width, canvas.height);

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

async function main() {
  await setupCamera();
  video.play();
  processVideo();
}

main();