import { createSignal } from "solid-js";

export class Wave {
  waves: Uint8Array[];
  waveGap: number;
  loading: () => boolean;
  setLoading: (v: boolean) => void;
  playing: () => boolean;
  setPlaying: (v: boolean) => void;
  ended: () => boolean;
  setEnded: (v: boolean) => void;
  audioContext: AudioContext;
  analyser: AnalyserNode;
  source: AudioBufferSourceNode;

  canvas: HTMLCanvasElement;
  canvasContext: CanvasRenderingContext2D;
  width: number;
  height: number;
  yOffset: number;
  ySpeed: number;

  loop: number | undefined;

  constructor(url: string, canvas: HTMLCanvasElement) {
    const [loading, setLoading] = createSignal(false);
    const [playing, setPlaying] = createSignal(false);
    const [ended, setEnded] = createSignal(false);

    this.loading = loading;
    this.setLoading = setLoading;
    this.playing = playing;
    this.setPlaying = setPlaying;
    this.ended = ended;
    this.setEnded = setEnded;

    this.waves = [];
    this.waveGap = 20;

    this.audioContext = new AudioContext();
    this.analyser = this.audioContext.createAnalyser();
    this.analyser.connect(this.audioContext.destination);
    this.analyser.fftSize = 2048;
    this.source = this.audioContext.createBufferSource();

    this.loadAudio(url);

    this.canvas = canvas;
    this.canvasContext = canvas.getContext("2d")!;
    this.width = canvas.width;
    this.height = canvas.height;
    this.yOffset = 0;
    this.ySpeed = 100;
  }

  async loadAudio(url: string) {
    const res = await fetch(url);
    const arrayBuffer = await res.arrayBuffer();
    const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);

    this.source.buffer = audioBuffer;
    this.source.connect(this.analyser);
    this.setLoading(false);
    this.source.onended = () => this.onEnded();

    let time = performance.now();
    this.loop = setInterval(() => {
      const currentTime = performance.now();
      const dt = currentTime - time;
      this.draw(dt / 1000);
      time = currentTime;
    }, 1000 / 60);
  }

  play() {
    if (this.loading()) return;
    if (this.playing()) return;

    this.setPlaying(true);
    this.audioContext.resume();
    this.source.start(this.audioContext.currentTime);
  }

  stop() {
    if (this.loading()) return;
    if (!this.playing()) return;

    this.setPlaying(false);
    this.audioContext.suspend();
  }

  onEnded() {
    console.log("ended!")
    this.setEnded(true);
    this.setPlaying(false);
  }

  updateWaves() {
    const bufferLength = this.analyser.frequencyBinCount;
    const buffer = new Uint8Array(bufferLength);
    this.analyser.getByteTimeDomainData(buffer);
    // this.analyser.getByteFrequencyData(buffer);

    this.waves.push(buffer);
    const maxWavesLength = this.height / this.waveGap + 1;
    if (maxWavesLength < this.waves.length) {
      this.waves.splice(0, this.waves.length - maxWavesLength);
    }
  }

  draw(dt: number) {
    const ctx = this.canvasContext;
    this.yOffset += this.ySpeed * dt;
    if (this.yOffset >= -this.waveGap) {
      this.yOffset -= this.waveGap;
      this.updateWaves();
    }

    ctx.clearRect(0, 0, this.width, this.height);
    const wavesLength = this.waves.length;
    this.waves.forEach((wave, _waveIndex) => {
      const length = wave.length;
      const waveIndex = wavesLength - _waveIndex - 1;

      ctx.beginPath();
      wave.forEach((v, idx) => {
        const x = (this.width / length) * idx;
        const y =
          this.height -
          (this.waveGap * waveIndex + (v / 255) * this.waveGap + this.yOffset);

        if (idx === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      });
      ctx.strokeStyle = "#fff";
      ctx.stroke();
    });
  }
}
