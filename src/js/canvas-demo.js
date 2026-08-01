// Minimal <canvas> demo, kept under 15 lines per the assignment's limit.
const demoCanvas = document.getElementById("demo-canvas");
if (demoCanvas && demoCanvas.getContext) {
  const ctx = demoCanvas.getContext("2d");
  ctx.fillStyle = "#12314f";
  ctx.fillRect(10, 10, 110, 60);
  ctx.strokeStyle = "#d4622b";
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(200, 55, 40, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillText("canvas 2D context demo", 60, 100);
}
