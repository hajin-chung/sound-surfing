import { createSignal, onMount } from "solid-js";
import { Wave } from "./wave";

function App() {
  const frameRate = 30;
  const [wave, setWave] = createSignal<Wave>();
  let canvasRef: HTMLCanvasElement | undefined;

  onMount(() => {
    if (!canvasRef) return;
    const width = canvasRef.clientWidth;
    const height = canvasRef.clientHeight;

    canvasRef.width = width;
    canvasRef.height = height;

    const wave = new Wave(
      "https://cdn.pixabay.com/audio/2023/07/24/audio_65d744b9d0.mp3",
      canvasRef
    );
    setWave(wave);
    setInterval(() => {}, 1000 / frameRate);
  });

  return (
    <main class="w-full h-screen text-white flex flex-col items-center bg-black">
      <div class="h-10" />
      <p class="text-2xl italic font-bold">Sound Surfing</p>
      <div class="h-4" />
      <div class="p-4 bg-gray-800 rounded-lg flex gap-4">
        {wave()?.playing() ? (
          <button onClick={() => wave()?.stop()}>s</button>
        ) : (
          <button onClick={() => wave()?.play()}>p</button>
        )}
        <button>o</button>
      </div>
      <div class="h-4" />
      <div class="max-w-xl w-full h-full border-white border-[1px]">
        <canvas ref={canvasRef} class="w-full h-full" />
      </div>
      <div class="h-20" />
    </main>
  );
}

export default App;
