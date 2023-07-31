import { createSignal, onCleanup, onMount } from "solid-js";
import { Wave } from "./wave";
import playIcon from "./assets/play.svg";
import pauseIcon from "./assets/pause.svg";
import uploadIcon from "./assets/upload.svg";
import resetIcon from "./assets/reset.svg";
import "./App.css";
import { JSX } from "solid-js/h/jsx-runtime";
import { initCanvas } from "./canvas";

function App() {
  const [url, setUrl] = createSignal<string | undefined>(
    "https://cdn.pixabay.com/audio/2021/11/01/audio_67c5757bac.mp3"
  );
  const [file, setFile] = createSignal<File>();
  const [wave, setWave] = createSignal<Wave>();
  const [intensity, setIntensity] = createSignal(4);
  const playing = () => wave()?.playing();
  let canvasRef: HTMLCanvasElement | undefined;

  onMount(() => {
    if (!canvasRef) return;
    const width = canvasRef.clientWidth;
    const height = canvasRef.clientHeight;

    canvasRef.width = width;
    canvasRef.height = height;

    initCanvas(canvasRef, intensity);
  });

  const cleanup = () => {
    wave()?.audioContext.close();
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
      setWave(new Wave(url(), file()));
    }

    wave()?.play();
  };

  const reset = () => {
    cleanup();
    setWave(undefined);
  };

  const upload: JSX.EventHandler<HTMLInputElement, InputEvent> = async (e) => {
    const file = e.currentTarget.files![0];
    setUrl(undefined);
    setFile(file);
  };

  return (
    <main class="w-full h-screen px-4 text-white flex flex-col items-center bg-black">
      <div class="h-10" />
      <p class="text-2xl italic font-bold">Sound Surfing</p>
      <div class="h-4" />
      <div class="flex items-center gap-4 max-w-lg w-full">
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
        <button onClick={reset} class="w-8 h-8 p-1">
          <img src={resetIcon} class="w-full h-full" />
        </button>
        <label class="w-8 h-8 p-1 cursor-pointer" for="upload">
          <img src={uploadIcon} class="w-full h-full" />
        </label>
        <input
          type="file"
          accept="audio/*"
          id="upload"
          onInput={upload}
          hidden
        />
      </div>
      <div class="h-2" />
      <div class="flex items-center gap-4 max-w-lg w-full justify-between flex-wrap">
        <div class="flex gap-4">
          <p>volume</p>
          <input
            class="range"
            type="range"
            min={0}
            max={100}
            value={wave()?.volume()}
            onInput={(e) => wave()?.setVolume(parseInt(e.target.value))}
          />
          <p>{wave()?.volume() ?? 50}</p>
        </div>
        <div class="flex gap-4">
          <p>intensity</p>
          <input
            class="range"
            type="range"
            min={0.0}
            max={10.0}
            step={0.1}
            value={intensity()}
            onInput={(e) => setIntensity(parseInt(e.target.value))}
          />
          <p>{intensity()}</p>
        </div>
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
