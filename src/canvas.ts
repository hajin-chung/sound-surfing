import { listen } from "./util";

export function initCanvas(canvas: HTMLCanvasElement, intensity: () => number) {
  const ctx = canvas.getContext("2d")!;

  ctx.translate(0.5, 0.5);
  const width = canvas.width;
  const height = canvas.height;
  const ySpeed = 0.17;
  const waveGap = 20;
  let waves: { data: Uint8Array; offset: number }[] = [];
  listen("wave", (data) => {
    waves.push({ data, offset: 0 });
    console.log(waves);
  });

  function draw(dt: number) {
    waves = waves.filter(({ offset }) => offset < height);

    const wavePaths: { stroke: Path2D; fill: Path2D }[] = [];
    waves.forEach((wave, _waveIndex) => {
      const length = wave.data.length;

      const wavePath = new Path2D();
      wave.data.forEach((v, idx) => {
        const x = (width / (length - 1)) * idx;
        const y =
          height - (((v - 128) / 128) * waveGap * intensity() + wave.offset);

        if (idx === 0) {
          wavePath.moveTo(x, y);
        } else {
          wavePath.lineTo(x, y);
        }
      });

      const fillPath = new Path2D(wavePath);
      fillPath.lineTo(width, height);
      fillPath.lineTo(0, height);
      fillPath.closePath();
      wavePaths.push({ stroke: wavePath, fill: fillPath });
    });

    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = "#000";
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 2;
    wavePaths.forEach(({ stroke, fill }) => {
      ctx.fill(fill);
      ctx.stroke(stroke);
    });

    waves.forEach((wave) => {
      wave.offset += ySpeed * dt;
    });
  }

  let time = performance.now();
  function step(currentTime: number) {
    const dt = currentTime - time;
    time = currentTime;
    draw(dt);
    requestAnimationFrame(step);
  }

  requestAnimationFrame(step);
}
