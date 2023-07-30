import { createSignal, onCleanup, onMount } from "solid-js";
import { Wave } from "./wave";
import playIcon from "./assets/play.svg";
import pauseIcon from "./assets/pause.svg";
import uploadIcon from "./assets/upload.svg";

function App() {
  const [url, setUrl] = createSignal(
    "https://cdn.pixabay.com/audio/2021/11/01/audio_67c5757bac.mp3"
  );
  const [wave, setWave] = createSignal<Wave>();
  const playing = () => wave()?.playing();
  let canvasRef: HTMLCanvasElement | undefined;

  onMount(() => {
    if (!canvasRef) return;
    const width = canvasRef.clientWidth;
    const height = canvasRef.clientHeight;

    canvasRef.width = width;
    canvasRef.height = height;
  });

  const cleanup = () => {
    const handle = wave()?.loop;
    if (handle) cancelAnimationFrame(handle);
  };

  onCleanup(cleanup);

  const stop = () => {
    wave()?.stop();
  };

  const play = () => {
    if (!canvasRef) return;

    if (!wave() || wave()?.ended()) {
      cleanup();
      setWave(new Wave(url(), canvasRef));
    }

    wave()?.play();
  };

  const upload = () => {};

  return (
    <main class="w-full h-screen text-white flex flex-col items-center bg-black">
      <div class="h-10" />
      <p class="text-2xl italic font-bold">Sound Surfing</p>
      <div class="h-4" />
      <div class="p-4 flex items-center gap-4 max-w-lg w-full">
        <input
          class="outline-none border-[1px] border-white p-1 font-white bg-black w-full"
          type="text"
          value={url()}
          onInput={(e) => setUrl(e.currentTarget.value)}
        />
        {playing() ? (
          <button onClick={stop} class="w-8 h-8 p-1">
            <img src={pauseIcon} class="w-full h-full" />
          </button>
        ) : (
          <button onClick={play} class="w-8 h-8 p-1">
            <img src={playIcon} class="w-full h-full" />
          </button>
        )}
        <button onClick={upload} class="w-8 h-8 p-1">
          <img src={uploadIcon} class="w-full h-full" />
        </button>
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
